@echo off
rem ====================================================================
rem  INICIAR-DEMO.bat - levanta el sistema y carga los datos de ejemplo
rem
rem    Doble clic ............ levanta todo, carga usuarios, materias, alumnos
rem                            e inscripciones, y abre el navegador
rem    INICIAR-DEMO.bat reset . borra los datos anteriores y arranca de cero
rem
rem  Requiere Docker Desktop abierto.
rem ====================================================================
setlocal
cd /d "%~dp0"

docker info >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Docker Desktop no esta abierto. Abrilo, espera a que diga "running"
  echo  y volve a ejecutar este archivo.
  goto :fin
)

if /i "%~1"=="reset" (
  echo Borrando los datos anteriores...
  docker compose down -v
)

echo Levantando el sistema ^(la primera vez puede tardar varios minutos^)...
docker compose up -d
if errorlevel 1 goto :error

echo.
echo Cargando usuarios, materias, alumnos e inscripciones de ejemplo...
docker compose run --rm seed
if errorlevel 1 goto :error

rem Puertos reales (por si se cambiaron en el archivo .env)
set "WEBPORT=8080"
set "APIPORT=5201"
for /f "tokens=2 delims=:" %%p in ('docker compose port web 80') do set "WEBPORT=%%p"
for /f "tokens=2 delims=:" %%p in ('docker compose port api 8080') do set "APIPORT=%%p"

echo.
echo  Listo. El sistema esta en:        http://localhost:%WEBPORT%
echo  Documentacion de la API (Swagger): http://localhost:%APIPORT%/swagger
if not defined DEMO_SIN_NAVEGADOR start "" "http://localhost:%WEBPORT%"
goto :fin

:error
echo.
echo  Algo fallo. Mira el detalle de arriba o corre:  docker compose logs api

:fin
echo.
if not defined DEMO_SIN_NAVEGADOR pause
endlocal
