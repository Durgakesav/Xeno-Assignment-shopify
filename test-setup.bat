@echo off
echo 🧪 Xeno Shopify Insights - Testing Setup
echo ========================================

echo.
echo Step 1: Installing dependencies...
call npm run install-all

echo.
echo Step 2: Setting up environment...
if not exist server\.env (
    copy server\env.example server\.env
    echo ✅ Environment file created
    echo ⚠️  Please edit server\.env with your database URL and Shopify credentials
) else (
    echo ✅ Environment file already exists
)

echo.
echo Step 3: Database setup...
cd server
echo Running database migrations...
call npx prisma migrate dev
call npx prisma generate
cd ..

echo.
echo Step 4: Starting application...
echo.
echo 🚀 Starting development servers...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop the servers
echo.

call npm run dev



