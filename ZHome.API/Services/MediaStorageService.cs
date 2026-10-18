using System;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZHome.API.Data;

namespace ZHome.API.Services
{
    public class MediaStorageService : IMediaStorageService
    {
        private readonly ZHomeDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<MediaStorageService> _logger;

        public MediaStorageService(ZHomeDbContext context, IWebHostEnvironment environment, ILogger<MediaStorageService> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        public async Task<string> SaveBase64ImageAsync(string base64String, string folder, string prefix, string identifier = "")
        {
            if (string.IsNullOrWhiteSpace(base64String)) return string.Empty;

            var base64Data = base64String;
            string extension = ".png";
            string contentType = "image/png";

            if (base64String.Contains(","))
            {
                var parts = base64String.Split(',');
                var header = parts[0].ToLowerInvariant();
                base64Data = parts[1];

                if (header.Contains("image/jpeg") || header.Contains("image/jpg"))
                {
                    extension = ".jpg";
                    contentType = "image/jpeg";
                }
                else if (header.Contains("image/webp"))
                {
                    extension = ".webp";
                    contentType = "image/webp";
                }
                else if (header.Contains("image/gif"))
                {
                    extension = ".gif";
                    contentType = "image/gif";
                }
            }

            byte[] imageBytes = Convert.FromBase64String(base64Data);

            string safeFolder = folder.Trim('/', '\\').ToLowerInvariant();
            string fileName = string.IsNullOrEmpty(identifier) 
                ? $"{prefix}_{DateTime.UtcNow.Ticks}{extension}"
                : $"{prefix}_{identifier}_{DateTime.UtcNow.Ticks}{extension}";
            string relativePath = $"/media/{safeFolder}/{fileName}";
            string fileKey = $"{safeFolder}/{fileName}".ToLowerInvariant();

            // 1. Save to local disk cache
            try
            {
                var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
                var directoryPath = Path.Combine(webRootPath, "media", safeFolder);
                if (!Directory.Exists(directoryPath))
                {
                    Directory.CreateDirectory(directoryPath);
                }
                var filePath = Path.Combine(directoryPath, fileName);
                await File.WriteAllBytesAsync(filePath, imageBytes);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to write local disk cache for {RelativePath}", relativePath);
            }

            // 2. Persist to PostgreSQL database so it survives cloud restarts/redeploys
            try
            {
                await UpsertMediaToDbAsync(fileKey, contentType, imageBytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist media file to database: {FileKey}", fileKey);
            }

            return relativePath;
        }

        public async Task<(byte[] Data, string ContentType)?> GetImageAsync(string folder, string fileName)
        {
            string safeFolder = folder.Trim('/', '\\').ToLowerInvariant();
            string safeFileName = Path.GetFileName(fileName);
            string fileKey = $"{safeFolder}/{safeFileName}".ToLowerInvariant();

            var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var filePath = Path.Combine(webRootPath, "media", safeFolder, safeFileName);

            // 1. Check local disk
            if (File.Exists(filePath))
            {
                try
                {
                    var data = await File.ReadAllBytesAsync(filePath);
                    var contentType = GetContentType(safeFileName);
                    return (data, contentType);
                }
                catch { }
            }

            // 2. Query DB
            try
            {
                var conn = _context.Database.GetDbConnection();
                if (conn.State != ConnectionState.Open) await conn.OpenAsync();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT content_type, data FROM public.media_files WHERE id = @id LIMIT 1";

                var param = cmd.CreateParameter();
                param.ParameterName = "@id";
                param.Value = fileKey;
                cmd.Parameters.Add(param);

                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    string contentType = reader.GetString(0);
                    byte[] data = (byte[])reader[1];

                    // Cache back to disk
                    try
                    {
                        var dir = Path.GetDirectoryName(filePath);
                        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                        {
                            Directory.CreateDirectory(dir);
                        }
                        await File.WriteAllBytesAsync(filePath, data);
                    }
                    catch { }

                    return (data, contentType);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading media from DB for {FileKey}", fileKey);
            }

            return null;
        }

        public async Task SyncLocalDiskToDbAsync()
        {
            try
            {
                var webRootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
                var mediaDir = Path.Combine(webRootPath, "media");
                if (!Directory.Exists(mediaDir)) return;

                var files = Directory.GetFiles(mediaDir, "*.*", SearchOption.AllDirectories);
                if (files.Length == 0) return;

                // Kiểm tra nhanh số lượng trong DB, nếu đã có nhiều hơn hoặc bằng số file trên đĩa thì bỏ qua
                try
                {
                    var conn = _context.Database.GetDbConnection();
                    if (conn.State != ConnectionState.Open) await conn.OpenAsync();
                    using var checkCmd = conn.CreateCommand();
                    checkCmd.CommandText = "SELECT COUNT(1) FROM public.media_files;";
                    var dbCount = Convert.ToInt64(await checkCmd.ExecuteScalarAsync());
                    if (dbCount >= files.Length)
                    {
                        _logger.LogInformation("Database đã có {Count} media files, không cần đồng bộ lại toàn bộ.", dbCount);
                        return;
                    }
                }
                catch { }

                foreach (var file in files)
                {
                    var rel = Path.GetRelativePath(mediaDir, file).Replace('\\', '/').ToLowerInvariant();
                    var contentType = GetContentType(Path.GetFileName(file));
                    var data = await File.ReadAllBytesAsync(file);
                    await UpsertMediaToDbAsync(rel, contentType, data);
                }
                _logger.LogInformation("Successfully synced {Count} local media files to database.", files.Length);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync local media files to database.");
            }
        }

        private async Task UpsertMediaToDbAsync(string fileKey, string contentType, byte[] data)
        {
            var conn = _context.Database.GetDbConnection();
            if (conn.State != ConnectionState.Open) await conn.OpenAsync();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO public.media_files (id, content_type, data, created_at)
                VALUES (@id, @contentType, @data, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO UPDATE 
                SET data = EXCLUDED.data, content_type = EXCLUDED.content_type, created_at = CURRENT_TIMESTAMP;
            ";

            var p1 = cmd.CreateParameter();
            p1.ParameterName = "@id";
            p1.Value = fileKey;
            cmd.Parameters.Add(p1);

            var p2 = cmd.CreateParameter();
            p2.ParameterName = "@contentType";
            p2.Value = contentType;
            cmd.Parameters.Add(p2);

            var p3 = cmd.CreateParameter();
            p3.ParameterName = "@data";
            p3.Value = data;
            cmd.Parameters.Add(p3);

            await cmd.ExecuteNonQueryAsync();
        }

        private static string GetContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                _ => "image/png"
            };
        }
    }
}
