import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import {
  Store as StoreIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await axios.get('/api/tenants');
      setTenants(response.data.tenants);
    } catch (error) {
      setError('Failed to load stores');
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (tenantId) => {
    try {
      await axios.post(`/api/ingestion/sync/${tenantId}`, { entityType: 'all' });
      // Refresh tenants to get updated counts
      fetchTenants();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const TenantCard = ({ tenant }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="div">
            {tenant.name}
          </Typography>
          <Chip
            label={tenant.isActive ? 'Active' : 'Inactive'}
            color={tenant.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
        <Typography color="textSecondary" gutterBottom>
          {tenant.shopifyUrl}
        </Typography>
        <Box display="flex" gap={2} my={2}>
          <Box textAlign="center">
            <Typography variant="h6">{tenant._count.customers}</Typography>
            <Typography variant="caption" color="textSecondary">Customers</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{tenant._count.orders}</Typography>
            <Typography variant="caption" color="textSecondary">Orders</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{tenant._count.products}</Typography>
            <Typography variant="caption" color="textSecondary">Products</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} mt={2}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/insights/${tenant.id}`)}
            fullWidth
          >
            View Analytics
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SyncIcon />}
            onClick={() => handleSync(tenant.id)}
            fullWidth
          >
            Sync Data
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const totalCustomers = tenants.reduce((sum, tenant) => sum + tenant._count.customers, 0);
  const totalOrders = tenants.reduce((sum, tenant) => sum + tenant._count.orders, 0);
  const totalProducts = tenants.reduce((sum, tenant) => sum + tenant._count.products, 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name || user?.email}!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Here's an overview of your Shopify stores and analytics.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stores"
            value={tenants.length}
            icon={<StoreIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={totalCustomers.toLocaleString()}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={totalOrders.toLocaleString()}
            icon={<OrdersIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={totalProducts.toLocaleString()}
            icon={<RevenueIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" gutterBottom>
            Your Stores
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/tenants')}
          >
            Manage Stores
          </Button>
        </Box>

        {tenants.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No stores connected yet
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Connect your first Shopify store to start analyzing your data
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/tenants')}
            >
              Add Store
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {tenants.map((tenant) => (
              <Grid item xs={12} sm={6} md={4} key={tenant.id}>
                <TenantCard tenant={tenant} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;



