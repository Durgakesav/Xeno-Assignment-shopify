# Complete Testing Guide

## 🧪 **Testing Setup Checklist**

### **Prerequisites**
- [ ] Node.js 16+ installed
- [ ] PostgreSQL database (local or cloud)
- [ ] Shopify Partner account
- [ ] Development store with sample data

## **Phase 1: Environment Setup**

### **1.1 Database Setup**
```bash
# Option A: Local PostgreSQL
# Install PostgreSQL and create database
createdb shopify_insights

# Option B: Cloud Database (Recommended)
# Use Neon, Supabase, or Railway for free PostgreSQL
# Get connection string from your provider
```

### **1.2 Environment Configuration**
```bash
# Copy environment template
copy server\env.example server\.env

# Edit server\.env with your actual values
```

**Required Environment Variables:**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="any-random-secret-key"
SHOPIFY_API_KEY="from-partners-dashboard"
SHOPIFY_API_SECRET="from-partners-dashboard"
SHOPIFY_WEBHOOK_SECRET="any-random-string"
```

### **1.3 Install Dependencies**
```bash
# Install all dependencies
npm run install-all

# Set up database schema
cd server
npx prisma migrate dev
npx prisma generate
cd ..
```

## **Phase 2: Shopify API Setup**

### **2.1 Create Shopify Partner Account**
1. Go to https://partners.shopify.com
2. Sign up for free Partner account
3. Verify email and complete setup

### **2.2 Create Development Store**
1. In Partners Dashboard → Stores → Add store
2. Select "Development store"
3. Store name: `xeno-test-store`
4. Store URL: `xeno-test-store.myshopify.com`
5. Click "Create store"

### **2.3 Add Sample Data**
**Products (10-15 items):**
- Go to Products → Add product
- Add variety: Electronics, Clothing, Books, etc.
- Include different price ranges ($10-$500)
- Add product descriptions and images
- Create variants (different sizes, colors)

**Customers (15-20 customers):**
- Go to Customers → Add customer
- Add diverse customer data
- Include different locations
- Set different customer groups

**Orders (25-30 orders):**
- Go to Orders → Create order
- Use different customers and products
- Vary order amounts ($50-$1000)
- Set different statuses (paid, fulfilled, pending)
- Include different dates (last 30 days)

### **2.4 Create Shopify App**
1. Partners Dashboard → Apps → Create app
2. Choose "Create app manually"
3. App name: `Xeno Insights Integration`
4. App URL: `http://localhost:5000`
5. Redirection URLs: `http://localhost:5000/auth/callback`

### **2.5 Configure App Settings**
**Configuration Tab:**
- App URL: `http://localhost:5000`
- Allowed redirection URLs: `http://localhost:5000/auth/callback`
- Webhook URL: `http://localhost:5000/api/webhooks/shopify`

**API Credentials Tab:**
- Copy API key and API secret key
- Update your `.env` file

**App Setup Tab:**
- Admin API access scopes:
  - `read_customers`
  - `read_orders`
  - `read_products`
  - `read_analytics`

### **2.6 Install App on Store**
1. Go to your development store admin
2. Apps → App and sales channel settings
3. Develop apps → Create an app
4. Name: `Xeno Insights`
5. Install the app
6. Copy the Admin API access token

## **Phase 3: Application Testing**

### **3.1 Start the Application**
```bash
# Start both frontend and backend
npm run dev

# Should start:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:3000
```

### **3.2 Authentication Testing**
**Test User Registration:**
1. Go to http://localhost:3000
2. Click "Sign up here"
3. Fill in registration form
4. Verify successful registration and auto-login

**Test User Login:**
1. Logout and login again
2. Verify JWT token is stored
3. Check user data persistence

### **3.3 Store Management Testing**
**Add Store:**
1. Go to "Stores" page
2. Click "Add Store"
3. Fill in store details:
   - Name: `Test Store`
   - Shopify URL: `xeno-test-store.myshopify.com`
   - Access Token: (from step 2.6)
