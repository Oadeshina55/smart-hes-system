import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ElectricBolt,
  Warning,
  People,
  LocationOn,
  TrendingUp,
  TrendingDown,
  Refresh,
  WifiTethering,
  WifiTetheringOff,
  Speed,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import CountUp from 'react-countup';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import AIInsights from '../../components/AIInsights';
import AIAnomalyDetection from '../../components/AIAnomalyDetection';

interface DashboardStats {
  meters: {
    total: number;
    online: number;
    offline: number;
    active: number;
    warehouse: number;
    onlinePercentage: number;
  };
  alerts: {
    total: number;
    tamper: number;
    anomaly: number;
    revenue: number;
    technical: number;
    communication: number;
  };
  customers: {
    total: number;
  };
  areas: {
    total: number;
  };
  events: {
    recent: number;
  };
}

const COLORS = ['#66BB6A', '#EC407A', '#FFA726', '#26C6DA'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [consumptionData, setConsumptionData] = useState<any[]>([]);
  const [areaStats, setAreaStats] = useState<any[]>([]);
  const [topConsumers, setTopConsumers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [areas, setAreas] = useState<any[]>([]);
  const [interval, setInterval] = useState('hourly');

  const { activeAlerts } = useSocket();
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    fetchDashboardData();
    fetchAreas();
    const intervalId = window.setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => window.clearInterval(intervalId);
  }, [selectedArea, interval]);

  const fetchAreas = async () => {
    try {
      const response = await axios.get('/areas');
      setAreas(response.data.data);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Prepare API calls - exclude area-stats for customer users
      const apiCalls = [
        axios.get('/dashboard/stats', {
          params: selectedArea !== 'all' ? { areaId: selectedArea } : {}
        }),
        axios.get('/dashboard/consumption-chart', {
          params: {
            interval,
            ...(selectedArea !== 'all' ? { areaId: selectedArea } : {})
          }
        }),
        axios.get('/dashboard/top-consumers', {
          params: selectedArea !== 'all' ? { areaId: selectedArea } : {}
        }),
      ];

      // Only fetch area stats for non-customer users
      if (!isCustomer) {
        apiCalls.splice(2, 0, axios.get('/dashboard/area-stats'));
      }

      const responses = await Promise.all(apiCalls);

      setStats(responses[0].data.data);
      setConsumptionData(responses[1].data.data.datasets[0].data.map((value: number, index: number) => ({
        time: responses[1].data.data.labels[index],
        energy: value,
        power: responses[1].data.data.datasets[1]?.data[index] || 0,
      })));

      // Set area stats and top consumers based on whether area-stats was fetched
      if (!isCustomer) {
        setAreaStats(responses[2].data.data);
        setTopConsumers(responses[3].data.data);
      } else {
        setAreaStats([]);
        setTopConsumers(responses[2].data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    trend, 
    subtitle 
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down';
    subtitle?: string;
  }) => (
    <Card 
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 20px 27px 0 rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 25px 35px 0 rgba(0, 0, 0, 0.08)',
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(195deg, ${color} 0%, ${color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px 0 ${color}40`,
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {trend === 'up' ? (
                <TrendingUp sx={{ color: '#66BB6A', fontSize: 20 }} />
              ) : (
                <TrendingDown sx={{ color: '#EC407A', fontSize: 20 }} />
              )}
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767', mb: 1 }}>
          <CountUp end={value} duration={2} separator="," />
        </Typography>
        <Typography variant="body2" sx={{ color: '#67748e', fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#8392AB' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  const pieData = stats ? [
    { name: 'Online', value: stats.meters.online },
    { name: 'Offline', value: stats.meters.offline },
    { name: 'Warehouse', value: stats.meters.warehouse },
  ] : [];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Dashboard Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Hide area filter for customer users - they only see their assigned areas */}
          {!isCustomer && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Area Filter</InputLabel>
              <Select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                label="Area Filter"
              >
                <MenuItem value="all">All Areas</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Interval</InputLabel>
            <Select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              label="Interval"
            >
              <MenuItem value="hourly">Hourly</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} sx={{ color: '#67748e' }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Meters"
            value={stats?.meters.total || 0}
            icon={<ElectricBolt sx={{ color: 'white' }} />}
            color="#49a3f1"
            subtitle={`${stats?.meters.onlinePercentage || 0}% online`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Online Meters"
            value={stats?.meters.online || 0}
            icon={<WifiTethering sx={{ color: 'white' }} />}
            color="#66BB6A"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Alerts"
            value={stats?.alerts.total || 0}
            icon={<Warning sx={{ color: 'white' }} />}
            color="#EC407A"
            subtitle={`${stats?.alerts.tamper || 0} tamper alerts`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats?.customers.total || 0}
            icon={<People sx={{ color: 'white' }} />}
            color="#FFA726"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Energy Consumption Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#344767', fontWeight: 600 }}>
              Energy Consumption Trend
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={consumptionData}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#49a3f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#49a3f1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="time" stroke="#8392AB" />
                <YAxis stroke="#8392AB" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="energy" 
                  stroke="#49a3f1" 
                  fillOpacity={1} 
                  fill="url(#colorEnergy)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Meter Status Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#344767', fontWeight: 600 }}>
              Meter Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Area Statistics and Top Consumers */}
      <Grid container spacing={3}>
        {/* Area Statistics - Hidden for customer users */}
        {!isCustomer && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#344767', fontWeight: 600 }}>
                Area-wise Meter Status
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {areaStats.map((area) => (
                  <Box
                    key={area._id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      bgcolor: '#f8f9fa',
                      '&:hover': {
                        bgcolor: '#e9ecef',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#344767' }}>
                          {area.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#8392AB' }}>
                          Code: {area.code}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={`Total: ${area.meterCount}`}
                          size="small"
                          sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                        />
                        <Chip
                          label={`Online: ${area.onlineCount}`}
                          size="small"
                          sx={{ bgcolor: '#e8f5e9', color: '#4caf50' }}
                        />
                        <Chip
                          label={`Offline: ${area.offlineCount}`}
                          size="small"
                          sx={{ bgcolor: '#ffebee', color: '#f44336' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Top Consumers */}
        <Grid item xs={12} md={isCustomer ? 12 : 6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#344767', fontWeight: 600 }}>
              Top Energy Consumers
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {topConsumers.map((consumer, index) => (
                <Box 
                  key={consumer._id}
                  sx={{ 
                    p: 2, 
                    mb: 1, 
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      bgcolor: '#e9ecef',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e0e0e0',
                        color: index < 3 ? 'white' : '#666',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#344767' }}>
                      {consumer.meterNumber}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ color: '#67748e', fontWeight: 600 }}>
                    {consumer.totalConsumption.toFixed(2)} kWh
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Insights and Anomaly Detection Section - Hidden for customer users */}
      {!isCustomer && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} lg={6}>
            <AIInsights />
          </Grid>
          <Grid item xs={12} lg={6}>
            <AIAnomalyDetection />
          </Grid>
        </Grid>
      )}

      {/* Active Alerts Section */}
      {activeAlerts.length > 0 && (
        <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#344767', fontWeight: 600 }}>
            Recent Active Alerts
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activeAlerts.slice(0, 5).map((alert, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#ffebee',
                  borderLeft: '4px solid #f44336',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  {alert.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {alert.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
