const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const { validateTenantId } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview
router.get('/overview/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
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

    // Get basic counts
    const [customerCount, orderCount, productCount] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } })
    ]);

    // Get revenue metrics
    const revenueData = await prisma.order.aggregate({
      where: { tenantId },
      _sum: {
        totalPrice: true,
        subtotalPrice: true,
        totalTax: true
      },
      _avg: {
        totalPrice: true
      }
    });

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await prisma.order.count({
      where: {
        tenantId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get top customers by spend (derived from orders to be accurate)
    const topCustomerTotals = await prisma.order.groupBy({
      by: ['customerId'],
      where: { tenantId, customerId: { not: null } },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5
    });

    const topCustomerIds = topCustomerTotals.map(t => t.customerId).filter(Boolean);
    const customersMap = topCustomerIds.length
      ? (await prisma.customer.findMany({
          where: { id: { in: topCustomerIds } },
          select: { id: true, firstName: true, lastName: true, email: true, ordersCount: true }
        })).reduce((acc, c) => { acc[c.id] = c; return acc; }, {})
      : {};

    let topCustomers = topCustomerTotals.map(t => ({
      id: t.customerId,
      firstName: customersMap[t.customerId]?.firstName || null,
      lastName: customersMap[t.customerId]?.lastName || null,
      email: customersMap[t.customerId]?.email || null,
      ordersCount: customersMap[t.customerId]?.ordersCount || 0,
      totalSpent: t._sum.totalPrice || 0
    }));

    // Fallback: if no orders or customersMap missing, use customers table totals
    if (!topCustomers.length) {
      const fallback = await prisma.customer.findMany({
        where: { tenantId },
        orderBy: { totalSpent: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          ordersCount: true,
          totalSpent: true
        }
      });
      topCustomers = fallback.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        ordersCount: c.ordersCount,
        totalSpent: c.totalSpent
      }));
    }

    res.json({
      overview: {
        totalCustomers: customerCount,
        totalOrders: orderCount,
        totalProducts: productCount,
        totalRevenue: revenueData._sum.totalPrice || 0,
        averageOrderValue: revenueData._avg.totalPrice || 0,
        recentOrders
      },
      topCustomers
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: 'Failed to get overview data' });
  }
});

// Get customer analytics
router.get('/customers/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

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
    
    // Add date filtering if provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { totalSpent: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        totalSpent: true,
        ordersCount: true,
        createdAt: true
      }
    });

    // Get customer analytics
    const analytics = await prisma.customer.aggregate({
      where: whereClause,
      _sum: {
        totalSpent: true,
        ordersCount: true
      },
      _avg: {
        totalSpent: true,
        ordersCount: true
      },
      _count: true
    });

    res.json({
      customers,
      analytics: {
        totalCustomers: analytics._count,
        totalSpent: analytics._sum.totalSpent || 0,
        totalOrders: analytics._sum.ordersCount || 0,
        averageSpent: analytics._avg.totalSpent || 0,
        averageOrders: analytics._avg.ordersCount || 0
      }
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Failed to get customer analytics' });
  }
});

// Get order analytics
router.get('/orders/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

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
    
    // Add date filtering if provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Get order analytics
    const analytics = await prisma.order.aggregate({
      where: whereClause,
      _sum: {
        totalPrice: true,
        subtotalPrice: true,
        totalTax: true
      },
      _avg: {
        totalPrice: true
      },
      _count: true
    });

    // Get orders by date (for charts)
    const ordersByDate = await prisma.order.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _sum: {
        totalPrice: true
      },
      _count: true,
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      orders,
      analytics: {
        totalOrders: analytics._count,
        totalRevenue: analytics._sum.totalPrice || 0,
        averageOrderValue: analytics._avg.totalPrice || 0,
        totalTax: analytics._sum.totalTax || 0
      },
      ordersByDate: ordersByDate.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        revenue: item._sum.totalPrice || 0,
        count: item._count
      }))
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({ error: 'Failed to get order analytics' });
  }
});

// Get product analytics
router.get('/products/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 50 } = req.query;

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

    // Get products with pagination
    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        title: true,
        handle: true,
        vendor: true,
        productType: true,
        status: true,
        createdAt: true
      }
    });

    // Get product analytics
    const analytics = await prisma.product.groupBy({
      by: ['productType'],
      where: { tenantId },
      _count: true,
      orderBy: {
        _count: {
          productType: 'desc'
        }
      }
    });

    const vendorAnalytics = await prisma.product.groupBy({
      by: ['vendor'],
      where: { 
        tenantId,
        vendor: {
          not: null
        }
      },
      _count: true,
      orderBy: {
        _count: {
          vendor: 'desc'
        }
      }
    });

    res.json({
      products,
      analytics: {
        totalProducts: products.length,
        byType: analytics,
        byVendor: vendorAnalytics
      }
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Failed to get product analytics' });
  }
});

// Get revenue trends
router.get('/revenue/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

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

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get revenue by date
    const revenueData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: true,
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get total revenue for the period
    const totalRevenue = await prisma.order.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    res.json({
      period,
      startDate,
      endDate,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      dailyRevenue: revenueData.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        revenue: item._sum.totalPrice || 0,
        orders: item._count
      }))
    });
  } catch (error) {
    console.error('Get revenue trends error:', error);
    res.status(500).json({ error: 'Failed to get revenue trends' });
  }
});

module.exports = router;



