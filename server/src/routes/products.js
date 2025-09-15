const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateTenantId } = require('../utils/validation');
const ShopifyService = require('../services/shopifyService');

const router = express.Router();
const prisma = new PrismaClient();

// Get live products with images for a tenant (direct from Shopify)
router.get('/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, userId: req.user.id, isActive: true },
      select: { id: true, shopifyUrl: true, accessToken: true, name: true }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found or access denied' });
    }

    const shopify = new ShopifyService(tenant);
    const products = await shopify.fetchProducts();

    const mapped = (products || []).map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      vendor: p.vendor || null,
      productType: p.product_type || null,
      status: p.status || 'active',
      createdAt: p.created_at || null,
      image: p.image?.src || (Array.isArray(p.images) && p.images[0]?.src) || null,
      variants: Array.isArray(p.variants) ? p.variants.map(v => ({ id: v.id, title: v.title, price: v.price })) : []
    }));

    res.json({ tenant: { id: tenant.id, name: tenant.name }, products: mapped });
  } catch (error) {
    console.error('Get products (live) error:', error);
    res.status(500).json({ error: 'Failed to fetch products from Shopify' });
  }
});

module.exports = router;


