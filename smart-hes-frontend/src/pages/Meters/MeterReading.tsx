import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Refresh,
  Download,
  ExpandMore,
  FlashOn,
  BatteryChargingFull,
  Speed,
  Info,
  PowerSettingsNew,
  CloudUpload,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CSVLink } from 'react-csv';
import { obisService, ObisFunction, ParameterCategory } from '../../services/obis.service';
import { dlmsService } from '../../services/dlms.service';

interface MeterInfo {
  _id: string;
  meterNumber: string;
  brand: 'hexing' | 'hexcell';
  model: string;
  meterType: string;
  area?: any;
  customer?: any;
  ipAddress?: string;
  port?: number;
  communicationStatus?: string;
  status?: string;
}

interface ReadingValue {
  obisCode: string;
  name: string;
  value: any;
  unit?: string;
  timestamp?: Date;
  status: 'pending' | 'reading' | 'success' | 'error';
  error?: string;
}

export default function MeterReadingNew() {
  const [searchValue, setSearchValue] = useState('');
  const [meterInfo, setMeterInfo] = useState<MeterInfo | null>(null);
  const [categories, setCategories] = useState<ParameterCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [readingValues, setReadingValues] = useState<Map<string, ReadingValue>>(new Map());
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [readingInProgress, setReadingInProgress] = useState(false);

  // Load OBIS categories when meter is selected
  useEffect(() => {
    if (meterInfo) {
      loadOBISCategories();
    }
  }, [meterInfo]);

  const loadOBISCategories = async () => {
    if (!meterInfo) return;

    setLoading(true);
    try {
      const cats = await obisService.getCategorizedParameters(meterInfo.brand);
      setCategories(cats);

      // Select first category by default
      if (cats.length > 0) {
        setSelectedCategory(cats[0].category);
      }
    } catch (error) {
      console.error('Failed to load OBIS categories:', error);
      toast.error('Failed to load parameter categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeterData = async (meterQuery: string) => {
    if (!meterQuery) {
      toast.error('Please enter a meter number');
      return;
    }

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
        brand: meter.brand || 'hexing',
        model: meter.model || 'Unknown',
        meterType: meter.meterType || 'Unknown',
        area: meter.area,
        customer: meter.customer,
        ipAddress: meter.ipAddress,
        port: meter.port,
        communicationStatus: meter.communicationStatus,
        status: meter.status,
      });

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

  const toggleParameter = (obisCode: string) => {
    const newSelected = new Set(selectedParams);
    if (newSelected.has(obisCode)) {
      newSelected.delete(obisCode);
    } else {
      newSelected.add(obisCode);
    }
    setSelectedParams(newSelected);
  };

  const toggleAllInCategory = (category: ParameterCategory) => {
    const allCodes = category.subcategories.flatMap(sub =>
      sub.parameters.map(p => p.code)
    );

    const allSelected = allCodes.every(code => selectedParams.has(code));
    const newSelected = new Set(selectedParams);

    if (allSelected) {
      allCodes.forEach(code => newSelected.delete(code));
    } else {
      allCodes.forEach(code => newSelected.add(code));
    }

    setSelectedParams(newSelected);
  };

  const readSelectedParameters = async () => {
    if (!meterInfo) {
      toast.error('Please select a meter first');
      return;
    }

    if (selectedParams.size === 0) {
      toast.error('Please select at least one parameter to read');
      return;
    }

    setReadingInProgress(true);

    // Initialize reading values with pending status
    const newReadingValues = new Map<string, ReadingValue>();
    selectedParams.forEach(code => {
      const func = findFunctionByCode(code);
      if (func) {
        newReadingValues.set(code, {
          obisCode: code,
          name: extractParameterName(func.description),
          value: null,
          unit: func.unit,
          status: 'pending',
        });
      }
    });
    setReadingValues(newReadingValues);

    // Read parameters one by one (could be optimized with read-multiple)
    const obisCodes = Array.from(selectedParams);

    for (const code of obisCodes) {
      const func = findFunctionByCode(code);
      if (!func) continue;

      // Update status to reading
      setReadingValues(prev => {
        const updated = new Map(prev);
        const current = updated.get(code);
        if (current) {
          updated.set(code, { ...current, status: 'reading' });
        }
        return updated;
      });

      try {
        const result = await dlmsService.readObis({
          meterNumber: meterInfo.meterNumber,
          obisCode: code,
          classId: func.classId,
          attributeId: func.attributeId || 2,
        });

        // Update with successful value
        setReadingValues(prev => {
          const updated = new Map(prev);
          const current = updated.get(code);
          if (current) {
            updated.set(code, {
              ...current,
              value: result.data?.value ?? result.data,
              status: 'success',
              timestamp: new Date(),
            });
          }
          return updated;
        });
      } catch (error: any) {
        // Update with error
        setReadingValues(prev => {
          const updated = new Map(prev);
          const current = updated.get(code);
          if (current) {
            updated.set(code, {
              ...current,
              status: 'error',
              error: error.message || 'Failed to read',
            });
          }
          return updated;
        });
      }
    }

    setReadingInProgress(false);
    toast.success('Reading complete');
  };

  const findFunctionByCode = (code: string): ObisFunction | null => {
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        const func = subcategory.parameters.find(p => p.code === code);
        if (func) return func;
      }
    }
    return null;
  };

  const extractParameterName = (description: string): string => {
    // Extract meaningful name from description
    // Description format: "Category//Subcategory\t...\tName\t..."
    const parts = description.split('\t');
    if (parts.length > 5) {
      return parts[5] || parts[0];
    }
    return description.split('//')[0] || description;
  };

  const exportReadings = () => {
    const readings = Array.from(readingValues.values());
    return readings.map(r => ({
      'Parameter': r.name,
      'OBIS Code': r.obisCode,
      'Value': r.value !== null && r.value !== undefined ? r.value : '-',
      'Unit': r.unit || '-',
      'Status': r.status,
      'Timestamp': r.timestamp ? new Date(r.timestamp).toLocaleString() : '-',
    }));
  };

  const getCurrentCategory = (): ParameterCategory | null => {
    return categories.find(c => c.category === selectedCategory) || null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#344767' }}>
        Advanced Meter Reading
      </Typography>

      <Grid container spacing={3}>
        {/* Left Side - Meter Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Meter Information
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
                  size="small"
                />

                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={readingInProgress ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                      onClick={readSelectedParameters}
                      disabled={readingInProgress || !meterInfo || selectedParams.size === 0}
                      sx={{
                        background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
                        mb: 1,
                      }}
                    >
                      {readingInProgress ? 'Reading...' : `Read Selected (${selectedParams.size})`}
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <CSVLink
                      data={exportReadings()}
                      filename={`meter_readings_${meterInfo?.meterNumber || 'export'}_${Date.now()}.csv`}
                      style={{ textDecoration: 'none', width: '100%', display: 'block' }}
                    >
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Download />}
                        disabled={readingValues.size === 0}
                      >
                        Export Readings
                      </Button>
                    </CSVLink>
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
                      Network:
                    </Typography>
                    <Typography variant="body2">{meterInfo.ipAddress || 'N/A'}:{meterInfo.port || 'N/A'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Customer:
                    </Typography>
                    <Typography variant="body2">{meterInfo.customer?.customerName || 'Unassigned'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Area:
                    </Typography>
                    <Typography variant="body2">{meterInfo.area?.name || 'N/A'}</Typography>
                  </Box>
                </Box>
              )}

              {!meterInfo && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Search for a meter to view detailed information and perform readings
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Parameter Categories and Readings */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                OBIS Parameters
              </Typography>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && !meterInfo && (
                <Alert severity="info">
                  Please search for a meter to view available parameters
                </Alert>
              )}

              {!loading && meterInfo && categories.length === 0 && (
                <Alert severity="warning">
                  No OBIS parameters found for this meter brand
                </Alert>
              )}

              {!loading && meterInfo && categories.length > 0 && (
                <>
                  {/* Category Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                      value={selectedCategory}
                      onChange={(e, newValue) => setSelectedCategory(newValue)}
                      variant="scrollable"
                      scrollButtons="auto"
                    >
                      {categories.map((cat) => (
                        <Tab
                          key={cat.category}
                          label={cat.category}
                          value={cat.category}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        />
                      ))}
                    </Tabs>
                  </Box>

                  {/* Category Parameters */}
                  {getCurrentCategory() && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {getCurrentCategory()?.category} Parameters
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => toggleAllInCategory(getCurrentCategory()!)}
                        >
                          Toggle All
                        </Button>
                      </Box>

                      <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                        {getCurrentCategory()?.subcategories.map((subcategory, idx) => (
                          <Accordion key={idx} defaultExpanded={idx === 0}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {subcategory.name} ({subcategory.parameters.length})
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell padding="checkbox"></TableCell>
                                    <TableCell>Parameter</TableCell>
                                    <TableCell>OBIS Code</TableCell>
                                    <TableCell>Value</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {subcategory.parameters.map((param) => {
                                    const isSelected = selectedParams.has(param.code);
                                    const readingValue = readingValues.get(param.code);
                                    const paramName = extractParameterName(param.description);

                                    return (
                                      <TableRow
                                        key={param.code}
                                        hover
                                        sx={{ bgcolor: isSelected ? 'action.selected' : 'inherit' }}
                                      >
                                        <TableCell padding="checkbox">
                                          <Checkbox
                                            checked={isSelected}
                                            onChange={() => toggleParameter(param.code)}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {paramName}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="caption" color="text.secondary">
                                            {param.code}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          {readingValue ? (
                                            <Typography variant="body2">
                                              {readingValue.status === 'success' && (
                                                <>
                                                  {readingValue.value !== null && readingValue.value !== undefined
                                                    ? `${readingValue.value} ${readingValue.unit || ''}`
                                                    : '-'}
                                                </>
                                              )}
                                              {readingValue.status === 'reading' && <CircularProgress size={16} />}
                                              {readingValue.status === 'pending' && '-'}
                                              {readingValue.status === 'error' && (
                                                <span style={{ color: 'red' }}>Error</span>
                                              )}
                                            </Typography>
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">
                                              -
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {readingValue && (
                                            <Chip
                                              label={readingValue.status}
                                              size="small"
                                              color={
                                                readingValue.status === 'success' ? 'success' :
                                                readingValue.status === 'error' ? 'error' :
                                                readingValue.status === 'reading' ? 'info' : 'default'
                                              }
                                            />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
