import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getOBISByCategory, getOBISDescription, getOBISUnit, type OBISCategory } from '../../utils/obis-codes';
import { exportToCSV, printElement } from '../../utils/exportUtils';

interface Meter {
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
  status: string;
  lastSeen?: string;
}

interface ReadingResult {
  obisCode: string;
  name: string;
  value: any;
  unit?: string;
  timestamp: Date;
  selected: boolean;
}

const MeterReading: React.FC = () => {
  const [meterNumber, setMeterNumber] = useState('');
  const [meter, setMeter] = useState<Meter | null>(null);
  const [loading, setLoading] = useState(false);
  const [readingResults, setReadingResults] = useState<ReadingResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [reading, setReading] = useState(false);

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

  const readCategory = async (category: OBISCategory) => {
    if (!meter) {
      toast.error('Please search for a meter first');
      return;
    }

    setSelectedCategory(category);
    setReading(true);

    try {
      const obisCodes = getOBISByCategory(category);
      const results: ReadingResult[] = [];

      // Read all OBIS codes in this category
      for (const obis of obisCodes) {
        try {
          const response = await axios.post('/dlms/read', {
            meterId: meter._id,
            obisCode: obis.code,
          });

          if (response.data.success) {
            results.push({
              obisCode: obis.code,
              name: obis.name,
              value: response.data.value,
              unit: obis.unit,
              timestamp: new Date(),
              selected: false,
            });
          }
        } catch (error) {
          console.error(`Failed to read ${obis.code}:`, error);
          // Continue reading other codes even if one fails
        }
      }

      if (results.length > 0) {
        setReadingResults(results);
        toast.success(`Read ${results.length} parameters from ${category}`);
      } else {
        toast.warning(`No data retrieved for ${category}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to read ${category} data`);
    } finally {
      setReading(false);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = readingResults.every(r => r.selected);
    setReadingResults(readingResults.map(r => ({ ...r, selected: !allSelected })));
  };

  const toggleSelect = (index: number) => {
    setReadingResults(readingResults.map((r, i) =>
      i === index ? { ...r, selected: !r.selected } : r
    ));
  };

  const handleExport = () => {
    const selectedResults = readingResults.filter(r => r.selected);

    if (selectedResults.length === 0) {
      toast.error('Please select at least one parameter to export');
      return;
    }

    const exportData = selectedResults.map(r => ({
      'Parameter': r.name,
      'OBIS Code': r.obisCode,
      'Value': r.value,
      'Unit': r.unit || '',
      'Timestamp': format(r.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    }));

    exportToCSV(
      exportData,
      `meter_reading_${meter?.meterNumber}_${selectedCategory}`,
      ['Parameter', 'OBIS Code', 'Value', 'Unit', 'Timestamp']
    );
  };

  const handlePrint = () => {
    printElement('reading-results', `Meter Reading - ${meter?.meterNumber}`);
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
        On Demand Meter Reading
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
                      <Typography variant="caption" color="text.secondary">
                        MSNO:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {meter.meterNumber}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Vending:
                      </Typography>
                      <Typography variant="body2">
                        {meter.lastSeen ? format(new Date(meter.lastSeen), 'PPpp') : 'N/A'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Meter Type:
                      </Typography>
                      <Typography variant="body2">
                        {meter.brand} {meter.model}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        SGC:
                      </Typography>
                      <Typography variant="body2">
                        {meter.area?.code || 'N/A'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        TI:
                      </Typography>
                      <Typography variant="body2">1</Typography>
                    </Box>

                    {meter.customer && (
                      <>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            User Name:
                          </Typography>
                          <Typography variant="body2">{meter.customer.customerName}</Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Account Number:
                          </Typography>
                          <Typography variant="body2">{meter.customer.accountNumber}</Typography>
                        </Box>
                      </>
                    )}

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Supplier Name:
                      </Typography>
                      <Typography variant="body2">New Hampshire Capital</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Identity:
                      </Typography>
                      <Typography variant="body2">{meter._id}</Typography>
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
                    <Typography variant="body2">
                      Enter a meter number and click search to view customer information
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - On Demand Reading */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  On Demand Reading
                </Typography>
                {meter && (
                  <Chip
                    icon={<InfoIcon />}
                    label={`Reading: ${meter.meterNumber}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              {!meter && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Please search and select a meter to enable reading functions
                </Alert>
              )}

              {/* Reading Category Buttons */}
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {categories.map((category) => (
                  <Grid item xs={6} sm={4} md={3} key={category}>
                    <Button
                      fullWidth
                      variant={selectedCategory === category ? 'contained' : 'outlined'}
                      onClick={() => readCategory(category)}
                      disabled={!meter || reading}
                      sx={{
                        height: 60,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      {reading && selectedCategory === category ? (
                        <CircularProgress size={20} />
                      ) : (
                        category
                      )}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Results Table */}
              {readingResults.length > 0 && (
                <Box id="reading-results">
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Reading Results ({selectedCategory})
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        variant="outlined"
                      >
                        Export
                      </Button>
                      <Button
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        variant="outlined"
                      >
                        Print
                      </Button>
                      <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => selectedCategory && readCategory(selectedCategory as OBISCategory)}
                        variant="outlined"
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={readingResults.every(r => r.selected)}
                              indeterminate={
                                readingResults.some(r => r.selected) &&
                                !readingResults.every(r => r.selected)
                              }
                              onChange={toggleSelectAll}
                              sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Select All Item</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Value</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>OBIS Code</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Timestamp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {readingResults.map((result, index) => (
                          <TableRow
                            key={result.obisCode}
                            hover
                            selected={result.selected}
                            onClick={() => toggleSelect(index)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox checked={result.selected} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {result.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatValue(result.value)}
                                {result.unit && (
                                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    {result.unit}
                                  </Typography>
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {result.obisCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {format(result.timestamp, 'HH:mm:ss')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {readingResults.filter(r => r.selected).length} of {readingResults.length} parameters selected
                    </Typography>
                  </Box>
                </Box>
              )}

              {readingResults.length === 0 && meter && (
                <Alert severity="info">
                  Click a category button above to read parameters from the meter
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeterReading;
