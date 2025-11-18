import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';
import { format, subDays } from 'date-fns';

interface PowerQualityMeasurement {
  _id: string;
  meter: any;
  timestamp: string;
  voltage: {
    L1?: number;
    L2?: number;
    L3?: number;
    average?: number;
    unbalance?: number;
    thd?: number;
  };
  current: {
    L1?: number;
    L2?: number;
    L3?: number;
    unbalance?: number;
    thd?: number;
  };
  powerFactor: {
    total?: number;
  };
  frequency: {
    value: number;
    deviation: number;
  };
  qualityScore: number;
  events: PowerQualityEvent[];
  compliance: {
    standard: string;
    compliant: boolean;
    violations: string[];
  };
}

interface PowerQualityEvent {
  eventType: string;
  severity: string;
  phase?: string;
  startTime: string;
  value: number;
  threshold: number;
  unit: string;
  description?: string;
}

export default function PowerQualityMonitoring() {
  const [meters, setMeters] = useState<any[]>([]);
  const [selectedMeter, setSelectedMeter] = useState('');
  const [measurements, setMeasurements] = useState<PowerQualityMeasurement[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [realTimeData, setRealTimeData] = useState<PowerQualityMeasurement | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  useEffect(() => {
    fetchMeters();
  }, []);

  useEffect(() => {
    if (selectedMeter) {
      fetchMeasurements();
      fetchStatistics();
    }
  }, [selectedMeter, dateRange]);

  const fetchMeters = async () => {
    try {
      const res = await axios.get('/meters');
      setMeters(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load meters');
    }
  };

  const fetchMeasurements = async () => {
    if (!selectedMeter) return;

    setLoading(true);
    try {
      const res = await axios.get(`/power-quality/meter/${selectedMeter}`, {
        params: {
          startDate: new Date(dateRange.start).toISOString(),
          endDate: new Date(dateRange.end).toISOString(),
          limit: 100
        }
      });
      setMeasurements(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load power quality data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!selectedMeter) return;

    try {
      const res = await axios.get(`/power-quality/meter/${selectedMeter}/statistics`, {
        params: {
          startDate: new Date(dateRange.start).toISOString(),
          endDate: new Date(dateRange.end).toISOString()
        }
      });
      setStatistics(res.data.data);
    } catch (error) {
      console.error('Failed to load statistics');
    }
  };

  const fetchRealTimeData = async () => {
    if (!selectedMeter) {
      toast.error('Please select a meter');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`/power-quality/meter/${selectedMeter}/realtime`);
      setRealTimeData(res.data.data);
      toast.success('Real-time data updated');

      // Also refresh the measurements list
      fetchMeasurements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get real-time data');
    } finally {
      setLoading(false);
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getQualityTrendData = () => {
    return measurements.slice(0, 24).reverse().map(m => ({
      time: format(new Date(m.timestamp), 'MMM dd HH:mm'),
      score: m.qualityScore,
      voltage: m.voltage.average,
      frequency: m.frequency.value
    }));
  };

  const getEventsSummary = () => {
    if (!statistics?.events) return [];

    const byType = statistics.events.byType || {};
    return Object.entries(byType).map(([type, count]) => ({
      type,
      count
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Power Quality Monitoring
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchRealTimeData}
          disabled={!selectedMeter || loading}
          sx={{
            background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
          }}
        >
          Read Real-Time
        </Button>
      </Box>

      {/* Meter Selection and Date Range */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Select Meter"
              value={selectedMeter}
              onChange={(e) => setSelectedMeter(e.target.value)}
            >
              <MenuItem value="">Select a meter</MenuItem>
              {meters.map((meter) => (
                <MenuItem key={meter._id} value={meter._id}>
                  {meter.meterNumber} - {meter.brand}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="datetime-local"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Real-Time Data */}
      {realTimeData && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Current Power Quality
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Quality Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h3">{realTimeData.qualityScore}</Typography>
                    <Chip
                      label={realTimeData.qualityScore >= 90 ? 'Excellent' : realTimeData.qualityScore >= 70 ? 'Good' : 'Poor'}
                      color={getQualityScoreColor(realTimeData.qualityScore)}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Average Voltage
                  </Typography>
                  <Typography variant="h4">{realTimeData.voltage.average?.toFixed(2)} V</Typography>
                  {realTimeData.voltage.thd && (
                    <Typography variant="caption" color="text.secondary">
                      THD: {realTimeData.voltage.thd.toFixed(2)}%
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Frequency
                  </Typography>
                  <Typography variant="h4">{realTimeData.frequency.value.toFixed(3)} Hz</Typography>
                  <Typography variant="caption" color={Math.abs(realTimeData.frequency.deviation) > 0.5 ? 'error' : 'text.secondary'}>
                    Deviation: {realTimeData.frequency.deviation > 0 ? '+' : ''}{realTimeData.frequency.deviation.toFixed(3)} Hz
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Power Factor
                  </Typography>
                  <Typography variant="h4">{realTimeData.powerFactor.total?.toFixed(3)}</Typography>
                  <Typography variant="caption" color={realTimeData.powerFactor.total && realTimeData.powerFactor.total < 0.9 ? 'warning' : 'text.secondary'}>
                    {realTimeData.powerFactor.total && realTimeData.powerFactor.total < 0.9 ? 'Low PF' : 'Normal'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {realTimeData.events.length > 0 && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Active Power Quality Events:
              </Typography>
              {realTimeData.events.map((event, idx) => (
                <Chip
                  key={idx}
                  label={`${event.eventType}: ${event.description}`}
                  size="small"
                  color={event.severity === 'critical' ? 'error' : event.severity === 'high' ? 'warning' : 'default'}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Alert>
          )}
        </Paper>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Quality Score
                </Typography>
                <Typography variant="h3">{statistics.averageQualityScore?.toFixed(0)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {statistics.totalMeasurements} measurements
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Compliance Rate
                </Typography>
                <Typography variant="h3">
                  {statistics.compliance?.compliantPercentage?.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {statistics.compliance?.standard || 'IEEE 519'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Events
                </Typography>
                <Typography variant="h3">{statistics.events?.total || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Power quality issues
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg Power Factor
                </Typography>
                <Typography variant="h3">{statistics.powerFactor?.average?.toFixed(3)}</Typography>
                <Typography variant="caption" color={statistics.powerFactor?.average < 0.9 ? 'warning' : 'text.secondary'}>
                  {statistics.powerFactor?.average < 0.9 ? 'Below threshold' : 'Normal'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {measurements.length > 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quality Score Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getQualityTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#8884d8" name="Quality Score" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Power Quality Events
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getEventsSummary()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Event Count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Measurements
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Quality Score</TableCell>
                    <TableCell>Voltage (V)</TableCell>
                    <TableCell>Frequency (Hz)</TableCell>
                    <TableCell>Power Factor</TableCell>
                    <TableCell>Events</TableCell>
                    <TableCell>Compliant</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {measurements.slice(0, 10).map((measurement) => (
                    <TableRow key={measurement._id}>
                      <TableCell>{format(new Date(measurement.timestamp), 'MMM dd, HH:mm:ss')}</TableCell>
                      <TableCell>
                        <Chip
                          label={measurement.qualityScore}
                          size="small"
                          color={getQualityScoreColor(measurement.qualityScore)}
                        />
                      </TableCell>
                      <TableCell>{measurement.voltage.average?.toFixed(2)}</TableCell>
                      <TableCell>{measurement.frequency.value.toFixed(3)}</TableCell>
                      <TableCell>{measurement.powerFactor.total?.toFixed(3)}</TableCell>
                      <TableCell>{measurement.events.length}</TableCell>
                      <TableCell>
                        <Chip
                          label={measurement.compliance.compliant ? 'Yes' : 'No'}
                          size="small"
                          color={measurement.compliance.compliant ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!selectedMeter && (
        <Alert severity="info">
          Please select a meter to view power quality data.
        </Alert>
      )}
    </Box>
  );
}
