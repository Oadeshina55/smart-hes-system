import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface BillingCycle {
  _id: string;
  meter: {
    _id: string;
    meterNumber: string;
  };
  customer: {
    _id: string;
    customerName: string;
    accountNumber: string;
    email?: string;
  };
  billingPeriod: {
    startDate: string;
    endDate: string;
    daysInPeriod: number;
  };
  energyConsumption: {
    activeImport: number;
    activeExport: number;
    reactiveImport: number;
    reactiveExport: number;
    netConsumption: number;
  };
  tariff: {
    name: string;
    type: string;
    fixedCharge: number;
  };
  costs: {
    energyCharge: number;
    demandCharge: number;
    fixedCharge: number;
    taxes: number;
    otherCharges: number;
    adjustments: number;
    totalCost: number;
  };
  status: 'draft' | 'calculated' | 'verified' | 'billed' | 'paid' | 'overdue' | 'disputed';
  billedDate?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BillingManagement: React.FC = () => {
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedBilling, setSelectedBilling] = useState<BillingCycle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const fetchBillingCycles = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Note: This endpoint may not exist yet, will need to be created
      const response = await axios.get('/billing', { params });
      setBillingCycles(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to fetch billing cycles');
      }
      // Set empty data if endpoint doesn't exist
      setBillingCycles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingCycles();
  }, [page, rowsPerPage, statusFilter]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      draft: 'default',
      calculated: 'info',
      verified: 'primary',
      billed: 'warning',
      paid: 'success',
      overdue: 'error',
      disputed: 'secondary',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon />;
      case 'billed':
      case 'overdue':
        return <PendingIcon />;
      case 'disputed':
        return <CancelIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleGenerateBilling = async (data: any) => {
    try {
      await axios.post('/billing', data);
      toast.success('Billing cycle generated successfully');
      setGenerateDialogOpen(false);
      fetchBillingCycles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate billing');
    }
  };

  const handlePrintInvoice = (billing: BillingCycle) => {
    // Generate invoice PDF or print preview
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${billing.customer.accountNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-details { margin-bottom: 20px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f2f2f2; }
              .total { font-size: 1.2em; font-weight: bold; text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>New Hampshire Capital</h1>
              <h2>ELECTRICITY INVOICE</h2>
            </div>
            <div class="invoice-details">
              <p><strong>Customer:</strong> ${billing.customer.customerName}</p>
              <p><strong>Account Number:</strong> ${billing.customer.accountNumber}</p>
              <p><strong>Meter Number:</strong> ${billing.meter?.meterNumber || 'N/A'}</p>
              <p><strong>Billing Period:</strong> ${format(new Date(billing.billingPeriod.startDate), 'PPP')} - ${format(new Date(billing.billingPeriod.endDate), 'PPP')}</p>
              <p><strong>Invoice Date:</strong> ${billing.billedDate ? format(new Date(billing.billedDate), 'PPP') : 'N/A'}</p>
              <p><strong>Due Date:</strong> ${billing.dueDate ? format(new Date(billing.dueDate), 'PPP') : 'N/A'}</p>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Energy Consumption</td>
                  <td>${billing.energyConsumption.netConsumption.toFixed(2)} kWh</td>
                  <td>-</td>
                  <td>${formatCurrency(billing.costs.energyCharge)}</td>
                </tr>
                <tr>
                  <td>Demand Charge</td>
                  <td>-</td>
                  <td>-</td>
                  <td>${formatCurrency(billing.costs.demandCharge)}</td>
                </tr>
                <tr>
                  <td>Fixed Charge</td>
                  <td>-</td>
                  <td>-</td>
                  <td>${formatCurrency(billing.costs.fixedCharge)}</td>
                </tr>
                <tr>
                  <td>Taxes</td>
                  <td>-</td>
                  <td>-</td>
                  <td>${formatCurrency(billing.costs.taxes)}</td>
                </tr>
                <tr>
                  <td>Other Charges</td>
                  <td>-</td>
                  <td>-</td>
                  <td>${formatCurrency(billing.costs.otherCharges)}</td>
                </tr>
                <tr>
                  <td>Adjustments</td>
                  <td>-</td>
                  <td>-</td>
                  <td>${formatCurrency(billing.costs.adjustments)}</td>
                </tr>
              </tbody>
            </table>
            <p class="total">TOTAL AMOUNT DUE: ${formatCurrency(billing.costs.totalCost)}</p>
            <p style="margin-top: 40px; text-align: center; font-size: 0.9em;">
              Thank you for your business. Please pay by the due date to avoid disconnection.
            </p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendInvoice = async (billing: BillingCycle) => {
    try {
      await axios.post(`/billing/${billing._id}/send-invoice`);
      toast.success('Invoice sent to customer email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invoice');
    }
  };

  // Calculate statistics
  const stats = {
    totalBilled: billingCycles.reduce((sum, b) => sum + b.costs.totalCost, 0),
    totalPaid: billingCycles.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.costs.totalCost, 0),
    totalPending: billingCycles.filter(b => b.status === 'billed').reduce((sum, b) => sum + b.costs.totalCost, 0),
    totalOverdue: billingCycles.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.costs.totalCost, 0),
  };

  const statusDistribution = [
    { name: 'Paid', value: billingCycles.filter(b => b.status === 'paid').length },
    { name: 'Billed', value: billingCycles.filter(b => b.status === 'billed').length },
    { name: 'Overdue', value: billingCycles.filter(b => b.status === 'overdue').length },
    { name: 'Draft', value: billingCycles.filter(b => b.status === 'draft').length },
    { name: 'Disputed', value: billingCycles.filter(b => b.status === 'disputed').length },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Billing & Revenue Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage billing cycles, invoices, and payments
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBillingCycles}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate Billing
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Total Billed
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                {formatCurrency(stats.totalBilled)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {billingCycles.length} invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Total Paid
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                {formatCurrency(stats.totalPaid)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {((stats.totalPaid / stats.totalBilled) * 100 || 0).toFixed(1)}% collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Pending
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                {formatCurrency(stats.totalPending)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Overdue
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                {formatCurrency(stats.totalOverdue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Billing Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Revenue Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Total Billed', amount: stats.totalBilled },
                    { name: 'Paid', amount: stats.totalPaid },
                    { name: 'Pending', amount: stats.totalPending },
                    { name: 'Overdue', amount: stats.totalOverdue },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="calculated">Calculated</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="billed">Billed</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="disputed">Disputed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Billing Cycles Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Period</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Meter</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Consumption</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Due Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : billingCycles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info">No billing cycles found. Generate your first billing cycle to get started.</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                billingCycles.map((billing) => (
                  <TableRow key={billing._id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(billing.billingPeriod.startDate), 'MMM dd')} -{' '}
                        {format(new Date(billing.billingPeriod.endDate), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {billing.billingPeriod.daysInPeriod} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {billing.customer.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {billing.customer.accountNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{billing.meter?.meterNumber || 'N/A'}</TableCell>
                    <TableCell>
                      {billing.energyConsumption.netConsumption.toFixed(2)} kWh
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(billing.costs.totalCost)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(billing.status)}
                        label={billing.status.toUpperCase()}
                        color={getStatusColor(billing.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {billing.dueDate ? format(new Date(billing.dueDate), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBilling(billing);
                              setDetailOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Invoice">
                          <IconButton
                            size="small"
                            onClick={() => handlePrintInvoice(billing)}
                            disabled={billing.status === 'draft'}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        {billing.customer.email && (
                          <Tooltip title="Send to Email">
                            <IconButton
                              size="small"
                              onClick={() => handleSendInvoice(billing)}
                              disabled={billing.status === 'draft'}
                            >
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedBilling && (
          <>
            <DialogTitle>Billing Cycle Details</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <strong>Status:</strong> {selectedBilling.status.toUpperCase()}
                  </Alert>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">{selectedBilling.customer.customerName}</Typography>
                  <Typography variant="caption">{selectedBilling.customer.accountNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Billing Period
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedBilling.billingPeriod.startDate), 'PPP')} -{' '}
                    {format(new Date(selectedBilling.billingPeriod.endDate), 'PPP')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Energy Consumption
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Active Import
                      </Typography>
                      <Typography>{selectedBilling.energyConsumption.activeImport.toFixed(2)} kWh</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Net Consumption
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {selectedBilling.energyConsumption.netConsumption.toFixed(2)} kWh
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Cost Breakdown
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Energy Charge" />
                      <Typography>{formatCurrency(selectedBilling.costs.energyCharge)}</Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Demand Charge" />
                      <Typography>{formatCurrency(selectedBilling.costs.demandCharge)}</Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Fixed Charge" />
                      <Typography>{formatCurrency(selectedBilling.costs.fixedCharge)}</Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Taxes" />
                      <Typography>{formatCurrency(selectedBilling.costs.taxes)}</Typography>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary={<Typography variant="h6">Total Amount</Typography>}
                      />
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedBilling.costs.totalCost)}
                      </Typography>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintInvoice(selectedBilling)}
              >
                Print Invoice
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Generate Billing Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New Billing Cycle</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This feature will be implemented to generate billing cycles automatically based on consumption data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingManagement;
