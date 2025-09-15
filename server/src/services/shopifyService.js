const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ShopifyService {
  constructor(tenant) {
    this.tenant = tenant;
    // Normalize domain to avoid double protocol (e.g., https://https://domain)
    const domain = (tenant.shopifyUrl || '')
      .toString()
      .trim()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .toLowerCase();
    this.domain = domain;
    this.baseUrl = `https://${domain}/admin/api/2023-10`;
    this.headers = {
      'X-Shopify-Access-Token': tenant.accessToken,
      'Content-Type': 'application/json'
    };
  }

  // Generic method to fetch paginated data from Shopify
  async fetchPaginatedData(endpoint, expectedKey, limit = 250, extraParams = {}) {
    const allData = [];
    let nextPageInfo = null;
    let page = 1;

    try {
      do {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          headers: this.headers,
          params: nextPageInfo ? { page_info: nextPageInfo, ...extraParams } : { limit, ...extraParams }
        });

        const data = response.data;
        const key = expectedKey;
        const items = Array.isArray(data[key]) ? data[key] : [];
        allData.push(...items);

        // Check for pagination
        const linkHeader = response.headers.link;
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
          nextPageInfo = nextMatch ? nextMatch[1].split('page_info=')[1] : null;
        } else {
          nextPageInfo = null;
        }

        page++;
      } while (nextPageInfo && page <= 10); // Safety limit

      return allData;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch ${endpoint}: ${error.response?.data?.errors?.[0] || error.message}`);
    }
  }

  // Fetch customers from Shopify
  async fetchCustomers() {
    return this.fetchPaginatedData('/customers.json', 'customers');
  }

  // Fetch orders from Shopify
  async fetchOrders() {
    // Include closed/cancelled/unpaid etc.
    return this.fetchPaginatedData('/orders.json', 'orders', 250, { status: 'any' });
  }

  // Fetch products from Shopify
  async fetchProducts() {
    return this.fetchPaginatedData('/products.json', 'products');
  }

  // Sync customers to database
  async syncCustomers() {
    const startTime = new Date();
    let recordsProcessed = 0;
    let recordsFailed = 0;
    let errorMessage = null;

    try {
      const shopifyCustomers = await this.fetchCustomers();
      
      for (const shopifyCustomer of shopifyCustomers) {
        try {
          await prisma.customer.upsert({
            where: {
              tenantId_shopifyId: {
                tenantId: this.tenant.id,
                shopifyId: shopifyCustomer.id.toString()
              }
            },
            update: {
              email: shopifyCustomer.email || null,
              firstName: shopifyCustomer.first_name || null,
              lastName: shopifyCustomer.last_name || null,
              phone: shopifyCustomer.phone || null,
              totalSpent: parseFloat(shopifyCustomer.total_spent || 0),
              ordersCount: parseInt(shopifyCustomer.orders_count || 0)
            },
            create: {
              tenantId: this.tenant.id,
              shopifyId: shopifyCustomer.id.toString(),
              email: shopifyCustomer.email || null,
              firstName: shopifyCustomer.first_name || null,
              lastName: shopifyCustomer.last_name || null,
              phone: shopifyCustomer.phone || null,
              totalSpent: parseFloat(shopifyCustomer.total_spent || 0),
              ordersCount: parseInt(shopifyCustomer.orders_count || 0)
            }
          });
          recordsProcessed++;
        } catch (error) {
          console.error('Error syncing customer:', error);
          recordsFailed++;
        }
      }

      // Create sync log
      await prisma.syncLog.create({
        data: {
          tenantId: this.tenant.id,
          entityType: 'customers',
          status: recordsFailed === 0 ? 'success' : 'partial',
          recordsProcessed,
          recordsFailed,
          errorMessage: recordsFailed > 0 ? 'Some customers failed to sync' : null,
          completedAt: new Date()
        }
      });

      return { recordsProcessed, recordsFailed };
    } catch (error) {
      errorMessage = error.message;
      recordsFailed = 1;

      await prisma.syncLog.create({
        data: {
          tenantId: this.tenant.id,
          entityType: 'customers',
          status: 'error',
          recordsProcessed,
          recordsFailed,
          errorMessage,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  // Sync orders to database
  async syncOrders() {
    const startTime = new Date();
    let recordsProcessed = 0;
    let recordsFailed = 0;
    let errorMessage = null;

    try {
      const shopifyOrders = await this.fetchOrders();
      
      for (const shopifyOrder of shopifyOrders) {
        try {
          // Find customer if exists
          let customerId = null;
          if (shopifyOrder.customer) {
            const customer = await prisma.customer.findUnique({
              where: {
                tenantId_shopifyId: {
                  tenantId: this.tenant.id,
                  shopifyId: shopifyOrder.customer.id.toString()
                }
              }
            });
            customerId = customer?.id;
          }

          // Create/update order
          const order = await prisma.order.upsert({
            where: {
              tenantId_shopifyId: {
                tenantId: this.tenant.id,
                shopifyId: shopifyOrder.id.toString()
              }
            },
            update: {
              orderNumber: shopifyOrder.name,
              totalPrice: parseFloat(shopifyOrder.total_price || 0),
              subtotalPrice: parseFloat(shopifyOrder.subtotal_price || 0),
              totalTax: parseFloat(shopifyOrder.total_tax || 0),
              currency: shopifyOrder.currency || 'USD',
              financialStatus: shopifyOrder.financial_status || null,
              fulfillmentStatus: shopifyOrder.fulfillment_status || null,
              processedAt: shopifyOrder.processed_at ? new Date(shopifyOrder.processed_at) : null,
              customerId
            },
            create: {
              tenantId: this.tenant.id,
              shopifyId: shopifyOrder.id.toString(),
              orderNumber: shopifyOrder.name,
              totalPrice: parseFloat(shopifyOrder.total_price || 0),
              subtotalPrice: parseFloat(shopifyOrder.subtotal_price || 0),
              totalTax: parseFloat(shopifyOrder.total_tax || 0),
              currency: shopifyOrder.currency || 'USD',
              financialStatus: shopifyOrder.financial_status || null,
              fulfillmentStatus: shopifyOrder.fulfillment_status || null,
              processedAt: shopifyOrder.processed_at ? new Date(shopifyOrder.processed_at) : null,
              customerId
            }
          });

          // Sync line items
          if (shopifyOrder.line_items && shopifyOrder.line_items.length > 0) {
            // Delete existing line items
            await prisma.orderLineItem.deleteMany({
              where: { orderId: order.id }
            });

            // Create new line items
            for (const lineItem of shopifyOrder.line_items) {
              await prisma.orderLineItem.create({
                data: {
                  orderId: order.id,
                  quantity: parseInt(lineItem.quantity || 0),
                  price: parseFloat(lineItem.price || 0),
                  title: lineItem.title || '',
                  variantId: lineItem.variant_id ? lineItem.variant_id.toString() : null
                }
              });
            }
          }

          recordsProcessed++;
        } catch (error) {
          console.error('Error syncing order:', error);
          recordsFailed++;
        }
      }

      // Create sync log
      await prisma.syncLog.create({
        data: {
          tenantId: this.tenant.id,
          entityType: 'orders',
          status: recordsFailed === 0 ? 'success' : 'partial',
          recordsProcessed,
          recordsFailed,
          errorMessage: recordsFailed > 0 ? 'Some orders failed to sync' : null,
          completedAt: new Date()
        }
      });

      return { recordsProcessed, recordsFailed };
    } catch (error) {
      errorMessage = error.message;
      recordsFailed = 1;

      await prisma.syncLog.create({
        data: {
          tenantId: this.tenant.id,
          entityType: 'orders',
          status: 'error',
          recordsProcessed,
          recordsFailed,
          errorMessage,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  // Sync products to database
  async syncProducts() {
    const startTime = new Date();
    let recordsProcessed = 0;
    let recordsFailed = 0;
    let errorMessage = null;

    try {
      const shopifyProducts = await this.fetchProducts();
      
      for (const shopifyProduct of shopifyProducts) {
        try {
          await prisma.product.upsert({
            where: {
              tenantId_shopifyId: {
                tenantId: this.tenant.id,
                shopifyId: shopifyProduct.id.toString()
              }
            },
            update: {
              title: shopifyProduct.title || '',
              handle: shopifyProduct.handle || '',
              description: shopifyProduct.body_html || null,
              vendor: shopifyProduct.vendor || null,
              productType: shopifyProduct.product_type || null,
              status: shopifyProduct.status || 'active'
            },
            create: {
              tenantId: this.tenant.id,
              shopifyId: shopifyProduct.id.toString(),
              title: shopifyProduct.title || '',
              handle: shopifyProduct.handle || '',
              description: shopifyProduct.body_html || null,
              vendor: shopifyProduct.vendor || null,
              productType: shopifyProduct.product_type || null,
              status: shopifyProduct.status || 'active'
            }
          });
          recordsProcessed++;
        } catch (error) {
          console.error('Error syncing product:', error);
          recordsFailed++;
        }
      }

      // Create sync log
      await prisma.syncLog.create({
        data: {
          tenantId: this.tenant.id,
          entityType: 'products',
          status: recordsFailed === 0 ? 'success' : 'partial',
          recordsProcessed,
          recordsFailed,
          errorMessage: recordsFailed > 0 ? 'Some products failed to sync' : null,
          completedAt: new Date()
        }
      });

      return { recordsProcessed, recordsFailed };
    } catch (error) {
      errorMessage = error.message;
      recordsFailed = 1;

      await prisma.syncLog.create({
        data: {
          tenantId: this.tenant.id,
          entityType: 'products',
          status: 'error',
          recordsProcessed,
          recordsFailed,
          errorMessage,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  // Full sync of all data
  async fullSync() {
    const results = {
      customers: { recordsProcessed: 0, recordsFailed: 0 },
      orders: { recordsProcessed: 0, recordsFailed: 0 },
      products: { recordsProcessed: 0, recordsFailed: 0 }
    };

    try {
      console.log(`Starting full sync for tenant ${this.tenant.id}`);
      
      // Sync in order: customers first, then orders, then products
      results.customers = await this.syncCustomers();
      results.orders = await this.syncOrders();
      results.products = await this.syncProducts();

      console.log(`Full sync completed for tenant ${this.tenant.id}:`, results);
      return results;
    } catch (error) {
      console.error(`Full sync failed for tenant ${this.tenant.id}:`, error);
      throw error;
    }
  }
}

module.exports = ShopifyService;



