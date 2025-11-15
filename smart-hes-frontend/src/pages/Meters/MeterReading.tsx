import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  TextField,
  Paper,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  Refresh,
  Download,
  AccessTime,
  BatteryChargingFull,
  Speed,
  Info,
  Event,
  ToggleOn,
  AttachMoney,
  FlashOn,
  Payment,
  PowerSettingsNew,
  Schedule,
  CloudUpload,
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';
import { CSVLink } from 'react-csv';

interface MeterInfo {
  _id: string;
  meterNumber: string;
  lastVending?: string;
  meterType: string;
  brand: string;
  model: string;
  concentratorId?: string;
  ipAddress?: string;
  port?: number;
  ti?: string;
  customer?: any;
  area?: any;
  supplierName?: string;
  status?: string;
  communicationStatus?: string;
}

interface ReadingItem {
  name: string;
  code: string;
  value: any;
  unit?: string;
  classId?: number;
  attributeId?: number;
}

const readingCategories = [
  { label: 'Information', icon: <Info />, value: 'information' },
  { label: 'Clock', icon: <AccessTime />, value: 'clock' },
  { label: 'Energy', icon: <BatteryChargingFull />, value: 'energy' },
  { label: 'Demand', icon: <Speed />, value: 'demand' },
  { label: 'Status', icon: <Info />, value: 'status' },
  { label: 'Event Counter', icon: <Event />, value: 'eventCounter' },
  { label: 'Relay', icon: <ToggleOn />, value: 'relay' },
  { label: 'Tariff Data', icon: <AttachMoney />, value: 'tariffData' },
  { label: 'Instantaneous', icon: <FlashOn />, value: 'instantaneous' },
  { label: 'Prepayment', icon: <Payment />, value: 'prepayment' },
];

