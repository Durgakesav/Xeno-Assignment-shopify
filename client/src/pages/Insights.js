import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Sync as SyncIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Insights = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [overview, setOverview] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      try {
        await Promise.all([
          fetchOverview(),
          fetchCustomers(),
          fetchOrders(),
          fetchProducts(),
          fetchRevenueData()
        ]);
      } catch (e) {
        // error state handled in individual fetchers; ensure we stop loading
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    setLoading(true);
    loadAll();
    return () => {
      isMounted = false;
    };
  }, [tenantId, dateRange]);

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`/api/insights/overview/${tenantId}`);
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`/api/insights/customers/${tenantId}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/insights/orders/${tenantId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`/api/insights/products/${tenantId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await axios.get(`/api/insights/revenue/${tenantId}?period=${dateRange}`);
      setRevenueData(response.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const handleSync = async () => {
    try {
      await axios.post(`/api/ingestion/sync/${tenantId}`, { entityType: 'all' });
      // Refresh all data
      await Promise.all([
        fetchOverview(),
        fetchCustomers(),
        fetchOrders(),
        fetchProducts(),
        fetchRevenueData()
      ]);
    } catch (error) {
      setError('Sync failed');
      console.error('Sync error:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
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
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Store Analytics
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={handleSync}
          >
            Sync Data
          </Button>
        </Box>
      </Box>

      {overview && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Customers"
              value={overview.overview.totalCustomers.toLocaleString()}
              icon={<PeopleIcon sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Orders"
              value={overview.overview.totalOrders.toLocaleString()}
              icon={<OrdersIcon sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={`$${overview.overview.totalRevenue.toLocaleString()}`}
              icon={<RevenueIcon sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Avg Order Value"
              value={`$${overview.overview.averageOrderValue.toFixed(2)}`}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
        </Grid>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Revenue Trends" />
          <Tab label="Orders" />
          <Tab label="Customers" />
          <Tab label="Products" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Revenue Trends
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData.dailyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Orders Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={orders.ordersByDate || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Statistics
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Orders: {orders.analytics?.totalOrders || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Revenue: ${orders.analytics?.totalRevenue || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Order Value: ${orders.analytics?.averageOrderValue || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" gutterBottom>
                    Top 5 Customers by Spend
                  </Typography>
                  {overview?.topCustomers?.map((customer) => (
                    <Box key={customer.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                      <Box>
                        <Typography variant="body1">
                          {customer.firstName} {customer.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {customer.email}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body1" fontWeight="bold">
                          ${customer.totalSpent}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {customer.ordersCount} orders
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Customer Statistics
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Customers: {customers.analytics?.totalCustomers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Spent: ${customers.analytics?.totalSpent || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Spent: ${customers.analytics?.averageSpent || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Products by Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={products.analytics?.byType || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="_count"
                      >
                        {(products.analytics?.byType || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Products by Vendor
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={products.analytics?.byVendor || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendor" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="_count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Insights;



