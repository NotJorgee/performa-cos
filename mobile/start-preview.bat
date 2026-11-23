@echo off
rem Starts the Performa-COS backend (all interfaces, port 8000) and the Flutter web preview (port 5175)
rem in their own windows. Close those windows to stop them.
setlocal
set APP_DIR=%~dp0
set ROOT_DIR=%APP_DIR%..

if not exist "%APP_DIR%build\web\index.html" (
  echo Building the Flutter web preview...
  pushd "%APP_DIR%"
  call flutter build web --release
  popd
)

start "PerformaCOS Backend :8000" /D "%ROOT_DIR%\backend" cmd /k ""%ROOT_DIR%\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
start "PerformaCOS Preview :5175" /D "%APP_DIR%" cmd /k "node tool\preview_server.mjs"

echo.
echo Backend:  http://localhost:8000/api/health
echo Preview:  http://localhost:5175   (phones on the same Wi-Fi: http://^<this PC's LAN IP^>:5175)
endlocal
