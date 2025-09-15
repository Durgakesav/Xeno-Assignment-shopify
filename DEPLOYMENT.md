# Deployment Guide

## Prerequisites

Before deploying the Xeno Shopify Insights Service, ensure you have:

- Node.js 16+ installed
- PostgreSQL database (local or cloud)
- Shopify Partner Account
- Git repository access
- Cloud platform account (Railway, Render, or Heroku)

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd xeno-shopify-insights
```

### 2. Install Dependencies
```bash
# Run the setup script
./setup.sh  # Linux/Mac
# or
setup.bat   # Windows

# Or manually:
npm run install-all
```

### 3. Environment Configuration
```bash
# Copy environment template
cp server/env.example server/.env

# Edit the configuration
nano server/.env  # or use your preferred editor
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shopify_insights"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Shopify Configuration
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
cd server

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start Development Servers
```bash
# From the root directory
npm run dev

# This will start:
# - Backend server on http://localhost:5000
# - Frontend development server on http://localhost:3000
```

## Production Deployment

### Option 1: Railway Deployment

#### 1. Prepare for Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

#### 2. Create Railway Project
```bash
# Initialize Railway project
railway init

# Add PostgreSQL database
railway add postgresql
```

#### 3. Configure Environment Variables
In Railway dashboard, set the following environment variables:
- `DATABASE_URL` (auto-generated from PostgreSQL addon)
- `JWT_SECRET`
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_WEBHOOK_SECRET`
- `NODE_ENV=production`
- `CLIENT_URL` (your deployed frontend URL)

#### 4. Deploy
```bash
# Deploy to Railway
railway up
```

### Option 2: Render Deployment

#### 1. Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository and branch

#### 2. Configure Service
- **Name**: `shopify-insights-api`
- **Environment**: `Node`
- **Build Command**: `cd server && npm install && cd ../client && npm install && npm run build`
- **Start Command**: `cd server && npm start`
- **Plan**: Choose appropriate plan

#### 3. Add Database
1. Go to "New +" → "PostgreSQL"
2. Create a new PostgreSQL database
3. Note the connection string

#### 4. Set Environment Variables
In the Render dashboard, add:
- `DATABASE_URL` (from PostgreSQL service)
- `JWT_SECRET`
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_WEBHOOK_SECRET`
- `NODE_ENV=production`
- `CLIENT_URL` (your deployed frontend URL)

#### 5. Deploy
Click "Create Web Service" to deploy.

### Option 3: Heroku Deployment

#### 1. Install Heroku CLI
```bash
# Install Heroku CLI (follow instructions for your OS)
# https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Create Heroku App
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

#### 3. Configure Environment Variables
```bash
# Set environment variables
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set SHOPIFY_API_KEY="your-shopify-api-key"
heroku config:set SHOPIFY_API_SECRET="your-shopify-api-secret"
heroku config:set SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"
heroku config:set NODE_ENV="production"
heroku config:set CLIENT_URL="https://your-frontend-url.com"
```

#### 4. Deploy
```bash
# Deploy to Heroku
git push heroku main

# Run database migrations
heroku run npx prisma migrate deploy
```

## Database Migration

### Development
```bash
cd server
npx prisma migrate dev
```

### Production
```bash
# For Railway/Render
npx prisma migrate deploy

# For Heroku
heroku run npx prisma migrate deploy
```

## Frontend Deployment

### Build for Production
```bash
# Build the React app
npm run build
```

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root
3. Configure environment variables in Vercel dashboard
4. Set build command: `cd client && npm run build`
5. Set output directory: `client/build`

### Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/build`
4. Configure environment variables

## Shopify App Configuration

### 1. Create Shopify App
1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app
3. Configure app settings:
   - **App URL**: `https://your-api-domain.com`
   - **Allowed redirection URLs**: `https://your-api-domain.com/auth/callback`
   - **Webhook URL**: `https://your-api-domain.com/api/webhooks/shopify`

### 2. Configure Scopes
Required scopes:
- `read_customers`
- `read_orders`
- `read_products`
- `read_analytics`

### 3. Install App
1. Install the app on your development store
2. Get the access token
3. Add the store to your application

## Monitoring & Maintenance

### Health Checks
The application provides health check endpoints:
- `GET /health` - Basic health check
- `GET /api/health` - Detailed health information

### Logging
- Application logs are available in the platform dashboard
- Database queries are logged in development mode
- Error tracking can be added with services like Sentry

### Performance Monitoring
- Monitor database query performance
- Track API response times
- Monitor memory and CPU usage
- Set up alerts for critical issues

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules server/node_modules client/node_modules
npm run install-all
```

#### Environment Variables
```bash
# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET
```

### Debug Mode
```bash
# Run in debug mode
DEBUG=* npm run dev

# Or for specific modules
DEBUG=prisma:* npm run dev
```

## Security Checklist

- [ ] Environment variables are properly set
- [ ] Database credentials are secure
- [ ] JWT secret is strong and unique
- [ ] HTTPS is enabled in production
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive information

## Backup Strategy

### Database Backups
- Enable automated backups in your database provider
- Test backup restoration procedures
- Store backups in multiple locations

### Code Backups
- Use version control (Git)
- Tag releases for easy rollback
- Keep deployment configurations in version control

## Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple instances
- Implement session storage (Redis)
- Use message queues for async processing

### Database Scaling
- Read replicas for analytics queries
- Connection pooling
- Query optimization

### Caching
- Implement Redis for frequently accessed data
- Cache API responses
- Use CDN for static assets

## Support

For deployment issues:
1. Check the logs in your platform dashboard
2. Verify environment variables
3. Test database connectivity
4. Check Shopify API credentials
5. Review the troubleshooting section above

For additional help, create an issue in the GitHub repository with:
- Deployment platform used
- Error messages
- Steps to reproduce
- Environment details



