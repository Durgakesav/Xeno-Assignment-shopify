# Xeno Shopify Data Ingestion & Insights Service

A multi-tenant Shopify Data Ingestion & Insights Service that simulates how Xeno helps enterprise retailers onboard, integrate, and analyze their customer data.

## 🚀 Features

- **Multi-tenant Architecture**: Isolated data for multiple Shopify stores
- **Data Ingestion**: Automated sync of customers, orders, products, and custom events
- **Insights Dashboard**: Real-time analytics with charts and metrics
- **Authentication**: Email-based user authentication
- **Data Synchronization**: Scheduled sync and webhook support
- **Scalable Design**: Built for production deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shopify API   │───▶│  Ingestion API   │───▶│   PostgreSQL    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  React Dashboard │
                       └──────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Prisma ORM
- **Frontend**: React.js, Material-UI, Recharts
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Deployment**: Railway/Render

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Shopify Partner Account
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xeno-shopify-insights
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
xeno-shopify-insights/
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shopify_insights"

# JWT
JWT_SECRET="your-jwt-secret"

# Shopify
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"

# Server
PORT=5000
NODE_ENV=development
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Data Ingestion
- `POST /api/ingestion/sync/:tenantId` - Manual data sync
- `GET /api/ingestion/status/:tenantId` - Sync status
- `POST /api/webhooks/shopify` - Shopify webhook endpoint

### Insights
- `GET /api/insights/overview/:tenantId` - Dashboard overview
- `GET /api/insights/customers/:tenantId` - Customer analytics
- `GET /api/insights/orders/:tenantId` - Order analytics
- `GET /api/insights/products/:tenantId` - Product analytics

## 🗄️ Database Schema

### Core Tables
- `tenants` - Store tenant information
- `users` - User authentication
- `customers` - Shopify customers
- `orders` - Shopify orders
- `products` - Shopify products
- `sync_logs` - Data synchronization logs

## 🚀 Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the frontend: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`

## 📈 Monitoring

- Database query performance
- API response times
- Data sync success rates
- Error tracking and logging

## 🔒 Security

- JWT-based authentication
- Tenant data isolation
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration

## 📝 Known Limitations

- Webhook verification not implemented (for demo purposes)
- Limited error handling for Shopify API failures
- Basic authentication (no password reset, email verification)
- No real-time updates (polling-based sync)

## 🚀 Next Steps for Production

1. **Security Enhancements**
   - Implement webhook signature verification
   - Add rate limiting and request throttling
   - Implement proper error handling and logging

2. **Scalability Improvements**
   - Add Redis for caching
   - Implement message queues for async processing
   - Add horizontal scaling support

3. **Monitoring & Analytics**
   - Add comprehensive logging
   - Implement health checks
   - Add performance monitoring

4. **User Experience**
   - Add real-time updates via WebSockets
   - Implement advanced filtering and search
   - Add data export functionality

## 📞 Support

For questions or issues, please create an issue in the GitHub repository.

## 📄 License

This project is licensed under the MIT License.


