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
  Chip,
  Button,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  VpnKey as KeyIcon,
  CloudSync as SyncIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface SecurityEvent {
  _id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  source: string;
  ipAddress?: string;
  user?: {
    username: string;
    role: string;
  };
  metadata?: any;
}

interface SystemLog {
  _id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  service: string;
  metadata?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SecurityAudit: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchSecurityEvents = async () => {
    try {
      // Mock security events - in production, this would come from a real audit log
      const mockEvents: SecurityEvent[] = [
        {
          _id: '1',
          eventType: 'LOGIN_SUCCESS',
          severity: 'low',
          description: 'User logged in successfully',
          timestamp: new Date().toISOString(),
          source: 'Authentication Service',
          ipAddress: '192.168.1.100',
          user: { username: 'admin', role: 'admin' },
        },
        {
          _id: '2',
          eventType: 'LOGIN_FAILED',
          severity: 'medium',
          description: 'Failed login attempt detected',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          source: 'Authentication Service',
          ipAddress: '192.168.1.101',
        },
        {
          _id: '3',
          eventType: 'PERMISSION_DENIED',
          severity: 'medium',
          description: 'Unauthorized access attempt',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          source: 'Authorization Service',
          ipAddress: '192.168.1.102',
          user: { username: 'operator1', role: 'operator' },
        },
      ];
      setSecurityEvents(mockEvents);
    } catch (error: any) {
      toast.error('Failed to fetch security events');
    }
  };

