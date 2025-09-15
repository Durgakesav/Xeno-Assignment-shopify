import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shopifyUrl: '',
    accessToken: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/api/tenants');
      setTenants(response.data.tenants);
    } catch (error) {
      setError('Failed to load stores');
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        shopifyUrl: tenant.shopifyUrl,
        accessToken: '••••••••••••••••' // Don't show actual token
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        shopifyUrl: '',
        accessToken: ''
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingTenant(null);
    setFormData({
      name: '',
      shopifyUrl: '',
      accessToken: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTenant) {
        // Update tenant
        const updateData = {
          name: formData.name,
          ...(formData.accessToken !== '••••••••••••••••' && { accessToken: formData.accessToken })
        };
        await api.put(`/api/tenants/${editingTenant.id}`, updateData);
      } else {
        // Create tenant
        await api.post('/api/tenants', formData);
      }
      
      await fetchTenants();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save store');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this store? This will also delete all associated data.')) {
      try {
        await api.delete(`/api/tenants/${tenantId}`);
        await fetchTenants();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete store');
      }
    }
  };

  const handleSync = async (tenantId) => {
    try {
      await api.post(`/api/ingestion/sync/${tenantId}`, { entityType: 'all' });
      await fetchTenants(); // Refresh to get updated counts
    } catch (error) {
      setError('Sync failed');
      console.error('Sync error:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Manage Stores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Store
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store Name</TableCell>
                <TableCell>Shopify URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data Counts</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{tenant.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {tenant.shopifyUrl}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tenant.isActive ? 'Active' : 'Inactive'}
                      color={tenant.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={2}>
                      <Typography variant="caption">
                        {tenant._count.customers} customers
                      </Typography>
                      <Typography variant="caption">
                        {tenant._count.orders} orders
                      </Typography>
                      <Typography variant="caption">
                        {tenant._count.products} products
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Analytics">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/insights/${tenant.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Products">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/products/${tenant.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sync Data">
                      <IconButton
                        size="small"
                        onClick={() => handleSync(tenant.id)}
                      >
                        <SyncIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Store">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(tenant)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Store">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(tenant.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTenant ? 'Edit Store' : 'Add New Store'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Store Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={submitting}
            />
            <TextField
              margin="dense"
              name="shopifyUrl"
              label="Shopify URL"
              fullWidth
              variant="outlined"
              value={formData.shopifyUrl}
              onChange={handleChange}
              placeholder="your-store.myshopify.com"
              required
              disabled={submitting}
            />
            <TextField
              margin="dense"
              name="accessToken"
              label="Access Token"
              fullWidth
              variant="outlined"
              value={formData.accessToken}
              onChange={handleChange}
              type="password"
              required
              disabled={submitting}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : (editingTenant ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Tenants;



