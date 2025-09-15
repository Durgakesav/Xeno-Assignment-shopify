import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';

const StoreProducts = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenant, setTenant] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/products/${tenantId}`);
        setTenant(data.tenant);
        setProducts(data.products || []);
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          {tenant ? `${tenant.name} — Products` : 'Products'}
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => navigate(`/insights/${tenantId}`)}>Insights</Button>
          <Button variant="contained" onClick={() => navigate('/tenants')}>Back to Stores</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {products.length === 0 ? (
        <Alert severity="info">No products found. Ensure products are active in Shopify, then try syncing.</Alert>
      ) : (
        <Grid container spacing={2}>
          {products.map(p => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
              <Card>
                {p.image && (
                  <CardMedia
                    component="img"
                    height="180"
                    image={p.image}
                    alt={p.title}
                  />
                )}
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom noWrap>
                    {p.title}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    {p.vendor && <Chip size="small" label={p.vendor} />}
                    {p.productType && <Chip size="small" label={p.productType} />}
                    {p.status && <Chip size="small" label={p.status} />}
                  </Box>
                  {Array.isArray(p.variants) && p.variants.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {p.variants.slice(0, 2).map(v => v.price).filter(Boolean).join(', ')}
                      {p.variants.length > 2 ? '…' : ''}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StoreProducts;


