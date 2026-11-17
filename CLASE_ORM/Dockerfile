# API (.NET 8). El contexto de construcción es la RAÍZ del repo, porque la API referencia a los otros tres proyectos:
#   docker build -f CLASE_ORM/Dockerfile .

# ---------- 1) Compilar ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Primero solo los .csproj: mientras no cambien los paquetes, Docker reutiliza la capa del "restore".
COPY CLASE_ORM.Domain/CLASE_ORM.Domain.csproj CLASE_ORM.Domain/
COPY CLASE_ORM.Application/CLASE_ORM.Application.csproj CLASE_ORM.Application/
COPY CLASE_ORM.Infrastructure/CLASE_ORM.Infrastructure.csproj CLASE_ORM.Infrastructure/
COPY CLASE_ORM/CLASE_ORM.csproj CLASE_ORM/
RUN dotnet restore CLASE_ORM/CLASE_ORM.csproj

COPY CLASE_ORM.Domain/ CLASE_ORM.Domain/
COPY CLASE_ORM.Application/ CLASE_ORM.Application/
COPY CLASE_ORM.Infrastructure/ CLASE_ORM.Infrastructure/
COPY CLASE_ORM/ CLASE_ORM/
RUN dotnet publish CLASE_ORM/CLASE_ORM.csproj -c Release -o /app/publish --no-restore

# ---------- 2) Imagen final (solo el runtime, mucho más liviana) ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CLASE_ORM.dll"]
