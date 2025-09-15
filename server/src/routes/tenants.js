const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateTenant, validateTenantId } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all tenants for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        shopifyUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            orders: true,
            products: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Get specific tenant
router.get('/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: req.params.tenantId,
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        shopifyUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            orders: true,
            products: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Create new tenant
router.post('/', authenticateToken, validateTenant, async (req, res) => {
  try {
    const { name, shopifyUrl, accessToken } = req.body;

    // Check if tenant already exists for this user
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        shopifyUrl,
        userId: req.user.id
      }
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant already exists for this Shopify store' });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        shopifyUrl,
        accessToken,
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        shopifyUrl: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Update tenant
router.put('/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    const { name, accessToken, isActive } = req.body;

    // Verify tenant belongs to user
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        id: req.params.tenantId,
        userId: req.user.id
      }
    });

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { id: req.params.tenantId },
      data: {
        ...(name && { name }),
        ...(accessToken && { accessToken }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        name: true,
        shopifyUrl: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Tenant updated successfully',
      tenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Delete tenant
router.delete('/:tenantId', authenticateToken, validateTenantId, async (req, res) => {
  try {
    // Verify tenant belongs to user
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        id: req.params.tenantId,
        userId: req.user.id
      }
    });

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Delete tenant (cascade will handle related data)
    await prisma.tenant.delete({
      where: { id: req.params.tenantId }
    });

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

module.exports = router;



