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
  Tabs,
  Tab,
  Divider,
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
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

interface MeterInfo {
  msno: string;
  lastVending?: string;
  meterType: string;
  sgc?: string;
  ti?: string;
  userName?: string;
  supplierName?: string;
  identity?: string;
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
  const [readings, setReadings] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      if (meterInfo && (data.meterNumber === meterInfo.msno || data.meterId === searchValue)) {
        toast.success('Meter reading updated');
        fetchMeterData(searchValue);
      }
    };

    socket.on('meter-reading-update', handler);
    return () => {
      socket.off('meter-reading-update', handler);
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
        return;
      }

      // Set meter info
      setMeterInfo({
        msno: meter.meterNumber || '',
        lastVending: meter.lastVending || 'N/A',
        meterType: meter.meterType || 'Unknown',
        sgc: meter.concentratorId || 'N/A',
        ti: meter.tariffIndex || '1',
        userName: meter.customer?.customerName || 'N/A',
        supplierName: meter.supplierName || 'LONGi',
        identity: meter.customer?.accountNumber || 'N/A',
      });

      // Fetch OBIS configuration
      const settingsResp = await axios.get(`/api/meters/${meter._id}/settings`);
      const config = settingsResp.data.data?.obisConfiguration || [];

      // Find the selected category group
      const categoryGroup = config.find((g: any) =>
        g.name?.toLowerCase().includes(selectedCategory.toLowerCase())
      );

      if (categoryGroup?.items) {
        setReadings(categoryGroup.items);
      } else {
        setReadings([]);
      }

      toast.success('Meter data loaded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch meter data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchMeterData(searchValue);
  };

  const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
    if (meterInfo) {
      fetchMeterData(searchValue);
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

  const requestReading = async () => {
    if (!searchValue) {
      toast.error('Please enter a meter number');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/meters/${encodeURIComponent(searchValue)}/read`);
      toast.success('Reading request sent');
      // Wait a moment then refresh
      setTimeout(() => fetchMeterData(searchValue), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request reading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        On Demand Reading
      </Typography>

      <Grid container spacing={3}>
        {/* Left Side - Customer Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Customer Information
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Enter Meter Number"
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
                />
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={requestReading}
                  disabled={loading || !searchValue}
                  sx={{ mb: 2 }}
                >
                  Reading
                </Button>
              </Box>

              {meterInfo && (
                <Box sx={{ '& > div': { mb: 2 } }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      MSNO:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {meterInfo.msno}
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
                      Last Vending:
                    </Typography>
                    <Typography variant="body2">{meterInfo.lastVending}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Meter Type:
                    </Typography>
                    <Typography variant="body2">{meterInfo.meterType}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      SGC:
                    </Typography>
                    <Typography variant="body2">{meterInfo.sgc}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      TI:
                    </Typography>
                    <Typography variant="body2">{meterInfo.ti}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      User Name:
                    </Typography>
                    <Typography variant="body2">{meterInfo.userName}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Supplier Name:
                    </Typography>
                    <Typography variant="body2">{meterInfo.supplierName}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Identity:
                    </Typography>
                    <Typography variant="body2">{meterInfo.identity}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - On Demand Reading */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  On Demand Reading
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  size="small"
                  disabled={selectedItems.size === 0}
                >
                  Export Selected
                </Button>
              </Box>

              {/* Category Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {readingCategories.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={selectedCategory === cat.value ? 'contained' : 'outlined'}
                      startIcon={cat.icon}
                      onClick={(e) => handleCategoryChange(e, cat.value)}
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

              {/* Readings Table */}
              <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={selectedItems.size === readings.length && readings.length > 0}
                            indeterminate={selectedItems.size > 0 && selectedItems.size < readings.length}
                            onChange={toggleSelectAll}
                            sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                          />
                          Select All Item
                        </Box>
                      </TableCell>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700 }}>
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
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {reading.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {reading.code || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {reading.value !== undefined ? reading.value : '-'}
                                {reading.unit && ` ${reading.unit}`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
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
    </Box>
  );
}
