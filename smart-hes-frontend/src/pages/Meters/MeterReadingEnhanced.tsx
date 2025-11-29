import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as ReadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getOBISByCategory, type OBISCategory } from '../../utils/obis-codes';
import { exportToCSV, printElement } from '../../utils/exportUtils';

interface Meter {
  _id: string;
  meterNumber: string;
  brand: string;
  model: string;
  area: { name: string; code: string };
  customer?: { customerName: string; accountNumber: string };
  status: string;
  lastSeen?: string;
}

interface OBISParameter {
  code: string;
  name: string;
  unit?: string;
  readable?: boolean;
  writable?: boolean;
}

interface ReadingResult {
  obisCode: string;
  name: string;
  value: any;
  unit?: string;
  timestamp: Date;
  status: 'success' | 'error';
  error?: string;
}

interface FunctionState {
  expanded: boolean;
  selectedParams: Set<string>;
  reading: boolean;
  results: ReadingResult[];
}

const MeterReadingEnhanced: React.FC = () => {
  const [meterNumber, setMeterNumber] = useState('');
  const [meter, setMeter] = useState<Meter | null>(null);
  const [loading, setLoading] = useState(false);

  const categories: OBISCategory[] = [
    'Information',
    'Clock',
    'Energy',
    'Demand',
    'Instantaneous',
    'Status',
    'Event Counter',
    'Prepayment',
    'Relay',
    'Tariff Data',
  ];

  // State for each function category
  const [functionStates, setFunctionStates] = useState<Record<string, FunctionState>>(
    categories.reduce((acc, cat) => ({
      ...acc,
      [cat]: {
        expanded: false,
        selectedParams: new Set<string>(),
        reading: false,
        results: [],
      },
    }), {})
  );

  const searchMeter = async () => {
    if (!meterNumber.trim()) {
      toast.error('Please enter a meter number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/meters`, {
        params: { search: meterNumber }
      });

      const meters = response.data.data;
      if (meters && meters.length > 0) {
        const foundMeter = meters.find((m: Meter) =>
          m.meterNumber.toUpperCase() === meterNumber.toUpperCase()
        ) || meters[0];

        setMeter(foundMeter);
        toast.success('Meter found');
      } else {
        toast.error('Meter not found');
        setMeter(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to search meter');
      setMeter(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFunctionExpansion = (category: string) => {
    setFunctionStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        expanded: !prev[category].expanded,
      },
    }));
  };

  const toggleParameterSelection = (category: string, paramCode: string) => {
    setFunctionStates(prev => {
      const newSelected = new Set(prev[category].selectedParams);
      if (newSelected.has(paramCode)) {
        newSelected.delete(paramCode);
      } else {
        newSelected.add(paramCode);
      }
      return {
        ...prev,
        [category]: {
          ...prev[category],
          selectedParams: newSelected,
        },
      };
    });
  };

  const toggleSelectAllParams = (category: string, allParams: OBISParameter[]) => {
    setFunctionStates(prev => {
      const currentSelected = prev[category].selectedParams;
      const allCodes = allParams.map(p => p.code);
      const allSelected = allCodes.every(code => currentSelected.has(code));

      const newSelected = allSelected
        ? new Set<string>()
        : new Set(allCodes);

      return {
        ...prev,
        [category]: {
          ...prev[category],
          selectedParams: newSelected,
        },
      };
    });
  };

  const readSelectedParameters = async (category: string) => {
    if (!meter) {
      toast.error('Please search for a meter first');
      return;
    }

    const selectedParams = Array.from(functionStates[category].selectedParams);
    if (selectedParams.length === 0) {
      toast.error('Please select at least one parameter to read');
      return;
    }

    setFunctionStates(prev => ({
      ...prev,
      [category]: { ...prev[category], reading: true },
    }));

    const results: ReadingResult[] = [];

    for (const paramCode of selectedParams) {
      try {
        const response = await axios.post('/dlms/read', {
          meterId: meter._id,
          obisCode: paramCode,
        });

        const obisCodes = getOBISByCategory(category as OBISCategory);
        const paramInfo = obisCodes.find(o => o.code === paramCode);

        results.push({
          obisCode: paramCode,
          name: paramInfo?.name || paramCode,
          value: response.data.value,
          unit: paramInfo?.unit,
          timestamp: new Date(),
          status: 'success',
        });
      } catch (error: any) {
        const obisCodes = getOBISByCategory(category as OBISCategory);
        const paramInfo = obisCodes.find(o => o.code === paramCode);

        results.push({
          obisCode: paramCode,
          name: paramInfo?.name || paramCode,
          value: null,
          unit: paramInfo?.unit,
          timestamp: new Date(),
          status: 'error',
          error: error.response?.data?.message || 'Failed to read',
        });
      }
    }

    setFunctionStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        reading: false,
        results: results,
      },
    }));

    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Read ${successCount} of ${selectedParams.length} parameters successfully`);
  };

  const clearResults = (category: string) => {
    setFunctionStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        results: [],
        selectedParams: new Set(),
      },
    }));
  };

  const exportResults = (category: string) => {
    const results = functionStates[category].results;
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    const exportData = results.map(r => ({
      'Parameter': r.name,
      'OBIS Code': r.obisCode,
      'Value': r.status === 'success' ? r.value : r.error,
      'Unit': r.unit || '',
      'Status': r.status.toUpperCase(),
      'Timestamp': format(r.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    }));

    exportToCSV(
      exportData,
      `meter_reading_${meter?.meterNumber}_${category}`,
      ['Parameter', 'OBIS Code', 'Value', 'Unit', 'Status', 'Timestamp']
    );
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toFixed(2);
    return String(value);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
        On Demand Meter Reading & Setting
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Customer Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Customer Information
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <TextField
                    fullWidth
                    label="Meter Number"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchMeter()}
                    placeholder="Enter meter number"
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={searchMeter} disabled={loading}>
                          {loading ? <CircularProgress size={24} /> : <SearchIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                </Box>

                {meter && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">MSNO:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {meter.meterNumber}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Last Vending:</Typography>
                      <Typography variant="body2">
                        {meter.lastSeen ? format(new Date(meter.lastSeen), 'PPpp') : 'N/A'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Meter Type:</Typography>
                      <Typography variant="body2">{meter.brand} {meter.model}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">SGC:</Typography>
                      <Typography variant="body2">{meter.area?.code || 'N/A'}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">TI:</Typography>
                      <Typography variant="body2">1</Typography>
                    </Box>

                    {meter.customer && (
                      <>
                        <Box>
                          <Typography variant="caption" color="text.secondary">User Name:</Typography>
                          <Typography variant="body2">{meter.customer.customerName}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Account Number:</Typography>
                          <Typography variant="body2">{meter.customer.accountNumber}</Typography>
                        </Box>
                      </>
                    )}

                    <Box>
                      <Typography variant="caption" color="text.secondary">Supplier Name:</Typography>
                      <Typography variant="body2">New Hampshire Capital</Typography>
                    </Box>

                    <Chip
                      label={meter.status.toUpperCase()}
                      color={meter.status === 'online' ? 'success' : 'error'}
                      size="small"
                    />
                  </>
                )}

                {!meter && (
                  <Alert severity="info">
                    Enter a meter number and click search to view customer information
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Functions and Parameters */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Reading & Setting Functions
              </Typography>

              {!meter && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Please search and select a meter to enable reading functions
                </Alert>
              )}

              {meter && (
                <Stack spacing={2}>
                  {categories.map((category) => {
                    const state = functionStates[category];
                    const params = getOBISByCategory(category);
                    const selectedCount = state.selectedParams.size;
                    const hasResults = state.results.length > 0;

                    return (
                      <Paper key={category} variant="outlined" sx={{ overflow: 'hidden' }}>
                        {/* Function Header */}
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: state.expanded ? 'primary.light' : 'grey.50',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.3s',
                            '&:hover': { bgcolor: state.expanded ? 'primary.light' : 'grey.100' },
                          }}
                          onClick={() => toggleFunctionExpansion(category)}
                        >
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {category}
                            </Typography>
                            {selectedCount > 0 && (
                              <Chip label={`${selectedCount} selected`} size="small" color="primary" />
                            )}
                            {hasResults && (
                              <Chip label={`${state.results.length} results`} size="small" color="success" />
                            )}
                          </Box>
                          <IconButton size="small">
                            {state.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>

                        {/* Parameters List */}
                        <Collapse in={state.expanded}>
                          <Box sx={{ p: 2, bgcolor: 'white' }}>
                            {/* Parameter Selection Controls */}
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={params.length > 0 && params.every(p => state.selectedParams.has(p.code))}
                                    indeterminate={
                                      params.some(p => state.selectedParams.has(p.code)) &&
                                      !params.every(p => state.selectedParams.has(p.code))
                                    }
                                    onChange={() => toggleSelectAllParams(category, params)}
                                  />
                                }
                                label="Select All Parameters"
                              />
                              <Stack direction="row" spacing={1}>
                                {hasResults && (
                                  <>
                                    <Button
                                      size="small"
                                      startIcon={<DownloadIcon />}
                                      onClick={() => exportResults(category)}
                                      variant="outlined"
                                    >
                                      Export
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={() => clearResults(category)}
                                      variant="outlined"
                                      color="error"
                                    >
                                      Clear
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={state.reading ? <CircularProgress size={16} color="inherit" /> : <ReadIcon />}
                                  onClick={() => readSelectedParameters(category)}
                                  disabled={selectedCount === 0 || state.reading}
                                >
                                  {state.reading ? 'Reading...' : 'Read Selected'}
                                </Button>
                              </Stack>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {/* Parameters Table */}
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell padding="checkbox"></TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Parameter Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>OBIS Code</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {params.map((param) => {
                                    const result = state.results.find(r => r.obisCode === param.code);
                                    const isSelected = state.selectedParams.has(param.code);

                                    return (
                                      <TableRow
                                        key={param.code}
                                        hover
                                        sx={{
                                          bgcolor: result ? (result.status === 'success' ? 'success.50' : 'error.50') : 'inherit',
                                          cursor: 'pointer',
                                        }}
                                        onClick={() => toggleParameterSelection(category, param.code)}
                                      >
                                        <TableCell padding="checkbox">
                                          <Checkbox
                                            checked={isSelected}
                                            size="small"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {param.name}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="caption" color="text.secondary">
                                            {param.code}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {param.unit || '-'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          {result && (
                                            <Box>
                                              {result.status === 'success' ? (
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                  {formatValue(result.value)} {result.unit || ''}
                                                </Typography>
                                              ) : (
                                                <Typography variant="caption" color="error">
                                                  {result.error || 'Error'}
                                                </Typography>
                                              )}
                                              <Typography variant="caption" color="text.secondary" display="block">
                                                {format(result.timestamp, 'HH:mm:ss')}
                                              </Typography>
                                            </Box>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeterReadingEnhanced;
