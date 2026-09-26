using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ZHome.API.Data;
using ZHome.API.Models;
using ZHome.API.Services;

// Cho phép Npgsql xử lý DateTime kiểu cũ (Unspecified/Local) giống SQL Server
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CẤU HÌNH DATABASE (PostgreSQL / Supabase)
// ==========================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ZHomeDbContext>(options =>
{
    if (!string.IsNullOrEmpty(connectionString))
    {
        if (connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase) || 
            connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorNumbersToAdd: null);
            });
        }
        else
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
            });
        }
    }
});

// ==========================================
// 2. CẤU HÌNH CORS (CHO PHÉP FRONTEND RENDER & LOCALHOST)
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                    "https://zhome-fe.onrender.com",
                    "http://localhost:4200"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ==========================================
// 3. ĐĂNG KÝ CÁC DỊCH VỤ (DEPENDENCY INJECTION)
// ==========================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

// Các services nghiệp vụ
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<MatchingService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Cấu hình cài đặt thanh toán (SePay & PayOS) từ appsettings.json
builder.Services.Configure<SePaySettings>(builder.Configuration.GetSection("SePay"));
builder.Services.Configure<PayOSSettings>(builder.Configuration.GetSection("PayOS"));

// Các service thanh toán (SePay & PayOS)
builder.Services.AddScoped<ISePayService, SePayService>();
builder.Services.AddScoped<IPayOSService, PayOSService>();
builder.Services.AddSingleton<PaymentOrderStore>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ==========================================
// 4. CẤU HÌNH SWAGGER UI
// ==========================================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ZHome API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "JWT Authentication",
        Description = "Nhập token JWT: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };
    c.AddSecurityDefinition(securityScheme.Reference.Id, securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

// ==========================================
// 5. CẤU HÌNH JWT AUTHENTICATION & RATE LIMITING
// ==========================================
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ZHome_SuperSecretKeyThatIsAtLeast32BytesLongForSecurity_2026";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ZHome.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ZHome.Client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ==========================================
// 5.1 CẤU HÌNH RATE LIMITING (CHỐNG SPAM & BRUTE FORCE)
// ==========================================
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Quá nhiều yêu cầu",
            message = "Hệ thống phát hiện tần suất gửi yêu cầu quá nhanh từ thiết bị của bạn. Vui lòng thử lại sau 1 phút."
        }, cancellationToken: token);
    };

    // Chặn spam đăng ký tài khoản (Tối đa 3 request / 1 phút / IP)
    options.AddPolicy("RegisterRateLimit", httpContext =>
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ipAddress,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // Chặn dò mật khẩu Brute-force Login (Tối đa 5 lần thử / 1 phút / IP)
    options.AddPolicy("LoginRateLimit", httpContext =>
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ipAddress,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

// ==========================================
// 6. BUILD APP
// ==========================================
var app = builder.Build();

// ==========================================
// 7. DI TRÚ CƠ SỞ DỮ LIỆU TỰ ĐỘNG
// ==========================================
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ZHomeDbContext>();
        if (dbContext.Database.IsNpgsql())
        {
            dbContext.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS public.notifications (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) NOT NULL DEFAULT 'System',
                    target_url VARCHAR(255) NULL,
                    reference_id BIGINT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_notifications_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON public.notifications(user_id);
                CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON public.notifications(is_read);

                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matching_profiles') THEN
                        ALTER TABLE public.matching_profiles ADD COLUMN IF NOT EXISTS title VARCHAR(255);
                        ALTER TABLE public.matching_profiles ADD COLUMN IF NOT EXISTS university VARCHAR(150);
                        ALTER TABLE public.matching_profiles ADD COLUMN IF NOT EXISTS has_room BOOLEAN NOT NULL DEFAULT FALSE;
                        ALTER TABLE public.matching_profiles ADD COLUMN IF NOT EXISTS address VARCHAR(255);
                        ALTER TABLE public.matching_profiles ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
                        ALTER TABLE public.matching_profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
                    END IF;

                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_bills') THEN
                        ALTER TABLE public.monthly_bills ADD COLUMN IF NOT EXISTS proof_image_url VARCHAR(500);
                    END IF;

                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
                        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
                        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
                        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100);
                        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_qr_url VARCHAR(500);
                    END IF;
                END $$;
            ");
        }

        // Tự động seed bổ sung đầy đủ danh sách Xã/Thị trấn/Phường cho tất cả 30 quận huyện Hà Nội
        await LocationSeeder.SeedMissingLocationsAsync(dbContext);

        // Tự động seed/cập nhật tài khoản Quản trị viên (Admin)
        await AdminSeeder.SeedAdminUserAsync(dbContext);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB Auto-Migration Warning] {ex.Message}");
    }
}

// ==========================================
// 8. CẤU HÌNH PIPELINE MIDDLEWARE
// ==========================================
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ZHome API v1");
    c.RoutePrefix = "swagger";
});

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        if (exceptionHandlerPathFeature?.Error != null)
        {
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                error = exceptionHandlerPathFeature.Error.Message,
                detail = exceptionHandlerPathFeature.Error.InnerException?.Message
            });
            await context.Response.WriteAsync(result);
        }
    });
});

app.UseStaticFiles();

app.UseRouting();

// CORS bắt buộc đặt giữa UseRouting và UseAuthentication
app.UseCors("AllowFrontend");

// Kích hoạt Rate Limiter chống spam request và DDoS/Brute-force
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();