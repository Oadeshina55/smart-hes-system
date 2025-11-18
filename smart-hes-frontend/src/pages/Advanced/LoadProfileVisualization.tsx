import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download as DownloadIcon, Refresh as RefreshIcon, Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface LoadProfile {
  _id: string;
  meter: any;
  profileType: string;
  startTime: string;
  endTime: string;
  status: string;
  totalEntries: number;
  entries: LoadProfileEntry[];
  createdAt: string;
}

interface LoadProfileEntry {
  timestamp: string;
  voltage?: {
    L1?: number;
    L2?: number;
    L3?: number;
    average?: number;
  };
  current?: {
    L1?: number;
    L2?: number;
    L3?: number;
    total?: number;
  };
  power?: {
    active?: number;
    reactive?: number;
    apparent?: number;
  };
  energy?: {
    activeImport?: number;
  };
  powerFactor?: number;
  frequency?: number;
}

export default function LoadProfileVisualization() {
  const [meters, setMeters] = useState<any[]>([]);
  const [selectedMeter, setSelectedMeter] = useState('');
  const [loadProfiles, setLoadProfiles] = useState<LoadProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<LoadProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // Request form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [profileType, setProfileType] = useState('hourly');

  useEffect(() => {
    fetchMeters();
  }, []);

  useEffect(() => {
    if (selectedMeter) {
      fetchLoadProfiles();
    }
  }, [selectedMeter]);

  const fetchMeters = async () => {
    try {
      const res = await axios.get('/meters');
      setMeters(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load meters');
    }
  };

  const fetchLoadProfiles = async () => {
    if (!selectedMeter) return;

    setLoading(true);
    try {
      const res = await axios.get(`/load-profile/meter/${selectedMeter}`);
      setLoadProfiles(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestProfile = async () => {
    if (!selectedMeter || !startDate || !endDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/load-profile', {
        meterId: selectedMeter,
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
        profileType
      });

      toast.success('Load profile requested. Reading from meter...');
      setRequestDialogOpen(false);

      // Refresh list after a delay
      setTimeout(fetchLoadProfiles, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request load profile');
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`/load-profile/${profileId}`);
      setSelectedProfile(res.data.data);
    } catch (error) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!selectedProfile || !selectedProfile.entries.length) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Timestamp', 'Voltage L1', 'Voltage L2', 'Voltage L3', 'Current L1', 'Current L2', 'Current L3', 'Power', 'Energy'];
    const rows = selectedProfile.entries.map(entry => [
      format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      entry.voltage?.L1 || '',
      entry.voltage?.L2 || '',
      entry.voltage?.L3 || '',
      entry.current?.L1 || '',
      entry.current?.L2 || '',
      entry.current?.L3 || '',
      entry.power?.active || '',
      entry.energy?.activeImport || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `load-profile-${selectedProfile._id}.csv`;
    a.click();

    toast.success('Exported to CSV');
  };

  const getChartData = () => {
    if (!selectedProfile || !selectedProfile.entries.length) return [];

    return selectedProfile.entries.map(entry => ({
      time: format(new Date(entry.timestamp), 'MMM dd HH:mm'),
      voltageL1: entry.voltage?.L1,
      voltageL2: entry.voltage?.L2,
      voltageL3: entry.voltage?.L3,
      currentL1: entry.current?.L1,
      currentL2: entry.current?.L2,
      currentL3: entry.current?.L3,
      power: entry.power?.active,
      energy: entry.energy?.activeImport,
      powerFactor: entry.powerFactor,
      frequency: entry.frequency
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Load Profile Visualization
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setRequestDialogOpen(true)}
          disabled={!selectedMeter}
          sx={{
            background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
          }}
        >
          Request New Profile
        </Button>
      </Box>

      {/* Meter Selection */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
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
                  {meter.meterNumber} - {meter.brand} ({meter.model})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchLoadProfiles}
              disabled={!selectedMeter || loading}
              fullWidth
            >
              Refresh Profiles
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Profiles List */}
      {selectedMeter && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Available Load Profiles
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : loadProfiles.length === 0 ? (
            <Alert severity="info">
              No load profiles found. Click "Request New Profile" to read from the meter.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Profile Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Entries</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadProfiles.map((profile) => (
                    <TableRow key={profile._id}>
                      <TableCell>
                        <Chip label={profile.profileType} size="small" />
                      </TableCell>
                      <TableCell>
                        {format(new Date(profile.startTime), 'MMM dd, yyyy HH:mm')} -{' '}
                        {format(new Date(profile.endTime), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{profile.totalEntries}</TableCell>
                      <TableCell>
                        <Chip
                          label={profile.status}
                          size="small"
                          color={
                            profile.status === 'completed'
                              ? 'success'
                              : profile.status === 'failed'
                              ? 'error'
                              : profile.status === 'reading'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{format(new Date(profile.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => viewProfile(profile._id)}
                          disabled={profile.status !== 'completed'}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Profile Details and Charts */}
      {selectedProfile && selectedProfile.entries.length > 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Profile Details
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Entries
                    </Typography>
                    <Typography variant="h4">{selectedProfile.totalEntries}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Profile Type
                    </Typography>
                    <Typography variant="h5">{selectedProfile.profileType}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Start Time
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedProfile.startTime), 'MMM dd, HH:mm')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      End Time
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedProfile.endTime), 'MMM dd, HH:mm')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Voltage Chart */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Voltage Profile
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="voltageL1" stroke="#8884d8" name="L1" />
                  <Line type="monotone" dataKey="voltageL2" stroke="#82ca9d" name="L2" />
                  <Line type="monotone" dataKey="voltageL3" stroke="#ffc658" name="L3" />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Current Chart */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Profile
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="currentL1" stroke="#8884d8" name="L1" />
                  <Line type="monotone" dataKey="currentL2" stroke="#82ca9d" name="L2" />
                  <Line type="monotone" dataKey="currentL3" stroke="#ffc658" name="L3" />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Power Chart */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Power Profile
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="power" stroke="#8884d8" fill="#8884d8" name="Active Power" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            {/* Energy Chart */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Energy Consumption
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="energy" stroke="#82ca9d" fill="#82ca9d" name="Active Import" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </>
      )}

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Load Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Profile Type"
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="instantaneous">Instantaneous</MenuItem>
                <MenuItem value="billing">Billing</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Date & Time"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Date & Time"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRequestProfile} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
