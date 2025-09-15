# Architecture Documentation

## System Overview

The Xeno Shopify Data Ingestion & Insights Service is a multi-tenant SaaS application that helps enterprise retailers onboard, integrate, and analyze their customer data from Shopify stores.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Login     │  │  Dashboard  │  │  Analytics  │            │
│  │   Page      │  │    Page     │  │    Page     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Auth      │  │  Ingestion  │  │  Insights   │            │
│  │  Service    │  │   Service   │  │   Service   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Tenant     │  │  Scheduler  │  │  Webhooks   │            │
│  │  Service    │  │   Service   │  │   Service   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (PostgreSQL)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Users     │  │  Tenants    │  │  Customers  │            │
│  │   Table     │  │   Table     │  │   Table     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Orders    │  │  Products   │  │  Sync Logs  │            │
│  │   Table     │  │   Table     │  │   Table     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Shopify    │  │  Shopify    │  │  Shopify    │            │
│  │   API       │  │  Webhooks   │  │   Store     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React.js)

**Technology Stack:**
- React 18 with functional components and hooks
- Material-UI for consistent design system
- Recharts for data visualization
- React Router for navigation
- Axios for API communication

**Key Components:**
- `AuthContext`: Manages user authentication state
- `Layout`: Main application layout with navigation
- `Dashboard`: Overview of all connected stores
- `Tenants`: Store management interface
- `Insights`: Analytics dashboard with charts

### Backend (Node.js/Express)

**Technology Stack:**
- Node.js with Express.js framework
- Prisma ORM for database operations
- JWT for authentication
- Node-cron for scheduled tasks
- Axios for external API calls

**Key Services:**

#### Authentication Service
- User registration and login
- JWT token management
- Password hashing with bcrypt
- Session management

#### Tenant Service
- Multi-tenant store management
- Tenant isolation and data segregation
- Store configuration and settings

#### Data Ingestion Service
- Shopify API integration
- Automated data synchronization
- Real-time webhook processing
- Error handling and retry logic

#### Insights Service
- Analytics data aggregation
- Revenue and customer metrics
- Chart data preparation
- Performance optimization

#### Scheduler Service
- Automated data sync (every 15 minutes)
- Full sync (hourly)
- Background job management
- Error recovery

### Database (PostgreSQL)

**Schema Design:**
- Multi-tenant architecture with tenant isolation
- Optimized for analytics queries
- Proper indexing for performance
- Data integrity constraints

**Key Tables:**
- `users`: User authentication and profile data
- `tenants`: Store configurations and access tokens
- `customers`: Shopify customer data
- `orders`: Order information and line items
- `products`: Product catalog data
- `sync_logs`: Data synchronization tracking

## Data Flow

### 1. User Authentication
```
User → Frontend → Auth API → JWT Token → Protected Routes
```

### 2. Store Connection
```
User → Add Store → Shopify OAuth → Access Token → Store Registration
```

### 3. Data Ingestion
```
Scheduler/Webhook → Shopify API → Data Processing → Database Storage
```

### 4. Analytics Display
```
User Request → Insights API → Database Query → Data Aggregation → Chart Data
```

## Security Considerations

### Authentication & Authorization
- JWT-based stateless authentication
- Password hashing with bcrypt
- Token expiration and refresh
- Role-based access control

### Data Protection
- Tenant data isolation
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- CORS configuration

### API Security
- Rate limiting (100 requests per 15 minutes)
- Request validation
- Error handling without information leakage
- HTTPS enforcement

## Scalability Features

### Multi-Tenancy
- Complete data isolation per tenant
- Scalable tenant management
- Independent store configurations

### Performance Optimization
- Database indexing for analytics queries
- Pagination for large datasets
- Caching strategies (ready for Redis)
- Efficient data aggregation

### Monitoring & Logging
- Comprehensive error logging
- Sync status tracking
- Performance metrics
- Health check endpoints

## Deployment Architecture

### Development
- Local development with hot reload
- Docker containerization
- Environment-based configuration

### Production
- Cloud deployment (Railway/Render)
- Database hosting (PostgreSQL)
- CDN for static assets
- Environment variable management

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tenant Management
- `GET /api/tenants` - List user's stores
- `POST /api/tenants` - Add new store
- `PUT /api/tenants/:id` - Update store
- `DELETE /api/tenants/:id` - Delete store

### Data Ingestion
- `POST /api/ingestion/sync/:tenantId` - Manual sync
- `GET /api/ingestion/status/:tenantId` - Sync status
- `POST /api/webhooks/shopify` - Webhook endpoint

### Analytics
- `GET /api/insights/overview/:tenantId` - Dashboard overview
- `GET /api/insights/customers/:tenantId` - Customer analytics
- `GET /api/insights/orders/:tenantId` - Order analytics
- `GET /api/insights/products/:tenantId` - Product analytics
- `GET /api/insights/revenue/:tenantId` - Revenue trends

## Technology Decisions

### Why React?
- Component-based architecture
- Rich ecosystem and community
- Excellent for data visualization
- Easy to maintain and scale

### Why Node.js/Express?
- JavaScript full-stack consistency
- Excellent async/await support
- Rich package ecosystem
- Easy deployment and scaling

### Why PostgreSQL?
- ACID compliance for data integrity
- Excellent JSON support
- Advanced indexing capabilities
- Strong multi-tenant support

### Why Prisma?
- Type-safe database operations
- Automatic query optimization
- Migration management
- Excellent developer experience

## Future Enhancements

### Short Term
- Real-time updates via WebSockets
- Advanced filtering and search
- Data export functionality
- Email notifications

### Medium Term
- Redis caching layer
- Message queue for async processing
- Advanced analytics and ML insights
- Mobile application

### Long Term
- Multi-platform support (WooCommerce, Magento)
- Advanced AI/ML features
- White-label solutions
- Enterprise features

## Monitoring & Maintenance

### Health Checks
- Database connectivity
- External API availability
- Service status monitoring
- Performance metrics

### Error Handling
- Comprehensive error logging
- Graceful degradation
- Retry mechanisms
- User-friendly error messages

### Backup & Recovery
- Database backups
- Configuration backups
- Disaster recovery procedures
- Data migration tools



