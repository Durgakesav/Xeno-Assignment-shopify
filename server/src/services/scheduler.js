const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const ShopifyService = require('./shopifyService');

const prisma = new PrismaClient();

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  // Start scheduled sync for all active tenants
  startScheduledSync() {
    console.log('🕐 Starting scheduled sync service...');

    // Run every 15 minutes
    const syncJob = cron.schedule('*/15 * * * *', async () => {
      console.log('🔄 Running scheduled sync...');
      await this.syncAllTenants();
    }, {
      scheduled: false
    });

    // Run every hour for full sync
    const fullSyncJob = cron.schedule('0 * * * *', async () => {
      console.log('🔄 Running full scheduled sync...');
      await this.fullSyncAllTenants();
    }, {
      scheduled: false
    });

    this.jobs.set('sync', syncJob);
    this.jobs.set('fullSync', fullSyncJob);

    // Start the jobs
    syncJob.start();
    fullSyncJob.start();

    console.log('✅ Scheduled sync service started');
  }

  // Stop all scheduled jobs
  stopScheduledSync() {
    console.log('🛑 Stopping scheduled sync service...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} job`);
    });

    this.jobs.clear();
    console.log('✅ Scheduled sync service stopped');
  }

  // Sync all active tenants
  async syncAllTenants() {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true }
      });

      console.log(`Found ${tenants.length} active tenants to sync`);

      const results = await Promise.allSettled(
        tenants.map(tenant => this.syncTenant(tenant))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Sync completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    }
  }

  // Full sync all active tenants
  async fullSyncAllTenants() {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true }
      });

      console.log(`Found ${tenants.length} active tenants for full sync`);

      const results = await Promise.allSettled(
        tenants.map(tenant => this.fullSyncTenant(tenant))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Full sync completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('Error in full scheduled sync:', error);
    }
  }

  // Sync individual tenant
  async syncTenant(tenant) {
    try {
      console.log(`Syncing tenant: ${tenant.name} (${tenant.shopifyUrl})`);
      
      const shopifyService = new ShopifyService(tenant);
      
      // Sync customers and orders (most important for real-time updates)
      await Promise.all([
        shopifyService.syncCustomers(),
        shopifyService.syncOrders()
      ]);

      console.log(`✅ Successfully synced tenant: ${tenant.name}`);
    } catch (error) {
      console.error(`❌ Failed to sync tenant ${tenant.name}:`, error.message);
      throw error;
    }
  }

  // Full sync individual tenant
  async fullSyncTenant(tenant) {
    try {
      console.log(`Full syncing tenant: ${tenant.name} (${tenant.shopifyUrl})`);
      
      const shopifyService = new ShopifyService(tenant);
      await shopifyService.fullSync();

      console.log(`✅ Successfully full synced tenant: ${tenant.name}`);
    } catch (error) {
      console.error(`❌ Failed to full sync tenant ${tenant.name}:`, error.message);
      throw error;
    }
  }

  // Manual sync for specific tenant
  async syncTenantById(tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      if (!tenant.isActive) {
        throw new Error('Tenant is not active');
      }

      await this.syncTenant(tenant);
      return { success: true, message: 'Sync completed successfully' };
    } catch (error) {
      console.error(`Manual sync failed for tenant ${tenantId}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Get sync status for all tenants
  async getSyncStatus() {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          shopifyUrl: true,
          syncLogs: {
            orderBy: { startedAt: 'desc' },
            take: 1
          }
        }
      });

      return tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        shopifyUrl: tenant.shopifyUrl,
        lastSync: tenant.syncLogs[0]?.completedAt || null,
        lastSyncStatus: tenant.syncLogs[0]?.status || 'never'
      }));
    } catch (error) {
      console.error('Error getting sync status:', error);
      return [];
    }
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;



