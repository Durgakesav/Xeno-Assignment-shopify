@echo off
echo 🚀 Setting up Xeno Shopify Insights Service...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install

REM Install client dependencies
echo 📦 Installing client dependencies...
cd ..\client
call npm install

REM Go back to root
cd ..

REM Create environment file if it doesn't exist
if not exist server\.env (
    echo 📝 Creating environment file...
    copy server\env.example server\.env
    echo ⚠️  Please edit server\.env with your configuration
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit server\.env with your database URL and Shopify credentials
echo 2. Set up your PostgreSQL database
echo 3. Run database migrations: cd server ^&^& npx prisma migrate dev
echo 4. Start the development servers: npm run dev
echo.
echo For production deployment:
echo 1. Build the client: npm run build
echo 2. Start the server: npm start
echo.
echo Happy coding! 🚀
pause



