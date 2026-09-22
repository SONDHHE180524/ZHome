# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["ZHome.API.csproj", "./"]
RUN dotnet restore "ZHome.API.csproj"

# Copy all source files and publish
COPY . .
RUN dotnet publish "ZHome.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Expose port (Render automatically detects this or routes via $PORT)
EXPOSE 8080

# Copy build artifacts from previous stage
COPY --from=build /app/publish .

# Start application dynamically binding to Render's $PORT or 8080 by default
ENTRYPOINT ["sh", "-c", "dotnet ZHome.API.dll --urls http://0.0.0.0:${PORT:-8080}"]
