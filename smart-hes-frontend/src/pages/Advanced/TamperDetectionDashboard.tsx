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
  Alert,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Place as PlaceIcon,
  QueryStats as StatsIcon,
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

interface TamperMeter {
  _id: string;
  meterNumber: string;
  brand: string;
  model: string;
  area: {
    name: string;
    code: string;
  };
  customer?: {
    customerName: string;
    accountNumber: string;
  };
  tamperStatus: {
    coverOpen: boolean;
    magneticTamper: boolean;
    reverseFlow: boolean;
    neutralDisturbance: boolean;
  };
  lastSeen: string;
  status: string;
}

interface TamperEvent {
  _id: string;
  meter: {
    meterNumber: string;
  };
  eventType: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  severity: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TamperDetectionDashboard: React.FC = () => {
  const [tamperMeters, setTamperMeters] = useState<TamperMeter[]>([]);
  const [recentEvents, setRecentEvents] = useState<TamperEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    coverOpen: 0,
    magneticTamper: 0,
    reverseFlow: 0,
    neutralDisturbance: 0,
    clean: 0,
  });
  const [selectedMeter, setSelectedMeter] = useState<TamperMeter | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchTamperData = async () => {
    setLoading(true);
    try {
      // Fetch all meters
      const metersResponse = await axios.get('/meters', {
        params: { limit: 1000 },
      });
      const allMeters = metersResponse.data.data || [];

      // Filter meters with tamper issues
      const tamperedMeters = allMeters.filter((meter: TamperMeter) => {
        const ts = meter.tamperStatus;
        return ts.coverOpen || ts.magneticTamper || ts.reverseFlow || ts.neutralDisturbance;
      });

      setTamperMeters(tamperedMeters);

      // Calculate statistics
      const newStats = {
        total: allMeters.length,
        coverOpen: allMeters.filter((m: any) => m.tamperStatus?.coverOpen).length,
        magneticTamper: allMeters.filter((m: any) => m.tamperStatus?.magneticTamper).length,
        reverseFlow: allMeters.filter((m: any) => m.tamperStatus?.reverseFlow).length,
        neutralDisturbance: allMeters.filter((m: any) => m.tamperStatus?.neutralDisturbance).length,
        clean: allMeters.filter((m: any) => {
          const ts = m.tamperStatus;
          return !ts.coverOpen && !ts.magneticTamper && !ts.reverseFlow && !ts.neutralDisturbance;
        }).length,
      };
      setStats(newStats);

      // Fetch recent tamper events
      const eventsResponse = await axios.get('/events', {
        params: {
          category: 'tamper',
          limit: 20,
        },
      });
      setRecentEvents(eventsResponse.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch tamper data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTamperData();
  }, []);

  const getTamperTypes = (meter: TamperMeter): string[] => {
    const types: string[] = [];
    if (meter.tamperStatus.coverOpen) types.push('Cover Open');
    if (meter.tamperStatus.magneticTamper) types.push('Magnetic Tamper');
    if (meter.tamperStatus.reverseFlow) types.push('Reverse Flow');
    if (meter.tamperStatus.neutralDisturbance) types.push('Neutral Disturbance');
    return types;
  };

  const getTamperCount = (meter: TamperMeter): number => {
    return getTamperTypes(meter).length;
  };

  const getSeverityColor = (count: number) => {
    if (count === 0) return 'success';
    if (count === 1) return 'warning';
    return 'error';
  };

  const pieChartData = [
    { name: 'Clean Meters', value: stats.clean },
    { name: 'Cover Open', value: stats.coverOpen },
    { name: 'Magnetic Tamper', value: stats.magneticTamper },
    { name: 'Reverse Flow', value: stats.reverseFlow },
    { name: 'Neutral Disturbance', value: stats.neutralDisturbance },
  ];

  const barChartData = [
    { name: 'Cover Open', count: stats.coverOpen, color: '#FF8042' },
    { name: 'Magnetic', count: stats.magneticTamper, color: '#FFBB28' },
    { name: 'Reverse Flow', count: stats.reverseFlow, color: '#00C49F' },
    { name: 'Neutral Dist.', count: stats.neutralDisturbance, color: '#0088FE' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Tamper Detection Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time monitoring of meter tamper events
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTamperData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Total Meters
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                </Box>
                <StatsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Clean Meters
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.clean}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {stats.total > 0 ? ((stats.clean / stats.total) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Cover Open
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.coverOpen}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Magnetic Tamper
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.magneticTamper}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Other Tampers
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {stats.reverseFlow + stats.neutralDisturbance}
                  </Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
              </Box>
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
                Tamper Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
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
                Tamper Types Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8">
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Meters with Tamper Issues */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Meters with Active Tamper Issues ({tamperMeters.length})
          </Typography>
          {tamperMeters.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              All meters are operating normally. No tamper issues detected.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'error.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Meter</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Area</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Tamper Types</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Severity</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Last Seen</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tamperMeters.map((meter) => (
                    <TableRow key={meter._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {meter.meterNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {meter.brand} {meter.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PlaceIcon />}
                          label={meter.area.name}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {meter.customer ? (
                          <Stack>
                            <Typography variant="body2">{meter.customer.customerName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {meter.customer.accountNumber}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No customer assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          {getTamperTypes(meter).map((type, idx) => (
                            <Chip key={idx} label={type} size="small" color="error" />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${getTamperCount(meter)} Issue${getTamperCount(meter) > 1 ? 's' : ''}`}
                          color={getSeverityColor(getTamperCount(meter)) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(meter.lastSeen), 'PPpp')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedMeter(meter);
                            setDetailOpen(true);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Tamper Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Tamper Events
          </Typography>
          {recentEvents.length === 0 ? (
            <Alert severity="info">No recent tamper events</Alert>
          ) : (
            <List>
              {recentEvents.map((event, idx) => (
                <React.Fragment key={event._id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {event.meter?.meterNumber || 'N/A'}
                          </Typography>
                          <Chip label={event.eventType} size="small" color="error" />
                          {!event.acknowledged && (
                            <Chip label="Unacknowledged" size="small" color="warning" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          <Typography variant="body2">{event.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(event.timestamp), 'PPpp')}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {idx < recentEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedMeter && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <SecurityIcon color="error" />
                <Typography variant="h6">Tamper Details: {selectedMeter.meterNumber}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Active Tamper Issues:
                    </Typography>
                    <List dense>
                      {selectedMeter.tamperStatus.coverOpen && (
                        <ListItem>
                          <WarningIcon fontSize="small" sx={{ mr: 1 }} />
                          <ListItemText primary="Cover Open Detected" />
                        </ListItem>
                      )}
                      {selectedMeter.tamperStatus.magneticTamper && (
                        <ListItem>
                          <WarningIcon fontSize="small" sx={{ mr: 1 }} />
                          <ListItemText primary="Magnetic Tamper Detected" />
                        </ListItem>
                      )}
                      {selectedMeter.tamperStatus.reverseFlow && (
                        <ListItem>
                          <WarningIcon fontSize="small" sx={{ mr: 1 }} />
                          <ListItemText primary="Reverse Flow Detected" />
                        </ListItem>
                      )}
                      {selectedMeter.tamperStatus.neutralDisturbance && (
                        <ListItem>
                          <WarningIcon fontSize="small" sx={{ mr: 1 }} />
                          <ListItemText primary="Neutral Disturbance Detected" />
                        </ListItem>
                      )}
                    </List>
                  </Alert>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Meter Information
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Meter Number:
                      </Typography>
                      <Typography variant="body2">{selectedMeter.meterNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Brand/Model:
                      </Typography>
                      <Typography variant="body2">
                        {selectedMeter.brand} {selectedMeter.model}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Area:
                      </Typography>
                      <Typography variant="body2">{selectedMeter.area.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip
                        label={selectedMeter.status}
                        size="small"
                        color={selectedMeter.status === 'online' ? 'success' : 'error'}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              <Button variant="contained" color="error">
                Create Alert
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TamperDetectionDashboard;
