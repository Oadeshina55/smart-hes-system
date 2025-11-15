import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Checkbox,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Search,
  Refresh,
  PlayArrow,
  CheckCircle,
  Cancel,
  WifiTethering,
  WifiTetheringOff,
  Warning,
  ElectricBolt,
  Speed,
  BatteryChargingFull,
  FlashOn,
  AccessTime,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

interface Meter {
  _id: string;
  meterNumber: string;
  area: any;
  customer?: any;
  status: string;
  lastSeen?: string;
  currentReading: {
    totalEnergy: number;
    voltage: number;
    current: number;
    power: number;
    frequency: number;
    powerFactor: number;
    timestamp: string;
  };
  relayStatus: string;
  tamperStatus: {
    coverOpen: boolean;
    magneticTamper: boolean;
    reverseFlow: boolean;
    neutralDisturbance: boolean;
  };
}

interface ObisParameter {
  code: string;
  name: string;
  category: string;
  readable: boolean;
  writable: boolean;
  unit?: string;
  description?: string;
  group?: string;
  accessRight?: string;
}

const RealTimeMonitoring: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeters, setSelectedMeters] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [parametersDialog, setParametersDialog] = useState(false);
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [obisParameters, setObisParameters] = useState<ObisParameter[]>([]);
  const [loadingParameters, setLoadingParameters] = useState(false);

  const { socket } = useSocket();

  useEffect(() => {
    fetchMeters();
    fetchObisParameters();

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMeters, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filterStatus, autoRefresh, refreshInterval]);

  useEffect(() => {
    if (socket) {
      socket.on('meter-reading-update', (data) => {
        updateMeterReading(data);
      });
      
      socket.on('meter-status-change', (data) => {
        updateMeterStatus(data);
      });
    }
    
    return () => {
      if (socket) {
        socket.off('meter-reading-update');
        socket.off('meter-status-change');
      }
    };
  }, [socket]);

  const fetchMeters = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await axios.get('/meters', { params });
      setMeters(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch meters');
    } finally {
      setLoading(false);
    }
  };

  const fetchObisParameters = async () => {
    try {
      setLoadingParameters(true);
      const response = await axios.get('/obis/functions');

      if (response.data.success) {
        // Transform OBIS functions to ObisParameter format
        const parameters: ObisParameter[] = response.data.data.map((func: any) => ({
          code: func.code,
          name: func.name || func.code,
          category: categorizeObisCode(func.code, func.group),
          readable: true,
          writable: func.accessRight === 'RW' || func.accessRight === 'W',
          unit: func.unit,
          description: func.description,
          group: func.group,
          accessRight: func.accessRight
        }));

        setObisParameters(parameters);
      }
    } catch (error) {
      console.error('Failed to fetch OBIS parameters:', error);
      toast.error('Failed to load OBIS parameters');
    } finally {
      setLoadingParameters(false);
    }
  };

  // Helper function to categorize OBIS codes
  const categorizeObisCode = (code: string, group?: string): string => {
    if (group) return group;

    // Parse OBIS code and categorize based on C field
    const match = code.match(/\d+-\d+:(\d+)\.\d+\.\d+\.\d+/);
    if (!match) return 'General';

    const cField = parseInt(match[1]);

    if (cField >= 1 && cField <= 9) return 'Energy';
    if (cField >= 11 && cField <= 29) return 'Demand';
    if (cField >= 31 && cField <= 39) return 'Current';
    if (cField >= 41 && cField <= 49) return 'Voltage';
    if (cField >= 51 && cField <= 59) return 'Voltage';
    if (cField >= 61 && cField <= 69) return 'Power';
    if (cField >= 71 && cField <= 79) return 'Current';
    if (cField >= 81 && cField <= 89) return 'Angle';
    if (cField >= 91 && cField <= 99) return 'Frequency';
    if (cField === 0 || cField === 96) return 'System';
    if (cField === 13) return 'Power Factor';
    if (cField === 14) return 'Frequency';

    return 'General';
  };

  const updateMeterReading = (data: any) => {
    setMeters(prevMeters => 
      prevMeters.map(meter => 
        meter._id === data.meterId 
          ? { ...meter, currentReading: data.reading }
          : meter
      )
    );
  };

  const updateMeterStatus = (data: any) => {
    setMeters(prevMeters => 
      prevMeters.map(meter => 
        meter._id === data.meterId 
          ? { ...meter, status: data.status, lastSeen: data.lastSeen }
          : meter
      )
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allMeterIds = filteredMeters.map(m => m._id);
      setSelectedMeters(new Set(allMeterIds));
    } else {
      setSelectedMeters(new Set());
    }
  };

  const handleSelectMeter = (meterId: string) => {
    const newSelection = new Set(selectedMeters);
    if (newSelection.has(meterId)) {
      newSelection.delete(meterId);
    } else {
      newSelection.add(meterId);
    }
    setSelectedMeters(newSelection);
  };

  const handleReadParameters = async () => {
    if (selectedMeters.size === 0) {
      toast.error('Please select at least one meter');
      return;
    }
    
    if (selectedParameters.size === 0) {
      toast.error('Please select at least one parameter');
      return;
    }
    
    try {
      const meterIds = Array.from(selectedMeters);
      const parameters = Array.from(selectedParameters);
      
      const response = await axios.post('/meters/read-parameters', {
        meterIds,
        parameters,
      });
      
      toast.success(`Reading ${parameters.length} parameters from ${meterIds.length} meters`);
      
      // Update meter readings with response
      if (response.data.results) {
        // Process results
      }
    } catch (error) {
      toast.error('Failed to read parameters');
    }
  };

  const handleExecuteCommand = async () => {
    if (selectedMeters.size === 0) {
      toast.error('Please select at least one meter');
      return;
    }

    const writableParams = Array.from(selectedParameters).filter(code => {
      const param = obisParameters.find(p => p.code === code);
      return param?.writable;
    });

    if (writableParams.length === 0) {
      toast.error('Please select at least one writable parameter');
      return;
    }

    // Open dialog to get values for writable parameters
    // Implementation would include a form to input values
    toast('Execute command dialog would open here');
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' ? (
      <WifiTethering sx={{ color: '#66BB6A' }} />
    ) : (
      <WifiTetheringOff sx={{ color: '#EC407A' }} />
    );
  };

  const getTimeSinceLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const last = new Date(lastSeen);
    const diff = Math.floor((now.getTime() - last.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getTamperBadge = (tamperStatus: any) => {
    const tamperCount = Object.values(tamperStatus).filter(v => v === true).length;
    if (tamperCount > 0) {
      return (
        <Badge badgeContent={tamperCount} color="error">
          <Warning />
        </Badge>
      );
    }
    return <CheckCircle color="success" />;
  };

  const filteredMeters = meters.filter(meter =>
    meter.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meter.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const parameterCategories = Array.from(new Set(obisParameters.map(p => p.category)));

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Real-Time Monitoring
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<AccessTime />}
            label={autoRefresh ? `Auto-refresh: ${refreshInterval}s` : 'Manual refresh'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          />
          <IconButton onClick={fetchMeters} sx={{ color: '#67748e' }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
                  {meters.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#67748e' }}>
                  Total Meters
                </Typography>
              </Box>
              <ElectricBolt sx={{ fontSize: 40, color: '#49a3f1' }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
                  {meters.filter(m => m.status === 'online').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#67748e' }}>
                  Online
                </Typography>
              </Box>
              <WifiTethering sx={{ fontSize: 40, color: '#66BB6A' }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
                  {meters.filter(m => m.status === 'offline').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#67748e' }}>
                  Offline
                </Typography>
              </Box>
              <WifiTetheringOff sx={{ fontSize: 40, color: '#EC407A' }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
                  {selectedMeters.size}
                </Typography>
                <Typography variant="body2" sx={{ color: '#67748e' }}>
                  Selected
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, color: '#FFA726' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search meter number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="warehouse">Warehouse</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setParametersDialog(true)}
              disabled={selectedMeters.size === 0}
            >
              Select Parameters
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={handleReadParameters}
              disabled={selectedMeters.size === 0 || selectedParameters.size === 0}
            >
              Read
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              onClick={handleExecuteCommand}
              disabled={selectedMeters.size === 0 || selectedParameters.size === 0}
            >
              Execute
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Meters Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  checked={selectedMeters.size === filteredMeters.length && filteredMeters.length > 0}
                  onChange={handleSelectAll}
                  sx={{ color: 'white' }}
                />
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Meter Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Area</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Energy (kWh)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Voltage (V)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Current (A)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Power (kW)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Last Seen</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tamper</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMeters.map((meter) => (
              <TableRow 
                key={meter._id} 
                hover
                selected={selectedMeters.has(meter._id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedMeters.has(meter._id)}
                    onChange={() => handleSelectMeter(meter._id)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={meter.status}>
                    {getStatusIcon(meter.status)}
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{meter.meterNumber}</TableCell>
                <TableCell>{meter.customer?.customerName || 'Unassigned'}</TableCell>
                <TableCell>{meter.area?.name || 'N/A'}</TableCell>
                <TableCell>{meter.currentReading.totalEnergy.toFixed(2)}</TableCell>
                <TableCell>{meter.currentReading.voltage.toFixed(1)}</TableCell>
                <TableCell>{meter.currentReading.current.toFixed(2)}</TableCell>
                <TableCell>{meter.currentReading.power.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={getTimeSinceLastSeen(meter.lastSeen)} 
                    size="small"
                    color={meter.status === 'online' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  {getTamperBadge(meter.tamperStatus)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Parameters Selection Dialog */}
      <Dialog
        open={parametersDialog}
        onClose={() => setParametersDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Parameters to Read/Write
          {loadingParameters && <LinearProgress sx={{ mt: 1 }} />}
        </DialogTitle>
        <DialogContent>
          {parameterCategories.map((category) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#344767' }}>
                {category}
              </Typography>
              <Grid container spacing={1}>
                {obisParameters.filter(p => p.category === category).map((param) => (
                  <Grid item xs={12} md={6} key={param.code}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: selectedParameters.has(param.code) ? '#e3f2fd' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                        }
                      }}
                      onClick={() => {
                        const newSelection = new Set(selectedParameters);
                        if (newSelection.has(param.code)) {
                          newSelection.delete(param.code);
                        } else {
                          newSelection.add(param.code);
                        }
                        setSelectedParameters(newSelection);
                      }}
                    >
                      <Checkbox
                        checked={selectedParameters.has(param.code)}
                        size="small"
                      />
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {param.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#8392AB' }}>
                          {param.code} {param.unit && `(${param.unit})`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {param.readable && (
                            <Chip label="R" size="small" color="success" sx={{ height: 20 }} />
                          )}
                          {param.writable && (
                            <Chip label="W" size="small" color="warning" sx={{ height: 20 }} />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedParameters(new Set())}>
            Clear All
          </Button>
          <Button onClick={() => setParametersDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setParametersDialog(false)}
            variant="contained"
            disabled={selectedParameters.size === 0}
          >
            Confirm ({selectedParameters.size} selected)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealTimeMonitoring;
