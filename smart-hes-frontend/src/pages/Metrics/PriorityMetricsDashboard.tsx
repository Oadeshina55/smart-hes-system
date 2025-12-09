import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ElectricBolt,
  Warning,
  AccountBalance,
  SignalCellularAlt,
  PowerOff,
  Speed,
  BatteryChargingFull,
  Security,
  ShowChart,
  NetworkCheck,
  TrendingUp,
  Assessment,
  Refresh,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  MonetizationOn,
  Shield,
  NetworkWifi,
  Event,
  Timer,
  VpnKey,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

interface NetworkMetricsSummary {
  totalMeters: number;
  avgPower: number;
  avgVoltage: number;
  totalEnergy: number;
  connectedMeters: number;
  disconnectedMeters: number;
  avgSignalQuality: number;
  metersWithTamper: number;
  metersWithLowCredit: number;
}

interface CriticalAlert {
  meter: string;
  serialNumber: string;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  timestamp: string;
}

interface DataQualityIssue {
  meterNumber: string;
  serialNumber: string;
  dataQuality: {
    completeness: number;
    validationStatus: string;
    missingParameters: string[];
  };
  timestamp: string;
}

const PriorityMetricsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [customerNetworks, setCustomerNetworks] = useState<any[]>([]);
  const [summary, setSummary] = useState<NetworkMetricsSummary | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [dataQualityIssues, setDataQualityIssues] = useState<DataQualityIssue[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';
  const isCustomerOperator = user?.role === 'customer-operator';

  useEffect(() => {
    if (isCustomerOperator && user?.customerNetwork) {
      setSelectedNetwork(user.customerNetwork as string);
    }
    fetchCustomerNetworks();
  }, [user]);

  useEffect(() => {
    if (selectedNetwork) {
      fetchDashboardData();
    }
  }, [selectedNetwork]);

  const fetchCustomerNetworks = async () => {
    try {
      const response = await axios.get('/customer-networks');
      setCustomerNetworks(response.data.data);

      // Auto-select first network if admin/operator and none selected
      if ((isAdmin || isOperator) && !selectedNetwork && response.data.data.length > 0) {
        setSelectedNetwork(response.data.data[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch customer networks:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/priority-metrics/network/${selectedNetwork}/dashboard`);
      const data = response.data.data;

      setSummary(data.summary);
      setCriticalAlerts(data.criticalAlerts || []);
      setDataQualityIssues(data.dataQualityIssues || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load priority metrics dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const getConnectionColor = (connected: number, total: number) => {
    const percentage = (connected / total) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getSignalQualityColor = (quality: number) => {
    if (quality >= 70) return 'success';
    if (quality >= 40) return 'warning';
    return 'error';
  };

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Priority Metrics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            14 Critical OBIS Parameters for Billing, Security & Diagnostics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {(isAdmin || isOperator) && (
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>Customer Network</InputLabel>
              <Select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                label="Customer Network"
              >
                {customerNetworks.map((network) => (
                  <MenuItem key={network._id} value={network._id}>
                    {network.networkName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Critical Alerts" icon={<Warning />} iconPosition="end" />
          <Tab label="Data Quality" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && summary && (
        <>
          {/* Key Metrics Summary */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ElectricBolt sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Total Energy</Typography>
                  </Box>
                  <Typography variant="h4">{summary.totalEnergy?.toFixed(2) || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    kWh (Cumulative)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Speed sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6">Avg Power</Typography>
                  </Box>
                  <Typography variant="h4">{summary.avgPower?.toFixed(2) || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    kW (Instantaneous)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BatteryChargingFull sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Avg Voltage</Typography>
                  </Box>
                  <Typography variant="h4">{summary.avgVoltage?.toFixed(1) || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    V (Phase A)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SignalCellularAlt sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">Signal Quality</Typography>
                  </Box>
                  <Typography variant="h4">
                    {summary.avgSignalQuality?.toFixed(0) || 0}%
                  </Typography>
                  <Chip
                    label={
                      summary.avgSignalQuality >= 70
                        ? 'Excellent'
                        : summary.avgSignalQuality >= 40
                        ? 'Fair'
                        : 'Poor'
                    }
                    color={getSignalQualityColor(summary.avgSignalQuality || 0)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Connection Status & Security */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Connection Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Connected</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {summary.connectedMeters} / {summary.totalMeters}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(summary.connectedMeters / summary.totalMeters) * 100}
                      color={getConnectionColor(summary.connectedMeters, summary.totalMeters)}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                        <Typography variant="h5">{summary.connectedMeters}</Typography>
                        <Typography variant="caption">Connected</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                        <PowerOff sx={{ fontSize: 40, color: 'error.main' }} />
                        <Typography variant="h5">{summary.disconnectedMeters}</Typography>
                        <Typography variant="caption">Disconnected</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security & Alerts
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          bgcolor: summary.metersWithTamper > 0 ? 'error.light' : 'grey.100',
                          borderRadius: 2,
                        }}
                      >
                        <Security
                          sx={{
                            fontSize: 40,
                            color: summary.metersWithTamper > 0 ? 'error.main' : 'grey.500',
                          }}
                        />
                        <Typography variant="h5">{summary.metersWithTamper}</Typography>
                        <Typography variant="caption">Tamper Events</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          bgcolor: summary.metersWithLowCredit > 0 ? 'warning.light' : 'grey.100',
                          borderRadius: 2,
                        }}
                      >
                        <AccountBalance
                          sx={{
                            fontSize: 40,
                            color: summary.metersWithLowCredit > 0 ? 'warning.main' : 'grey.500',
                          }}
                        />
                        <Typography variant="h5">{summary.metersWithLowCredit}</Typography>
                        <Typography variant="caption">Low Credit</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Priority metrics updated in real-time from meter readings
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 14 Priority Metrics Reference - Enhanced */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Assessment sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">
                    14 Critical OBIS Parameters - Detailed Reference
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Essential metrics for billing accuracy, security monitoring, and network diagnostics
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                These 14 parameters are industry-standard OBIS codes used for smart meter monitoring.
                Each metric serves a specific purpose in ensuring accurate billing, detecting fraud, and maintaining grid reliability.
              </Alert>

              {/* Category 1: Billing & Revenue Protection */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                <MonetizationOn sx={{ mr: 1 }} /> Billing & Revenue Protection
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#1" size="small" color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Cumulative Active Energy</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:1.8.0.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Total electrical energy consumed (in kWh) since meter installation.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> This is the PRIMARY billing parameter. All customer invoices are calculated from this value.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Monthly billing calculations</Typography></li>
                        <li><Typography variant="body2">Revenue assurance and reconciliation</Typography></li>
                        <li><Typography variant="body2">Energy consumption trend analysis</Typography></li>
                        <li><Typography variant="body2">Fraud detection (sudden drops indicate tampering)</Typography></li>
                      </ul>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Any discrepancy in this parameter directly impacts revenue. Monitor for unexpected resets or negative values.
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#3" size="small" color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Current Credit Balance</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: Prepaid Registers</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Remaining credit balance on prepaid meters (in currency units).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Prevents service disruptions and enables proactive customer engagement.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Automatic low-credit alerts to customers</Typography></li>
                        <li><Typography variant="body2">Preventing unexpected disconnections</Typography></li>
                        <li><Typography variant="body2">Cash flow forecasting for utility</Typography></li>
                        <li><Typography variant="body2">Customer segmentation by usage patterns</Typography></li>
                      </ul>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Send SMS/email alerts when credit falls below configurable thresholds (e.g., 20% remaining).
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#11" size="small" color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Cumulative Reactive Energy</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:3.8.0.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Total reactive power consumed (in kVArh) - energy that doesn't perform useful work.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Industrial customers are often charged for poor power factor. Helps utilities manage grid efficiency.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Power factor penalty calculations</Typography></li>
                        <li><Typography variant="body2">Identifying customers with inductive loads</Typography></li>
                        <li><Typography variant="body2">Grid voltage regulation planning</Typography></li>
                        <li><Typography variant="body2">Recommending power factor correction equipment</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#12" size="small" color="primary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Time-of-Use Energy</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:1.8.1/2.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Energy consumption separated by tariff periods (peak, off-peak, shoulder).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Enables dynamic pricing to incentivize off-peak consumption and reduce grid strain.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Multi-tariff billing (peak/off-peak rates)</Typography></li>
                        <li><Typography variant="body2">Demand response programs</Typography></li>
                        <li><Typography variant="body2">Load shifting incentives</Typography></li>
                        <li><Typography variant="body2">Revenue optimization during peak hours</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>

              {/* Category 2: Security & Fraud Detection */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'error.main', display: 'flex', alignItems: 'center' }}>
                <Shield sx={{ mr: 1 }} /> Security & Fraud Detection
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#2" size="small" color="error" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Last Tamper Event</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: Various Tamper Codes</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Timestamp and type of the most recent tamper detection (cover open, magnetic interference, etc.).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Tamper events indicate potential meter bypass or fraud attempts, leading to revenue loss.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Tamper types monitored:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Cover open/terminal block removal</Typography></li>
                        <li><Typography variant="body2">Magnetic field interference</Typography></li>
                        <li><Typography variant="body2">Phase reversal or missing phase</Typography></li>
                        <li><Typography variant="body2">Neutral disturbance</Typography></li>
                      </ul>
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <strong>Action required:</strong> Dispatch field technician for on-site inspection within 24-48 hours.
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#8" size="small" color="error" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">TID Counter (Token ID)</Typography>
                          <Typography variant="caption" color="text.secondary">STS Security Parameter</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Sequential counter embedded in each prepaid token to prevent token replay attacks.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Prevents fraudsters from reusing old tokens to steal electricity.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Security mechanism:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Meter rejects tokens with TID lower than last accepted value</Typography></li>
                        <li><Typography variant="body2">Each token must have a higher TID than previous</Typography></li>
                        <li><Typography variant="body2">Detects cloned/duplicate tokens</Typography></li>
                      </ul>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        TID rollback attempts indicate fraud. Flag account for investigation.
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#14" size="small" color="error" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">STS Encryption Keys</Typography>
                          <Typography variant="caption" color="text.secondary">STS Key Management</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Current encryption key version used for token generation and validation.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Ensures only authorized vending systems can generate valid tokens for each meter.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Key management best practices:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Rotate keys periodically (annually recommended)</Typography></li>
                        <li><Typography variant="body2">Store keys in HSM (Hardware Security Module)</Typography></li>
                        <li><Typography variant="body2">Audit key usage and token generation</Typography></li>
                        <li><Typography variant="body2">Never share keys across customer networks</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>

              {/* Category 3: Service & Reliability */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'success.main', display: 'flex', alignItems: 'center' }}>
                <PowerOff sx={{ mr: 1 }} /> Service & Grid Reliability
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#4" size="small" color="success" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Connection Status</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 0-0:96.5.5.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Current relay status (connected/disconnected) and control mode.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Enables remote service connect/disconnect, reducing operational costs and improving customer service.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Remote disconnection for non-payment</Typography></li>
                        <li><Typography variant="body2">Same-day reconnection after payment</Typography></li>
                        <li><Typography variant="body2">Emergency load shedding coordination</Typography></li>
                        <li><Typography variant="body2">Verify successful service restoration</Typography></li>
                      </ul>
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Eliminates costly truck rolls for routine connections/disconnections.
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#5" size="small" color="success" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Power Outage/Restoration Events</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 0-0:96.7.0.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Counter of power failure events and timestamps of last outage/restoration.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Tracks grid reliability metrics (SAIDI/SAIFI) and helps identify problem areas.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Calculate average outage duration per customer</Typography></li>
                        <li><Typography variant="body2">Identify feeders/transformers with frequent failures</Typography></li>
                        <li><Typography variant="body2">Regulatory compliance reporting (SAIDI/SAIFI)</Typography></li>
                        <li><Typography variant="body2">Prioritize infrastructure investment</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>

              {/* Category 4: Real-Time Monitoring */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'info.main', display: 'flex', alignItems: 'center' }}>
                <Speed sx={{ mr: 1 }} /> Real-Time Load & Power Quality
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#6" size="small" color="info" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Instantaneous Power</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:1.7.0.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Current power consumption in real-time (kW).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Detects abnormal load patterns, unauthorized connections, and enables load management.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Real-time load monitoring dashboards</Typography></li>
                        <li><Typography variant="body2">Detect sudden load spikes (possible theft or bypass)</Typography></li>
                        <li><Typography variant="body2">Customer energy usage coaching</Typography></li>
                        <li><Typography variant="body2">Demand response program activation</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#7" size="small" color="info" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Instantaneous Voltage</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:32.7.0.255 (Phase A)</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Current voltage level on Phase A (Volts).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Monitors power quality. Under/over voltage damages customer equipment and indicates grid problems.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Alert thresholds:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2"><strong>Under-voltage:</strong> Below 207V (230V -10%)</Typography></li>
                        <li><Typography variant="body2"><strong>Over-voltage:</strong> Above 253V (230V +10%)</Typography></li>
                        <li><Typography variant="body2">Sustained deviations require corrective action</Typography></li>
                      </ul>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Poor voltage quality leads to customer complaints and equipment damage claims.
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#13" size="small" color="info" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Maximum Demand</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:1.6.0.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Highest average power recorded over a billing period (typically 15-30 minute intervals).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Industrial customers are charged based on peak demand, not just total energy. Critical for capacity planning.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Demand charge billing for commercial/industrial</Typography></li>
                        <li><Typography variant="body2">Transformer sizing and upgrade planning</Typography></li>
                        <li><Typography variant="body2">Identify customers exceeding contracted capacity</Typography></li>
                        <li><Typography variant="body2">Load forecasting and generation planning</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>

              {/* Category 5: Diagnostics & Analytics */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'secondary.main', display: 'flex', alignItems: 'center' }}>
                <ShowChart sx={{ mr: 1 }} /> Diagnostics & Advanced Analytics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#9" size="small" color="secondary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Load Profile Data</Typography>
                          <Typography variant="caption" color="text.secondary">OBIS: 1-0:99.1.0.255</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Time-series energy consumption data (typically 15-30 minute intervals).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Provides granular consumption patterns for analytics, forecasting, and billing dispute resolution.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Use cases:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2">Time-of-use billing verification</Typography></li>
                        <li><Typography variant="body2">Customer usage pattern analysis</Typography></li>
                        <li><Typography variant="body2">Load forecasting and peak prediction</Typography></li>
                        <li><Typography variant="body2">Billing dispute investigation</Typography></li>
                        <li><Typography variant="body2">AI/ML anomaly detection models</Typography></li>
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip label="#10" size="small" color="secondary" sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">Signal Strength (RSSI)</Typography>
                          <Typography variant="caption" color="text.secondary">Communication Module Parameter</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>What it measures:</strong> Cellular/RF signal strength in dBm (Received Signal Strength Indicator).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Why it's critical:</strong> Poor signal causes communication failures, leading to missed billing data and operational blind spots.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Signal quality guidelines:</strong>
                      </Typography>
                      <ul style={{ marginTop: 0 }}>
                        <li><Typography variant="body2"><strong>Excellent:</strong> -50 to -70 dBm</Typography></li>
                        <li><Typography variant="body2"><strong>Good:</strong> -70 to -85 dBm</Typography></li>
                        <li><Typography variant="body2"><strong>Fair:</strong> -85 to -100 dBm (may experience drops)</Typography></li>
                        <li><Typography variant="body2"><strong>Poor:</strong> Below -100 dBm (frequent failures)</Typography></li>
                      </ul>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Consider external antennas or repeaters for meters with persistent poor signal.
                      </Alert>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* Critical Alerts Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Critical Alerts
            </Typography>
            {criticalAlerts.length === 0 ? (
              <Alert severity="success">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  No critical alerts at this time
                </Box>
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Meter</TableCell>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Alert Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criticalAlerts.map((alert, index) =>
                      alert.alerts.map((a, i) => (
                        <TableRow key={`${index}-${i}`}>
                          {i === 0 && (
                            <>
                              <TableCell rowSpan={alert.alerts.length}>
                                {alert.meter}
                              </TableCell>
                              <TableCell rowSpan={alert.alerts.length}>
                                {alert.serialNumber}
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            <Chip label={a.type} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={a.severity}
                              size="small"
                              color={getSeverityColor(a.severity) as any}
                            />
                          </TableCell>
                          <TableCell>{a.message}</TableCell>
                          {i === 0 && (
                            <TableCell rowSpan={alert.alerts.length}>
                              {moment(alert.timestamp).fromNow()}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Quality Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Quality Issues
            </Typography>
            {dataQualityIssues.length === 0 ? (
              <Alert severity="success">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  All meters have acceptable data quality (≥60% completeness)
                </Box>
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Meter Number</TableCell>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Completeness</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Missing Parameters</TableCell>
                      <TableCell>Last Update</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataQualityIssues.map((issue, index) => (
                      <TableRow key={index}>
                        <TableCell>{issue.meterNumber}</TableCell>
                        <TableCell>{issue.serialNumber}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={issue.dataQuality.completeness}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              color={
                                issue.dataQuality.completeness >= 60
                                  ? 'success'
                                  : issue.dataQuality.completeness >= 40
                                  ? 'warning'
                                  : 'error'
                              }
                            />
                            <Typography variant="body2">
                              {issue.dataQuality.completeness}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={issue.dataQuality.validationStatus}
                            size="small"
                            color={
                              issue.dataQuality.validationStatus === 'valid'
                                ? 'success'
                                : issue.dataQuality.validationStatus === 'suspicious'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {issue.dataQuality.missingParameters.join(', ')}
                          </Typography>
                        </TableCell>
                        <TableCell>{moment(issue.timestamp).fromNow()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PriorityMetricsDashboard;
