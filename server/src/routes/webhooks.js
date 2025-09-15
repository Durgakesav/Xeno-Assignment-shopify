const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ShopifyService = require('../services/shopifyService');

const router = express.Router();
const prisma = new PrismaClient();

// Shopify webhook endpoint
router.post('/shopify', async (req, res) => {
  try {
    const { id, created_at, updated_at, ...data } = req.body;
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    console.log(`Received webhook: ${topic} from ${shop}`);

    if (!shop || !topic) {
      return res.status(400).json({ error: 'Missing required headers' });
    }

    // Find tenant by shop domain
    const tenant = await prisma.tenant.findFirst({
      where: {
        shopifyUrl: shop,
        isActive: true
      }
    });

    if (!tenant) {
      console.log(`Tenant not found for shop: ${shop}`);
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const shopifyService = new ShopifyService(tenant);

    try {
      switch (topic) {
        case 'customers/create':
        case 'customers/update':
          await shopifyService.syncCustomers();
          break;
        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
        case 'orders/cancelled':
        case 'orders/fulfilled':
          await shopifyService.syncOrders();
          break;
        case 'products/create':
        case 'products/update':
          await shopifyService.syncProducts();
          break;
        default:
          console.log(`Unhandled webhook topic: ${topic}`);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (syncError) {
      console.error('Webhook sync error:', syncError);
      res.status(500).json({ error: 'Failed to process webhook data' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test webhook endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;



