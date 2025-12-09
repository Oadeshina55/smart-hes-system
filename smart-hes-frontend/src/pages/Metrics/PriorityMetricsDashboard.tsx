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

          {/* 14 Priority Metrics Reference */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                14 Priority OBIS Metrics
              </Typography>
              <Grid container spacing={2}>
                {[
                  { num: 1, name: 'Cumulative Active Energy', obis: '1-0:1.8.0.255', purpose: 'Billing' },
                  { num: 2, name: 'Last Tamper Event', obis: 'Various', purpose: 'Security' },
                  { num: 3, name: 'Current Credit Balance', obis: 'Prepaid', purpose: 'Revenue' },
                  { num: 4, name: 'Connection Status', obis: '0-0:96.5.5.255', purpose: 'Service' },
                  { num: 5, name: 'Power Outage/Restoration', obis: '0-0:96.7.0.255', purpose: 'Reliability' },
                  { num: 6, name: 'Instantaneous Power', obis: '1-0:1.7.0.255', purpose: 'Load' },
                  { num: 7, name: 'Instantaneous Voltage', obis: '1-0:32.7.0.255', purpose: 'Quality' },
                  { num: 8, name: 'TID Counter', obis: 'STS', purpose: 'Security' },
                  { num: 9, name: 'Load Profile Data', obis: '1-0:99.1.0.255', purpose: 'Analysis' },
                  { num: 10, name: 'Signal Strength (RSSI)', obis: 'Modem', purpose: 'Connectivity' },
                  { num: 11, name: 'Cumulative Reactive Energy', obis: '1-0:3.8.0.255', purpose: 'Power Factor' },
                  { num: 12, name: 'Time-of-Use Energy', obis: '1-0:1.8.1/2.255', purpose: 'Tariff' },
                  { num: 13, name: 'Maximum Demand', obis: '1-0:1.6.0.255', purpose: 'Capacity' },
                  { num: 14, name: 'STS Keys', obis: 'STS', purpose: 'Token Security' },
                ].map((metric) => (
                  <Grid item xs={12} sm={6} md={3} key={metric.num}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Chip
                        label={`#${metric.num}`}
                        size="small"
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {metric.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        OBIS: {metric.obis}
                      </Typography>
                      <Chip
                        label={metric.purpose}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                ))}
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
