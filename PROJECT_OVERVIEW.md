# Xeno Shopify Data Ingestion & Insights – Plain-English Overview

Audience: Someone with little-to-no technical background who needs to understand what this project is, what it does, and how the pieces fit together.

1) What this project is
This is a small web application that connects to a Shopify store, pulls (reads) its data (customers, orders, products), stores it safely in a database, and shows useful insights on a simple dashboard. Think of it as “plug in your store → see your business at a glance.”

2) What it helps you do
- See total customers, orders, and revenue
- See revenue and orders over time
- See your top customers by spend
- Browse the products in your store (with images)
- Keep your data fresh by syncing from Shopify (manually or automatically)

3) Who uses it
- Retailers or teams who run one or more Shopify stores
- People who want a quick, no-fuss snapshot of how their store is doing

4) High-level flow (big picture)
- You sign in
- You add your Shopify store details (your store’s web address and a secure access token)
- The app pulls your store data from Shopify and saves it in a database
- The dashboard shows your numbers and charts
- You can re-sync any time to refresh the data

5) The pieces (what lives where)
- Frontend (what you see in the browser): The website UI
- Backend (the brain in the background): Talks to Shopify, saves data, answers the frontend
- Database (the “filing cabinet”): Stores customers, orders, products
- Scheduler/Webhooks (the helpers): Keep data fresh automatically

6) Where things are in the project (folders)
- client/ → The website (React)
- server/ → The API/logic (Node/Express)
- server/prisma/ → The database blueprint (schema)
- server/src/routes/ → The “doors” (endpoints) the website uses to talk to the backend
- server/src/services/ → The Shopify connector and automation
- README.md, ARCHITECTURE.md, DEPLOYMENT.md → Helpful guides

7) Pages you can click through
- Login/Register: Create an account or sign in
- Dashboard: Quick totals across all your stores
- Stores: Add/edit a store, sync data, jump to Analytics or Products
- Insights: Charts and numbers for a specific store
- Products: Visual list of products (with images) for a store

8) What happens when you “Add Store”
- You enter:
  - “Store URL” (example: your-store.myshopify.com)
  - “Access Token” (a secret from your Shopify admin)
- The app saves that store under your account
- When you click “Sync Data,” we fetch customers, orders, and products from Shopify
- We store that data in the database for quick, consistent reporting

9) What happens when you “Sync Data”
- The backend calls Shopify’s official API and downloads the latest store data
- It updates the database with new or changed records
- The dashboard and insights refresh with the newest information

10) What the “Insights” show
- Overview: totals for customers, orders, products, revenue, and average order value
- Revenue trends: a time chart of sales
- Top 5 customers: the biggest spenders for your store
- Orders and Products: summary stats and breakdowns to spot patterns

11) Why we chose these technologies (in simple terms)
- React (Frontend): Makes snappy, modern web pages
- Node + Express (Backend): A reliable “middleman” between the website and Shopify
- PostgreSQL (Database): A dependable place to store and query your data
- Prisma (Database toolkit): A clean way to work with the database safely
- Charting (Recharts/MUI): Gives clear visuals without heavy setup

12) Security basics (kept simple)
- Your login uses a secure token so only you can access your stores
- Each store’s data is kept separate per user (multi-tenant isolation)
- We never show your Shopify access token once saved
- In production, you’d put this behind HTTPS (encrypted) and keep secrets in environment variables

13) Keeping data fresh
- Manual sync: Press the Sync button on a store
- Automatic sync (optional): A scheduler can run in the background to pull data on a schedule
- Webhooks (optional): Shopify can notify us when something changes, so we re-sync quickly

14) Glossary (plain terms)
- Tenant: A store you’ve added to the app (we use “tenant” and “store” interchangeably)
- Access Token: A secret key from Shopify that lets this app read your store data
- API: How two systems “talk” to each other (our app and Shopify)
- Database: Where your data is kept for reporting
- Dashboard: The first screen that shows your key numbers

15) How to use it (step by step)
- Sign in
- Go to Stores and click Add Store
- Paste your store domain (your-store.myshopify.com) and the Shopify Admin Access Token
- Save the store, then click “Sync Data”
- Click “View Analytics” to see charts and numbers
- Optional: Click “View Products” to see your products with images

16) Common “why isn’t it working?” answers
- “I added a store but see zeros”: You need to sync at least once
- “No orders show up”: Make sure your test orders are marked paid in Shopify; then sync
- “Products missing images”: Ensure the product has a main image in Shopify; then refresh the page
- “Invalid store domain”: Use just the domain (your-store.myshopify.com), not https://
- “Access denied”: Double-check the token and that it has read permissions (customers, orders, products)

17) What would be next in a real company setting
- Add an Install with Shopify button (OAuth) instead of pasting tokens
- Add email verification, password reset, and two-factor security
- Add more metrics—cohorts, retention, repeat purchase rate
- Add teams/roles (grant some users view-only access)
- Add background queues for faster, scalable syncing
- Deploy to cloud with monitoring and alerts

18) Short summary
You add your Shopify store. The app pulls the store’s data into its own database. The dashboard shows you totals and trends, and you can see your top customers and products. It’s a straightforward way to turn Shopify data into quick insights, made for non-technical users but built on reliable technology underneath.
