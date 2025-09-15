const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireTenant = async (req, res, next) => {
  const { tenantId } = req.params;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }

  try {
    // Verify tenant exists and user has access
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

    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant verification error:', error);
    return res.status(500).json({ error: 'Error verifying tenant access' });
  }
};

module.exports = {
  authenticateToken,
  requireTenant
};



