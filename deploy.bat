@echo off
echo ====================================
echo   Deploy AirCool ke Hostinger
echo ====================================
echo.

echo 1. Install backend dependencies...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo 2. Generate Prisma client...
call npx prisma generate
if %errorlevel% neq 0 exit /b %errorlevel%

echo 3. Build frontend...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo 4. Copy frontend build ke backend/public...
if exist "%~dp0backend\public" rmdir /s /q "%~dp0backend\public"
mkdir "%~dp0backend\public"
xcopy /e /i /y "%~dp0frontend\dist\*" "%~dp0backend\public\"

echo 5. Buat .env.production untuk backend...
cd /d "%~dp0backend"
if not exist ".env.production" (
  copy .env .env.production
  echo.
  echo [INFO] .env.production dibuat dari .env
  echo [INFO] Edit DATABASE_URL dan JWT_SECRET jika perlu
)

echo.
echo ====================================
echo   Build selesai!
echo ====================================
echo.
echo Upload folder backend/ ke Hostinger, lalu:
echo 1. Buka hPanel - Hosting - Node.js
echo 2. Set Entry Point: src/index.js
echo 3. Set Environment: production
echo 4. NPM Install otomatis
echo 5. Jalankan: npx prisma db push
echo ====================================
pause
