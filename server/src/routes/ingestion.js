const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const { validateTenantId } = require('../utils/validation');
const ShopifyService = require('../services/shopifyService');

const router = express.Router();
const prisma = new PrismaClient();

// Manual sync for specific tenant
router.post('/sync/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { entityType } = req.body; // 'customers', 'orders', 'products', or 'all'

    // Get tenant with access token
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found or access denied' });
    }

    const shopifyService = new ShopifyService(tenant);
    let results = {};

    try {
      switch (entityType) {
        case 'customers':
          results.customers = await shopifyService.syncCustomers();
          break;
        case 'orders':
          results.orders = await shopifyService.syncOrders();
          break;
        case 'products':
          results.products = await shopifyService.syncProducts();
          break;
        case 'all':
        default:
          results = await shopifyService.fullSync();
          break;
      }

      res.json({
        message: 'Sync completed successfully',
        results,
        timestamp: new Date().toISOString()
      });
    } catch (syncError) {
      console.error('Sync error:', syncError);
      res.status(500).json({
        error: 'Sync failed',
        message: syncError.message,
        results
      });
    }
  } catch (error) {
    console.error('Ingestion sync error:', error);
    res.status(500).json({ error: 'Failed to start sync process' });
  }
});

// Get sync status for tenant
router.get('/status/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Verify tenant access
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: req.user.id
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found or access denied' });
    }

    // Get recent sync logs
    const syncLogs = await prisma.syncLog.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: 10
    });

    // Get current data counts
    const counts = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } })
    ]);

    const [customerCount, orderCount, productCount] = counts;

    // Get last successful sync for each entity type
    const lastSyncs = await Promise.all([
      prisma.syncLog.findFirst({
        where: { tenantId, entityType: 'customers', status: 'success' },
        orderBy: { completedAt: 'desc' }
      }),
      prisma.syncLog.findFirst({
        where: { tenantId, entityType: 'orders', status: 'success' },
        orderBy: { completedAt: 'desc' }
      }),
      prisma.syncLog.findFirst({
        where: { tenantId, entityType: 'products', status: 'success' },
        orderBy: { completedAt: 'desc' }
      })
    ]);

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        shopifyUrl: tenant.shopifyUrl,
        isActive: tenant.isActive
      },
      dataCounts: {
        customers: customerCount,
        orders: orderCount,
        products: productCount
      },
      lastSyncs: {
        customers: lastSyncs[0]?.completedAt || null,
        orders: lastSyncs[1]?.completedAt || null,
        products: lastSyncs[2]?.completedAt || null
      },
      recentSyncs: syncLogs
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Get sync logs for tenant
router.get('/logs/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { page = 1, limit = 20, entityType } = req.query;

    // Verify tenant access
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: req.user.id
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found or access denied' });
    }

    const whereClause = { tenantId };
    if (entityType) {
      whereClause.entityType = entityType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [syncLogs, totalCount] = await Promise.all([
      prisma.syncLog.findMany({
        where: whereClause,
        orderBy: { startedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.syncLog.count({ where: whereClause })
    ]);

    res.json({
      syncLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sync logs error:', error);
    res.status(500).json({ error: 'Failed to get sync logs' });
  }
});

// Test Shopify connection
router.post('/test/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Get tenant with access token
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found or access denied' });
    }

    const shopifyService = new ShopifyService(tenant);

    try {
      // Test connection by fetching shop info
      const axios = require('axios');
      const response = await axios.get(`https://${tenant.shopifyUrl}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': tenant.accessToken,
          'Content-Type': 'application/json'
        }
      });

      res.json({
        success: true,
        message: 'Shopify connection successful',
        shop: {
          name: response.data.shop.name,
          domain: response.data.shop.domain,
          email: response.data.shop.email,
          currency: response.data.shop.currency
        }
      });
    } catch (shopifyError) {
      res.status(400).json({
        success: false,
        message: 'Shopify connection failed',
        error: shopifyError.response?.data?.errors?.[0] || shopifyError.message
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

module.exports = router;