export default function MeterReading() {
  const [searchValue, setSearchValue] = useState('');
  const [meterInfo, setMeterInfo] = useState<MeterInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('information');
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [dlmsReading, setDlmsReading] = useState(false);
  const [relayDialog, setRelayDialog] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      if (meterInfo && (data.meterNumber === meterInfo.meterNumber || data.meterId === meterInfo._id)) {
        toast.success('Meter reading updated in real-time');
        fetchMeterData(searchValue);
      }
    };

    socket.on('meter-reading-update', handler);
    socket.on('dlms-reading-complete', handler);
    return () => {
      socket.off('meter-reading-update', handler);
      socket.off('dlms-reading-complete', handler);
    };
  }, [socket, meterInfo, searchValue]);

  const fetchMeterData = async (meterQuery: string) => {
    if (!meterQuery) return;

    setLoading(true);
    try {
      // Fetch meter details
      const meterResp = await axios.get(`/api/meters?search=${encodeURIComponent(meterQuery)}`);
      const meter = meterResp.data.data?.[0];

      if (!meter) {
        toast.error('Meter not found');
        setLoading(false);
        return;
      }

      // Set meter info
      setMeterInfo({
        _id: meter._id,
        meterNumber: meter.meterNumber || '',
        lastVending: meter.lastVending || 'N/A',
        meterType: meter.meterType || 'Unknown',
        brand: meter.brand || 'Unknown',
        model: meter.model || 'Unknown',
        concentratorId: meter.concentratorId || 'N/A',
        ipAddress: meter.ipAddress,
        port: meter.port,
        ti: meter.tariffIndex || '1',
        customer: meter.customer,
        area: meter.area,
        supplierName: meter.supplierName || 'NH Capital',
        status: meter.status,
        communicationStatus: meter.communicationStatus,
      });

      // Load readings based on category
      await loadCategoryReadings(meter, selectedCategory);

      toast.success('Meter data loaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch meter data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryReadings = async (meter: any, category: string) => {
    try {
      // Build reading items based on category
      const readingItems: ReadingItem[] = [];

      switch (category) {
        case 'information':
          readingItems.push(
            { name: 'Meter Serial Number', code: '0-0:96.1.0.255', value: meter.meterNumber, classId: 1, attributeId: 2 },
            { name: 'Firmware Version', code: '1-0:0.2.0.255', value: meter.firmware || 'N/A', classId: 1, attributeId: 2 },
            { name: 'Meter Brand', code: 'BRAND', value: meter.brand || 'Unknown' },
            { name: 'Meter Model', code: 'MODEL', value: meter.model || 'Unknown' },
            { name: 'Meter Type', code: 'TYPE', value: meter.meterType || 'Unknown' },
            { name: 'Manufacturing Date', code: '0-0:96.1.1.255', value: meter.manufacturingDate || 'N/A', classId: 1, attributeId: 2 }
          );
          break;

        case 'clock':
          readingItems.push(
            { name: 'Current Date & Time', code: '0-0:1.0.0.255', value: new Date().toLocaleString(), classId: 8, attributeId: 2 },
            { name: 'Time Zone', code: '0-0:1.0.0.128', value: 'UTC+1', classId: 1, attributeId: 2 },
            { name: 'Last Sync Time', code: 'LAST_SYNC', value: meter.lastCommunication || 'N/A' }
          );
          break;

        case 'energy':
          readingItems.push(
            { name: 'Total Active Energy Import', code: '1-0:1.8.0.255', value: meter.currentReading?.totalEnergy || 0, unit: 'kWh', classId: 3, attributeId: 2 },
            { name: 'Total Active Energy Export', code: '1-0:2.8.0.255', value: meter.currentReading?.exportedEnergy || 0, unit: 'kWh', classId: 3, attributeId: 2 },
            { name: 'Active Energy TOU 1', code: '1-0:1.8.1.255', value: meter.currentReading?.tou1 || 0, unit: 'kWh', classId: 3, attributeId: 2 },
            { name: 'Active Energy TOU 2', code: '1-0:1.8.2.255', value: meter.currentReading?.tou2 || 0, unit: 'kWh', classId: 3, attributeId: 2 },
            { name: 'Active Energy TOU 3', code: '1-0:1.8.3.255', value: meter.currentReading?.tou3 || 0, unit: 'kWh', classId: 3, attributeId: 2 },
            { name: 'Active Energy TOU 4', code: '1-0:1.8.4.255', value: meter.currentReading?.tou4 || 0, unit: 'kWh', classId: 3, attributeId: 2 },
            { name: 'Total Reactive Energy Import', code: '1-0:3.8.0.255', value: meter.currentReading?.reactiveEnergy || 0, unit: 'kVArh', classId: 3, attributeId: 2 },
            { name: 'Total Apparent Energy', code: '1-0:9.8.0.255', value: meter.currentReading?.apparentEnergy || 0, unit: 'kVAh', classId: 3, attributeId: 2 }
          );
          break;

        case 'instantaneous':
          readingItems.push(
            { name: 'Voltage L1', code: '1-0:32.7.0.255', value: meter.currentReading?.voltage || 0, unit: 'V', classId: 3, attributeId: 2 },
            { name: 'Voltage L2', code: '1-0:52.7.0.255', value: meter.currentReading?.voltageL2 || 0, unit: 'V', classId: 3, attributeId: 2 },
            { name: 'Voltage L3', code: '1-0:72.7.0.255', value: meter.currentReading?.voltageL3 || 0, unit: 'V', classId: 3, attributeId: 2 },
            { name: 'Current L1', code: '1-0:31.7.0.255', value: meter.currentReading?.current || 0, unit: 'A', classId: 3, attributeId: 2 },
            { name: 'Current L2', code: '1-0:51.7.0.255', value: meter.currentReading?.currentL2 || 0, unit: 'A', classId: 3, attributeId: 2 },
            { name: 'Current L3', code: '1-0:71.7.0.255', value: meter.currentReading?.currentL3 || 0, unit: 'A', classId: 3, attributeId: 2 },
            { name: 'Active Power Total', code: '1-0:1.7.0.255', value: meter.currentReading?.power || 0, unit: 'kW', classId: 3, attributeId: 2 },
            { name: 'Power Factor Total', code: '1-0:13.7.0.255', value: meter.currentReading?.powerFactor || 0, classId: 3, attributeId: 2 },
            { name: 'Frequency', code: '1-0:14.7.0.255', value: meter.currentReading?.frequency || 50, unit: 'Hz', classId: 3, attributeId: 2 }
          );
          break;

        case 'demand':
          readingItems.push(
            { name: 'Maximum Demand', code: '1-0:1.6.0.255', value: meter.currentReading?.maxDemand || 0, unit: 'kW', classId: 3, attributeId: 2 },
            { name: 'Maximum Demand Time', code: '1-0:1.6.0.128', value: meter.currentReading?.maxDemandTime || 'N/A', classId: 1, attributeId: 2 },
            { name: 'Current Demand', code: '1-0:1.4.0.255', value: meter.currentReading?.power || 0, unit: 'kW', classId: 3, attributeId: 2 }
          );
          break;

        case 'relay':
          readingItems.push(
            { name: 'Relay Status', code: '0-0:96.3.10.255', value: meter.relayStatus || 'unknown', classId: 70, attributeId: 2 },
            { name: 'Relay Control Mode', code: '0-0:96.3.10.128', value: 'Remote', classId: 1, attributeId: 2 }
          );
          break;

        default:
          readingItems.push({ name: 'No data available', code: 'N/A', value: '-' });
      }

      setReadings(readingItems);
    } catch (error) {
      console.error('Error loading category readings:', error);
      setReadings([]);
    }
  };

  const handleSearch = () => {
    fetchMeterData(searchValue);
  };

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
    if (meterInfo) {
      loadCategoryReadings(meterInfo, newValue);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === readings.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(readings.map((r, i) => `${i}`)));
    }
  };

  const toggleItem = (index: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const requestDLMSReading = async () => {
    if (!meterInfo) {
      toast.error('Please search for a meter first');
      return;
    }

    setDlmsReading(true);
    try {
      // Call DLMS read API
      const response = await axios.post(`/api/dlms/read/${meterInfo._id}`);

      if (response.data.success) {
        toast.success('DLMS reading completed successfully');
        // Refresh meter data
        setTimeout(() => fetchMeterData(searchValue), 1000);
      } else {
        toast.error(response.data.error || 'DLMS reading failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to perform DLMS reading');
    } finally {
      setDlmsReading(false);
    }
  };

  const handleRelayControl = async (action: 'connect' | 'disconnect') => {
    if (!meterInfo) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/dlms/relay-control', {
        meterId: meterInfo._id,
        action,
      });

      if (response.data.success) {
        toast.success(`Relay ${action} command sent successfully`);
        setRelayDialog(false);
        // Refresh meter data
        setTimeout(() => fetchMeterData(searchValue), 2000);
      } else {
        toast.error(response.data.error || 'Relay control failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to control relay');
    } finally {
      setLoading(false);
    }
  };

  const exportSelectedReadings = () => {
    const selected = readings.filter((_, idx) => selectedItems.has(`${idx}`));
    const csvData = selected.map(r => ({
      'Parameter': r.name,
      'OBIS Code': r.code,
      'Value': r.value,
      'Unit': r.unit || '-'
    }));
    return csvData;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#344767' }}>
        On Demand Meter Reading
      </Typography>

      <Grid container spacing={3}>
        {/* Left Side - Meter Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Meter Information
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Enter Meter Number or ID"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleSearch} edge="end" color="primary">
                        <Search />
                      </IconButton>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  size="small"
                />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={requestDLMSReading}
                      disabled={dlmsReading || !meterInfo}
                      sx={{
                        background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
                      }}
                    >
                      {dlmsReading ? <CircularProgress size={20} /> : 'DLMS Read'}
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PowerSettingsNew />}
                      onClick={() => setRelayDialog(true)}
                      disabled={!meterInfo || selectedCategory !== 'relay'}
                    >
                      Relay Control
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {meterInfo && (
                <Box sx={{ '& > div': { mb: 2 } }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Meter Number:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      {meterInfo.meterNumber}
                      <Chip
                        label="✓"
                        size="small"
                        color="success"
                        sx={{ ml: 1, height: 20 }}
                      />
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Brand & Model:
                    </Typography>
                    <Typography variant="body2">{meterInfo.brand} - {meterInfo.model}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Meter Type:
                    </Typography>
                    <Typography variant="body2">{meterInfo.meterType}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Communication Status:
                    </Typography>
                    <Chip
                      label={meterInfo.communicationStatus || 'offline'}
                      size="small"
                      color={meterInfo.communicationStatus === 'online' ? 'success' : 'error'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      IP Address:
                    </Typography>
                    <Typography variant="body2">{meterInfo.ipAddress || 'N/A'}:{meterInfo.port || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Concentrator ID:
                    </Typography>
                    <Typography variant="body2">{meterInfo.concentratorId}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Customer Name:
                    </Typography>
                    <Typography variant="body2">{meterInfo.customer?.customerName || 'Unassigned'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Area:
                    </Typography>
                    <Typography variant="body2">{meterInfo.area?.name || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Vending:
                    </Typography>
                    <Typography variant="body2">{meterInfo.lastVending}</Typography>
                  </Box>
                </Box>
              )}

              {!meterInfo && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Search for a meter to view detailed information and perform DLMS readings
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - On Demand Reading */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Meter Readings - {selectedCategory.toUpperCase()}
                </Typography>
                <CSVLink
                  data={exportSelectedReadings()}
                  filename={`meter_readings_${meterInfo?.meterNumber || 'export'}.csv`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    size="small"
                    disabled={selectedItems.size === 0}
                  >
                    Export Selected ({selectedItems.size})
                  </Button>
                </CSVLink>
              </Box>

              {/* Category Tabs */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {readingCategories.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={selectedCategory === cat.value ? 'contained' : 'outlined'}
                      startIcon={cat.icon}
                      onClick={(e) => handleCategoryChange(e, cat.value)}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.875rem',
                      }}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Readings Table */}
              <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={selectedItems.size === readings.length && readings.length > 0}
                            indeterminate={selectedItems.size > 0 && selectedItems.size < readings.length}
                            onChange={toggleSelectAll}
                            sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                          />
                          Parameter
                        </Box>
                      </TableCell>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>
                        OBIS Code
                      </TableCell>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>
                        Value
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {readings.length > 0 ? (
                      readings.map((reading, index) => {
                        const key = `${index}`;
                        const isSelected = selectedItems.has(key);
                        return (
                          <TableRow
                            key={key}
                            sx={{
                              bgcolor: isSelected ? 'action.selected' : 'inherit',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => toggleItem(key)}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {reading.name || 'Unknown'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {reading.code || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {reading.value !== undefined && reading.value !== null ? reading.value : '-'}
                                {reading.unit && ` ${reading.unit}`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {meterInfo
                              ? 'No readings available for this category'
                              : 'Search for a meter to view readings'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Relay Control Dialog */}
      <Dialog open={relayDialog} onClose={() => setRelayDialog(false)}>
        <DialogTitle>Relay Control</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Control the relay for meter: <strong>{meterInfo?.meterNumber}</strong>
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will remotely control the meter relay. Ensure you have proper authorization.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRelayDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleRelayControl('disconnect')}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Disconnect
          </Button>
          <Button
            onClick={() => handleRelayControl('connect')}
            color="success"
            variant="contained"
            disabled={loading}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
