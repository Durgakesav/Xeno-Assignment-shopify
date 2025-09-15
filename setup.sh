#!/bin/bash

# Xeno Shopify Insights Setup Script
echo "🚀 Setting up Xeno Shopify Insights Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install

# Go back to root
cd ..

# Create environment file if it doesn't exist
if [ ! -f server/.env ]; then
    echo "📝 Creating environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your configuration"
fi

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL detected"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL and create a database."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your database URL and Shopify credentials"
echo "2. Set up your PostgreSQL database"
echo "3. Run database migrations: cd server && npx prisma migrate dev"
echo "4. Start the development servers: npm run dev"
echo ""
echo "For production deployment:"
echo "1. Build the client: npm run build"
echo "2. Start the server: npm start"
echo ""
echo "Happy coding! 🚀"