4. Click "Add"
5. Verify store appears in list

**Test Store Connection:**
1. Click "Test Connection" button
2. Verify successful connection
3. Check store information display

### **3.4 Data Ingestion Testing**
**Manual Sync:**
1. Go to store details
2. Click "Sync Data" button
3. Monitor sync progress
4. Check sync logs for success/errors

**Verify Data Sync:**
1. Check customer count in store list
2. Check order count in store list
3. Check product count in store list
4. Verify data appears in database

### **3.5 Analytics Dashboard Testing**
**Overview Metrics:**
1. Go to "Analytics" page
2. Verify total customers, orders, revenue
3. Check average order value
4. Verify top customers list

**Revenue Trends:**
1. Switch to "Revenue Trends" tab
2. Verify chart displays data
3. Test different date ranges
4. Check data accuracy

**Customer Analytics:**
1. Switch to "Customers" tab
2. Verify customer list
3. Check customer statistics
4. Verify top customers by spend

**Order Analytics:**
1. Switch to "Orders" tab
2. Verify order list
3. Check order statistics
4. Verify revenue charts

**Product Analytics:**
1. Switch to "Products" tab
2. Verify product list
3. Check product type distribution
4. Verify vendor analytics

### **3.6 Real-time Sync Testing**
**Webhook Testing:**
1. In Shopify admin, create a new order
2. Check if webhook is received
3. Verify data updates in dashboard

**Scheduled Sync Testing:**
1. Wait for scheduled sync (15 minutes)
2. Check sync logs
3. Verify data freshness

## **Phase 4: Error Handling Testing**

### **4.1 Invalid Credentials**
1. Add store with wrong access token
2. Verify error handling
3. Check user-friendly error messages

### **4.2 Network Issues**
1. Disconnect internet during sync
2. Verify error handling
3. Check retry mechanisms

### **4.3 Database Issues**
1. Stop database service
2. Try to perform operations
3. Verify graceful error handling

## **Phase 5: Performance Testing**

### **5.1 Large Dataset Testing**
1. Add more products/orders to Shopify
2. Test sync performance
3. Verify dashboard responsiveness

### **5.2 Concurrent Users**
1. Open multiple browser tabs
2. Test simultaneous operations
3. Verify data consistency

## **Phase 6: Security Testing**

### **6.1 Authentication**
1. Try to access protected routes without login
2. Verify redirect to login page
3. Test token expiration

### **6.2 Data Isolation**
1. Create multiple user accounts
2. Add stores to different users
3. Verify data isolation

### **6.3 Input Validation**
1. Try to submit invalid data
2. Test SQL injection attempts
3. Verify input sanitization

## **Expected Test Results**

### **✅ Successful Tests**
- User registration and login
- Store addition and connection
- Data synchronization
- Analytics dashboard display
- Real-time updates
- Error handling
- Data isolation

### **📊 Performance Benchmarks**
- Page load time: < 2 seconds
- Data sync: < 30 seconds for 1000 records
- Dashboard render: < 1 second
- API response time: < 500ms

### **🔒 Security Verification**
- JWT tokens work correctly
- Data is properly isolated
- Input validation prevents attacks
- Error messages don't leak information

## **Troubleshooting Common Issues**

### **Database Connection Issues**
```bash
# Check database connection
npx prisma db pull

# Reset database if needed
npx prisma migrate reset
```

### **Shopify API Issues**
- Verify API credentials
- Check app permissions
- Ensure store has data
- Verify webhook URLs

### **Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules server/node_modules client/node_modules
npm run install-all
```

## **Test Data Recommendations**

### **Products**
- 15-20 products
- Price range: $10-$500
- Different categories
- Variants (sizes, colors)

### **Customers**
- 20-25 customers
- Different locations
- Various customer groups
- Different purchase patterns

### **Orders**
- 30-40 orders
- Last 30 days
- Different statuses
- Various amounts
- Different customers

This comprehensive testing will ensure your application works perfectly for the demo and handles real-world scenarios effectively!



