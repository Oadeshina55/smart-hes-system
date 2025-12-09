import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  LinearProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerNetwork {
  _id: string;
  networkName: string;
  networkCode: string;
  parentCompany: string;
  contactInfo: {
    email: string;
    phoneNumber: string;
    address: string;
  };
  serviceArea?: string;
  meterCount: number;
  endCustomerCount: number;
  activeMeters: number;
  subscriptionStatus: 'active' | 'suspended' | 'trial' | 'expired';
  settings: {
    canAddMeters: boolean;
    canAddCustomers: boolean;
    canManageOperators: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NetworkStats {
  networkName: string;
  networkCode: string;
  subscriptionStatus: string;
  meterCount: number;
  endCustomerCount: number;
  onlineCount: number;
  offlineCount: number;
  activeCount: number;
  onlinePercentage: number;
}

const CustomerNetworkManagement: React.FC = () => {
  const { user } = useAuth();
  const [networks, setNetworks] = useState<CustomerNetwork[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<CustomerNetwork | null>(null);
  const [selectedNetworkStats, setSelectedNetworkStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    networkName: '',
    networkCode: '',
    parentCompany: 'New Hampshire',
    email: '',
    phoneNumber: '',
    address: '',
    serviceArea: '',
    subscriptionStatus: 'active' as 'active' | 'suspended' | 'trial' | 'expired',
    canAddMeters: true,
    canAddCustomers: true,
    canManageOperators: true,
  });

  useEffect(() => {
    fetchNetworks();
    fetchNetworkStats();
  }, []);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/customer-networks');
      setNetworks(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer networks');
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworkStats = async () => {
    try {
      const response = await axios.get('/dashboard/network-stats');
      setNetworkStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch network stats:', err);
    }
  };

  const handleOpenDialog = (network?: CustomerNetwork) => {
    if (network) {
      setSelectedNetwork(network);
      setFormData({
        networkName: network.networkName,
        networkCode: network.networkCode,
        parentCompany: network.parentCompany,
        email: network.contactInfo.email,
        phoneNumber: network.contactInfo.phoneNumber,
        address: network.contactInfo.address,
        serviceArea: network.serviceArea || '',
        subscriptionStatus: network.subscriptionStatus,
        canAddMeters: network.settings.canAddMeters,
        canAddCustomers: network.settings.canAddCustomers,
        canManageOperators: network.settings.canManageOperators,
      });
    } else {
      setSelectedNetwork(null);
      setFormData({
        networkName: '',
        networkCode: '',
        parentCompany: 'New Hampshire',
        email: '',
        phoneNumber: '',
        address: '',
        serviceArea: '',
        subscriptionStatus: 'active',
        canAddMeters: true,
        canAddCustomers: true,
        canManageOperators: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedNetwork(null);
    setError(null);
  };

  const handleViewStats = async (network: CustomerNetwork) => {
    try {
      const response = await axios.get(`/customer-networks/${network._id}/stats`);
      setSelectedNetworkStats(response.data.data);
      setSelectedNetwork(network);
      setOpenStatsDialog(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch network statistics');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        networkName: formData.networkName,
        networkCode: formData.networkCode,
        parentCompany: formData.parentCompany,
        contactInfo: {
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
        },
        serviceArea: formData.serviceArea || undefined,
        subscriptionStatus: formData.subscriptionStatus,
        settings: {
          canAddMeters: formData.canAddMeters,
          canAddCustomers: formData.canAddCustomers,
          canManageOperators: formData.canManageOperators,
        },
      };

      if (selectedNetwork) {
        await axios.put(`/customer-networks/${selectedNetwork._id}`, payload);
        setSuccess('Customer network updated successfully');
      } else {
        await axios.post('/customer-networks', payload);
        setSuccess('Customer network created successfully');
      }

      handleCloseDialog();
      fetchNetworks();
      fetchNetworkStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer network');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (networkId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this customer network?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/customer-networks/${networkId}`);
      setSuccess('Customer network deactivated successfully');
      fetchNetworks();
      fetchNetworkStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate customer network');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      active: 'success',
      suspended: 'error',
      trial: 'info',
      expired: 'warning',
    };
    return <Chip label={status.toUpperCase()} color={colors[status] || 'default'} size="small" />;
  };

  const getOnlinePercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. This page is only accessible to administrators.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Customer Network Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage utility companies and their networks
          </Typography>
        </Box>
        {user.role === 'admin' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Customer Network
          </Button>
        )}
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Networks</Typography>
              </Box>
              <Typography variant="h4">{networks.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Utility companies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Total Meters</Typography>
              </Box>
              <Typography variant="h4">
                {networks.reduce((sum, n) => sum + n.meterCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Across all networks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">End Customers</Typography>
              </Box>
              <Typography variant="h4">
                {networks.reduce((sum, n) => sum + n.endCustomerCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total consumers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Active Networks</Typography>
              </Box>
              <Typography variant="h4">
                {networks.filter((n) => n.subscriptionStatus === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Networks Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Network Name</TableCell>
                <TableCell>Network Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Meters</TableCell>
                <TableCell align="right">End Customers</TableCell>
                <TableCell align="right">Online %</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && networks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : networks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No customer networks found. Click "Add Customer Network" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                networks.map((network) => {
                  const stats = networkStats.find((s) => s.networkCode === network.networkCode);
                  const onlinePercentage = stats?.onlinePercentage || 0;

                  return (
                    <TableRow key={network._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {network.networkName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {network.networkCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(network.subscriptionStatus)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{network.meterCount}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{network.endCustomerCount}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${onlinePercentage.toFixed(1)}%`}
                          color={getOnlinePercentageColor(onlinePercentage)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {network.contactInfo.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {network.contactInfo.phoneNumber}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewStats(network)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {user.role === 'admin' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(network)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deactivate">
                              <IconButton
                                size="small"
                                onClick={() => handleDeactivate(network._id)}
                                disabled={!network.isActive}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedNetwork ? 'Edit Customer Network' : 'Add Customer Network'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Network Name"
                  value={formData.networkName}
                  onChange={(e) => setFormData({ ...formData, networkName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Network Code"
                  value={formData.networkCode}
                  onChange={(e) => setFormData({ ...formData, networkCode: e.target.value })}
                  required
                  disabled={!!selectedNetwork}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parent Company"
                  value={formData.parentCompany}
                  onChange={(e) => setFormData({ ...formData, parentCompany: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subscription Status</InputLabel>
                  <Select
                    value={formData.subscriptionStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionStatus: e.target.value as any,
                      })
                    }
                    label="Subscription Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="trial">Trial</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Service Area (Optional)"
                  value={formData.serviceArea}
                  onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                  placeholder="e.g., Lagos State, Benin City"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Network Permissions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Can Add Meters</InputLabel>
                  <Select
                    value={formData.canAddMeters ? 'yes' : 'no'}
                    onChange={(e) =>
                      setFormData({ ...formData, canAddMeters: e.target.value === 'yes' })
                    }
                    label="Can Add Meters"
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Can Add Customers</InputLabel>
                  <Select
                    value={formData.canAddCustomers ? 'yes' : 'no'}
                    onChange={(e) =>
                      setFormData({ ...formData, canAddCustomers: e.target.value === 'yes' })
                    }
                    label="Can Add Customers"
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Can Manage Operators</InputLabel>
                  <Select
                    value={formData.canManageOperators ? 'yes' : 'no'}
                    onChange={(e) =>
                      setFormData({ ...formData, canManageOperators: e.target.value === 'yes' })
                    }
                    label="Can Manage Operators"
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              loading ||
              !formData.networkName ||
              !formData.networkCode ||
              !formData.email ||
              !formData.phoneNumber ||
              !formData.address
            }
          >
            {selectedNetwork ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog
        open={openStatsDialog}
        onClose={() => setOpenStatsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedNetwork?.networkName} - Network Statistics
        </DialogTitle>
        <DialogContent>
          {selectedNetworkStats && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Meters
                      </Typography>
                      <Typography variant="h4">{selectedNetworkStats.totalMeters}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Online Meters
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {selectedNetworkStats.onlineMeters}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedNetworkStats.onlinePercentage}% online
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        End Customers
                      </Typography>
                      <Typography variant="h4">{selectedNetworkStats.totalCustomers}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Operators
                      </Typography>
                      <Typography variant="h4">{selectedNetworkStats.totalOperators}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Meter Status Breakdown
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Online</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedNetworkStats.onlineMeters}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (selectedNetworkStats.onlineMeters /
                              selectedNetworkStats.totalMeters) *
                            100
                          }
                          color="success"
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Offline</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedNetworkStats.offlineMeters}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (selectedNetworkStats.offlineMeters /
                              selectedNetworkStats.totalMeters) *
                            100
                          }
                          color="error"
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Active</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedNetworkStats.activeMeters}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (selectedNetworkStats.activeMeters /
                              selectedNetworkStats.totalMeters) *
                            100
                          }
                          color="info"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerNetworkManagement;
