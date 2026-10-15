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
builder.Services.AddScoped<IMediaStorageService, MediaStorageService>();
builder.Services.AddScoped<IBillService, BillService>();

// Cấu hình cài đặt thanh toán (SePay & PayOS) từ appsettings.json
builder.Services.Configure<SePaySettings>(builder.Configuration.GetSection("SePay"));
builder.Services.Configure<PayOSSettings>(builder.Configuration.GetSection("PayOS"));

// Các service thanh toán (SePay & PayOS)
builder.Services.AddScoped<ISePayService, SePayService>();
builder.Services.AddScoped<IPayOSService, PayOSService>();
builder.Services.AddSingleton<PaymentOrderStore>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

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

        // Cho phép SignalR WebSockets xác thực qua Query String access_token
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
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

                CREATE TABLE IF NOT EXISTS public.favorites (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    room_id BIGINT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_favorites_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
                    CONSTRAINT fk_favorites_rooms FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ix_favorites_user_id ON public.favorites(user_id);
                CREATE INDEX IF NOT EXISTS ix_favorites_room_id ON public.favorites(room_id);

                CREATE TABLE IF NOT EXISTS public.user_sessions (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    session_token VARCHAR(100) NOT NULL,
                    user_id BIGINT NULL,
                    user_role VARCHAR(50) NOT NULL DEFAULT 'Guest',
                    ip_address VARCHAR(100) NULL,
                    user_agent VARCHAR(500) NULL,
                    device_type VARCHAR(50) NULL,
                    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    duration_seconds INT NOT NULL DEFAULT 0,
                    page_count INT NOT NULL DEFAULT 1
                );
                CREATE INDEX IF NOT EXISTS ix_user_sessions_session_token ON public.user_sessions(session_token);
                CREATE INDEX IF NOT EXISTS ix_user_sessions_started_at ON public.user_sessions(started_at);

                CREATE TABLE IF NOT EXISTS public.page_view_logs (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    session_token VARCHAR(100) NOT NULL,
                    user_id BIGINT NULL,
                    user_role VARCHAR(50) NOT NULL DEFAULT 'Guest',
                    page_url VARCHAR(255) NOT NULL,
                    page_title VARCHAR(255) NOT NULL,
                    page_category VARCHAR(100) NOT NULL DEFAULT 'Other',
                    referrer_url VARCHAR(500) NULL,
                    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    duration_seconds INT NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS ix_page_view_logs_session_token ON public.page_view_logs(session_token);
                CREATE INDEX IF NOT EXISTS ix_page_view_logs_viewed_at ON public.page_view_logs(viewed_at);
                CREATE INDEX IF NOT EXISTS ix_page_view_logs_page_category ON public.page_view_logs(page_category);

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
                        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
                        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
                    END IF;

                    CREATE TABLE IF NOT EXISTS public.activity_logs (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NULL REFERENCES public.users(id) ON DELETE SET NULL,
                        user_name VARCHAR(150),
                        user_role VARCHAR(50),
                        action VARCHAR(100) NOT NULL,
                        description TEXT,
                        ip_address VARCHAR(50),
                        user_agent VARCHAR(255),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_activity_logs_user_id ON public.activity_logs(user_id);
                    CREATE INDEX IF NOT EXISTS ix_activity_logs_created_at ON public.activity_logs(created_at);

                    CREATE TABLE IF NOT EXISTS public.media_files (
                        id VARCHAR(255) PRIMARY KEY,
                        content_type VARCHAR(100) NOT NULL,
                        data BYTEA NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_media_files_created_at ON public.media_files(created_at);
                END $$;
            ");
        }
        else if (dbContext.Database.IsSqlServer())
        {
            dbContext.Database.ExecuteSqlRaw(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
                BEGIN
                    CREATE TABLE [dbo].[user_sessions](
                        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                        [session_token] NVARCHAR(100) NOT NULL,
                        [user_id] BIGINT NULL,
                        [user_role] NVARCHAR(50) NOT NULL DEFAULT 'Guest',
                        [ip_address] NVARCHAR(100) NULL,
                        [user_agent] NVARCHAR(500) NULL,
                        [device_type] NVARCHAR(50) NULL,
                        [started_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [last_activity_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [duration_seconds] INT NOT NULL DEFAULT 0,
                        [page_count] INT NOT NULL DEFAULT 1
                    );
                    CREATE INDEX [ix_user_sessions_session_token] ON [dbo].[user_sessions]([session_token]);
                END;

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'page_view_logs')
                BEGIN
                    CREATE TABLE [dbo].[page_view_logs](
                        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
                        [session_token] NVARCHAR(100) NOT NULL,
                        [user_id] BIGINT NULL,
                        [user_role] NVARCHAR(50) NOT NULL DEFAULT 'Guest',
                        [page_url] NVARCHAR(255) NOT NULL,
                        [page_title] NVARCHAR(255) NOT NULL,
                        [page_category] NVARCHAR(100) NOT NULL DEFAULT 'Other',
                        [referrer_url] NVARCHAR(500) NULL,
                        [viewed_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                        [duration_seconds] INT NOT NULL DEFAULT 0
                    );
                    CREATE INDEX [ix_page_view_logs_session_token] ON [dbo].[page_view_logs]([session_token]);
                END;

                IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_name')
                    ALTER TABLE [dbo].[users] ADD [bank_name] NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_account_number')
                    ALTER TABLE [dbo].[users] ADD [bank_account_number] NVARCHAR(50) NULL;

                IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_account_name')
                    ALTER TABLE [dbo].[users] ADD [bank_account_name] NVARCHAR(100) NULL;

                IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_qr_url')
                    ALTER TABLE [dbo].[users] ADD [bank_qr_url] NVARCHAR(500) NULL;
            ");
        }

        // Tự động sao lưu và đồng bộ toàn bộ file ảnh từ đĩa cứng lên database PostgreSQL (chống mất ảnh khi restart server)
        var mediaStorage = scope.ServiceProvider.GetRequiredService<IMediaStorageService>();
        await mediaStorage.SyncLocalDiskToDbAsync();

        // Tự động seed bổ sung đầy đủ danh sách Xã/Thị trấn/Phường cho tất cả 30 quận huyện Hà Nội
        await LocationSeeder.SeedMissingLocationsAsync(dbContext);

        // Tự động seed/cập nhật tài khoản Quản trị viên (Admin)
        await AdminSeeder.SeedAdminUserAsync(dbContext);

        // Tự động seed thống kê truy cập & hành vi người dùng (Analytics)
        await AnalyticsSeeder.SeedAnalyticsDataAsync(dbContext);

        // Tự động cập nhật gói cước (99k, 199k) và seed dữ liệu mẫu nhà trọ & sàn ghép trọ
        await SampleDataSeeder.SeedAsync(dbContext);
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

// ==========================================
// TỰ ĐỘNG ĐỒNG BỘ MEDIA/UPLOADS TỪ PRODUCTION (RENDER) NẾU LOCALHOST CHƯA CÓ
// ==========================================
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    if (path.StartsWith("/media/", StringComparison.OrdinalIgnoreCase) || 
        path.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
    {
        var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var relativeFilePath = path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var localFilePath = Path.Combine(webRoot, relativeFilePath);

        // 1. Nếu chưa có trên đĩa cứng, kiểm tra xem có trong database PostgreSQL (Supabase) không
        if (!File.Exists(localFilePath))
        {
            try
            {
                var mediaStorage = context.RequestServices.GetRequiredService<IMediaStorageService>();
                var parts = path.TrimStart('/').Split('/');
                if (parts.Length >= 3)
                {
                    var folder = parts[1];
                    var fileName = parts[2];
                    var dbMedia = await mediaStorage.GetImageAsync(folder, fileName);
                    if (dbMedia != null)
                    {
                        context.Response.ContentType = dbMedia.Value.ContentType;
                        context.Response.Headers["Cache-Control"] = "public, max-age=2592000, immutable";
                        await context.Response.Body.WriteAsync(dbMedia.Value.Data);
                        return;
                    }
                }
            }
            catch { }

            // 2. Nếu trong DB không có, thử kéo nhanh từ server remote với timeout 1.5s
            try
            {
                var httpClientFactory = context.RequestServices.GetRequiredService<IHttpClientFactory>();
                var client = httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(1.5);
                var remoteUrl = $"https://zhome-be.onrender.com{path}";
                var response = await client.GetAsync(remoteUrl);
                if (response.IsSuccessStatusCode)
                {
                    var bytes = await response.Content.ReadAsByteArrayAsync();
                    var dir = Path.GetDirectoryName(localFilePath);
                    if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }
                    await File.WriteAllBytesAsync(localFilePath, bytes);

                    var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
                    context.Response.ContentType = contentType;
                    context.Response.Headers["Cache-Control"] = "public, max-age=2592000, immutable";
                    await context.Response.Body.WriteAsync(bytes);
                    return;
                }
            }
            catch
            {
                // Bỏ qua nếu lỗi mạng và chuyển tiếp sang pipeline kế tiếp (trả 404 bình thường)
            }
        }
    }

    await next();
});

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Cache toàn bộ ảnh/static files trong 30 ngày trên browser, tải lại trang sẽ lấy trực tiếp từ memory/disk cache 0ms
        ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=2592000, immutable";
    }
});

app.UseRouting();

// CORS bắt buộc đặt giữa UseRouting và UseAuthentication
app.UseCors("AllowFrontend");

// Kích hoạt Rate Limiter chống spam request và DDoS/Brute-force
//ss
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ZHome.API.Hubs.NotificationHub>("/hubs/notifications");

app.Run();