  const fetchSystemLogs = async () => {
    try {
      // Mock system logs - in production, this would come from Winston/logging service
      const mockLogs: SystemLog[] = [
        {
          _id: '1',
          level: 'info',
          message: 'Server started successfully on port 5000',
          timestamp: new Date().toISOString(),
          service: 'HTTP Server',
        },
        {
          _id: '2',
          level: 'info',
          message: 'Connected to MongoDB successfully',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          service: 'Database',
        },
        {
          _id: '3',
          level: 'warning',
          message: 'High memory usage detected: 85%',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          service: 'System Monitor',
        },
        {
          _id: '4',
          level: 'error',
          message: 'Failed to connect to meter MTR001: Connection timeout',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          service: 'Meter Communication',
        },
        {
          _id: '5',
          level: 'info',
          message: 'Anomaly detection completed: 0 anomalies found',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          service: 'AI Service',
        },
      ];
      setSystemLogs(mockLogs);
    } catch (error: any) {
      toast.error('Failed to fetch system logs');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSecurityEvents(), fetchSystemLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    const colors: any = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
      info: 'info',
      warning: 'warning',
      error: 'error',
      debug: 'default',
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
      case 'info':
        return <InfoIcon />;
      case 'medium':
      case 'warning':
        return <WarningIcon />;
      case 'high':
      case 'error':
      case 'critical':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const securityStats = {
    totalEvents: securityEvents.length,
    critical: securityEvents.filter(e => e.severity === 'critical').length,
    high: securityEvents.filter(e => e.severity === 'high').length,
    medium: securityEvents.filter(e => e.severity === 'medium').length,
    low: securityEvents.filter(e => e.severity === 'low').length,
  };

  const logStats = {
    total: systemLogs.length,
    errors: systemLogs.filter(l => l.level === 'error').length,
    warnings: systemLogs.filter(l => l.level === 'warning').length,
    info: systemLogs.filter(l => l.level === 'info').length,
  };

  const eventDistribution = [
    { name: 'Critical', value: securityStats.critical },
    { name: 'High', value: securityStats.high },
    { name: 'Medium', value: securityStats.medium },
    { name: 'Low', value: securityStats.low },
  ];

  const logDistribution = [
    { name: 'Error', value: logStats.errors },
    { name: 'Warning', value: logStats.warnings },
    { name: 'Info', value: logStats.info },
  ];

  const securityScore = Math.max(0, 100 - (
    securityStats.critical * 20 +
    securityStats.high * 10 +
    securityStats.medium * 5 +
    securityStats.low * 1
  ));

  const getSecurityScoreColor = () => {
    if (securityScore >= 90) return 'success';
    if (securityScore >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ShieldIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Security Audit & System Logs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor security events and system activity in real-time
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            startIcon={<SyncIcon />}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Security Score Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${securityScore >= 90 ? '#43e97b 0%, #38f9d7' : securityScore >= 70 ? '#fa709a 0%, #fee140' : '#f093fb 0%, #f5576c'} 100%)` }}>
        <CardContent>
          <Grid container alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                System Security Score
              </Typography>
              <Typography variant="h2" sx={{ color: 'white', fontWeight: 700 }}>
                {securityScore}/100
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
                {securityScore >= 90 ? 'Excellent security posture' : securityScore >= 70 ? 'Good security, minor issues detected' : 'Security attention required'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'right' }}>
                <ShieldIcon sx={{ fontSize: 100, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Security Events
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {securityStats.totalEvents}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Critical/High
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {securityStats.critical + securityStats.high}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <InfoIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    System Logs
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {logStats.total}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Errors/Warnings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {logStats.errors + logStats.warnings}
                  </Typography>
                </Box>
              </Stack>
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
                Security Event Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventDistribution.map((entry, index) => (
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
                System Log Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={logDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {logDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Events and Logs */}
      <Card>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Security Events" />
          <Tab label="System Logs" />
          <Tab label="Security Recommendations" />
        </Tabs>
        <Divider />
        <CardContent>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Security Events
              </Typography>
              {securityEvents.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  No security events detected. System is secure.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Timestamp</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Event Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Severity</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>Source</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700 }}>IP Address</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {securityEvents.map((event) => (
                        <TableRow key={event._id} hover>
                          <TableCell>{format(new Date(event.timestamp), 'PPpp')}</TableCell>
                          <TableCell>{event.eventType}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getSeverityIcon(event.severity)}
                              label={event.severity.toUpperCase()}
                              color={getSeverityColor(event.severity) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{event.description}</TableCell>
                          <TableCell>{event.source}</TableCell>
                          <TableCell>{event.ipAddress || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Real-Time System Logs
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
                <List>
                  {systemLogs.length === 0 ? (
                    <ListItem>
                      <ListItemText secondary="No logs available" />
                    </ListItem>
                  ) : (
                    systemLogs.map((log, idx) => (
                      <React.Fragment key={log._id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getSeverityIcon(log.level)}
                                <Typography variant="body2">{log.message}</Typography>
                              </Box>
                            }
                            secondary={
                              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Chip
                                  label={log.level.toUpperCase()}
                                  color={getSeverityColor(log.level) as any}
                                  size="small"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {log.service}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(new Date(log.timestamp), 'PPpp')}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                        {idx < systemLogs.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Paper>
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Security Recommendations
              </Typography>
              <Stack spacing={2}>
                <Alert severity="info" icon={<InfoIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Enable Two-Factor Authentication (2FA)
                  </Typography>
                  <Typography variant="caption">
                    Strengthen account security by enabling 2FA for all admin accounts
                  </Typography>
                </Alert>
                <Alert severity="info" icon={<KeyIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Rotate API Keys Regularly
                  </Typography>
                  <Typography variant="caption">
                    Change API keys and access tokens at least every 90 days
                  </Typography>
                </Alert>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    HTTPS Enabled
                  </Typography>
                  <Typography variant="caption">
                    All communications are encrypted using TLS 1.3
                  </Typography>
                </Alert>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    MongoDB Authentication Enabled
                  </Typography>
                  <Typography variant="caption">
                    Database access is protected with strong authentication
                  </Typography>
                </Alert>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Review Failed Login Attempts
                  </Typography>
                  <Typography variant="caption">
                    Monitor and investigate repeated failed login attempts
                  </Typography>
                </Alert>
                <Alert severity="info" icon={<LockIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Implement Rate Limiting
                  </Typography>
                  <Typography variant="caption">
                    Protect against brute force attacks with request rate limiting
                  </Typography>
                </Alert>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecurityAudit;
