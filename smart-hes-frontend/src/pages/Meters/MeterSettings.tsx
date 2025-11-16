import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Delete,
  Save,
  Add,
  CloudUpload,
  Search,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
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
}

interface SettingValue {
  code: string;
  name: string;
  value: any;
  unit?: string;
  classId?: number;
  attributeId?: number;
  description?: string;
}

export default function MeterSettingsNew() {
  const [searchValue, setSearchValue] = useState('');
  const [meterInfo, setMeterInfo] = useState<MeterInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [writeToMeter, setWriteToMeter] = useState(false);
  const [categories, setCategories] = useState<ParameterCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [settings, setSettings] = useState<Map<string, SettingValue>>(new Map());
  const [editDialog, setEditDialog] = useState(false);
  const [editingParam, setEditingParam] = useState<SettingValue | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (meterInfo) {
      loadOBISCategories();
      loadMeterSettings();
    }
  }, [meterInfo]);

  const loadOBISCategories = async () => {
    if (!meterInfo) return;

    setLoading(true);
    try {
      const cats = await obisService.getCategorizedParameters(meterInfo.brand);

      // Filter to only include writable/configurable categories
      const configurableCategories = cats.filter(cat =>
        ['Tariff & Billing', 'Clock & Time', 'Relay Control', 'Power Quality', 'Communication'].includes(cat.category)
      );

      setCategories(configurableCategories);

      if (configurableCategories.length > 0) {
        setSelectedCategory(configurableCategories[0].category);
      }
    } catch (error) {
      console.error('Failed to load OBIS categories:', error);
      toast.error('Failed to load parameter categories');
    } finally {
      setLoading(false);
    }
  };

  const loadMeterSettings = async () => {
    if (!meterInfo) return;

    try {
      const response = await axios.get(`/api/meters/${meterInfo.meterNumber}/settings`);
      const { obisConfiguration = {} } = response.data.data;

      // Convert to settings map
      const settingsMap = new Map<string, SettingValue>();
      Object.entries(obisConfiguration).forEach(([code, value]) => {
        const func = findFunctionByCode(code);
        settingsMap.set(code, {
          code,
          name: func ? extractParameterName(func.description) : code,
          value,
          unit: func?.unit,
          classId: func?.classId,
          attributeId: func?.attributeId,
          description: func?.description,
        });
      });

      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Failed to load meter settings:', error);
      toast.error('Failed to load meter settings');
    }
  };

  const fetchMeterData = async (meterQuery: string) => {
    if (!meterQuery) {
      toast.error('Please enter a meter number');
      return;
    }

    setLoading(true);
    try {
      const meterResp = await axios.get(`/api/meters?search=${encodeURIComponent(meterQuery)}`);
      const meter = meterResp.data.data?.[0];

      if (!meter) {
        toast.error('Meter not found');
        setLoading(false);
        return;
      }

      setMeterInfo({
        _id: meter._id,
        meterNumber: meter.meterNumber || '',
        brand: meter.brand || 'hexing',
        model: meter.model || 'Unknown',
        meterType: meter.meterType || 'Unknown',
        area: meter.area,
        customer: meter.customer,
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

  const openEditDialog = (param: SettingValue) => {
    setEditingParam(param);
    setEditValue(String(param.value || ''));
    setEditDialog(true);
  };

  const saveParameterEdit = () => {
    if (!editingParam) return;

    const updatedSettings = new Map(settings);
    updatedSettings.set(editingParam.code, {
      ...editingParam,
      value: editValue,
    });
    setSettings(updatedSettings);
    setEditDialog(false);
    setEditingParam(null);
    toast.success('Parameter updated locally');
  };

  const addNewParameter = (obisFunc: ObisFunction) => {
    const updatedSettings = new Map(settings);
    updatedSettings.set(obisFunc.code, {
      code: obisFunc.code,
      name: extractParameterName(obisFunc.description),
      value: '',
      unit: obisFunc.unit,
      classId: obisFunc.classId,
      attributeId: obisFunc.attributeId,
      description: obisFunc.description,
    });
    setSettings(updatedSettings);
    toast.success('Parameter added');
  };

  const deleteParameter = (code: string) => {
    const updatedSettings = new Map(settings);
    updatedSettings.delete(code);
    setSettings(updatedSettings);
    toast.success('Parameter removed');
  };

  const saveAllSettings = async () => {
    if (!meterInfo) {
      toast.error('No meter selected');
      return;
    }

    setSavingSettings(true);
    try {
      // Convert settings map to object
      const obisConfiguration: any = {};
      settings.forEach((value, code) => {
        obisConfiguration[code] = value.value;
      });

      const response = await axios.post(`/api/meters/${meterInfo.meterNumber}/settings`, {
        settings: obisConfiguration,
        metadata: {},
        writeToMeter: writeToMeter,
      });

      toast.success(response.data?.message || 'Settings saved successfully');

      if (writeToMeter) {
        toast('Settings are being written to the meter device', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const writeParameterToMeter = async (param: SettingValue) => {
    if (!meterInfo) return;

    try {
      await dlmsService.writeObis({
        meterNumber: meterInfo.meterNumber,
        obisCode: param.code,
        value: param.value,
        classId: param.classId,
        attributeId: param.attributeId || 2,
      });

      toast.success(`Parameter ${param.name} written to meter successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to write parameter to meter');
    }
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
    const parts = description.split('\t');
    if (parts.length > 5) {
      return parts[5] || parts[0];
    }
    return description.split('//')[0] || description;
  };

  const getCurrentCategory = (): ParameterCategory | null => {
    return categories.find(c => c.category === selectedCategory) || null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#344767' }}>
        Meter Settings & OBIS Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Left Side - Meter Info */}
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

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={savingSettings ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={saveAllSettings}
                  disabled={savingSettings || !meterInfo || settings.size === 0}
                  sx={{
                    background: 'linear-gradient(195deg, #42a047 0%, #2e7d32 100%)',
                    mb: 1,
                  }}
                >
                  {savingSettings ? 'Saving...' : 'Save All Settings'}
                </Button>

                <Button
                  fullWidth
                  variant={writeToMeter ? 'contained' : 'outlined'}
                  color="warning"
                  startIcon={<CloudUpload />}
                  onClick={() => setWriteToMeter(!writeToMeter)}
                  disabled={!meterInfo}
                >
                  {writeToMeter ? 'Write to Meter: ON' : 'Write to Meter: OFF'}
                </Button>

                {writeToMeter && (
                  <Alert severity="warning" sx={{ mt: 2, fontSize: '0.85rem' }}>
                    Settings will be written directly to the meter device
                  </Alert>
                )}
              </Box>

              {meterInfo && (
                <Box sx={{ '& > div': { mb: 2 } }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Meter Number:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {meterInfo.meterNumber}
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

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Settings:
                    </Typography>
                    <Chip
                      label={settings.size}
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              )}

              {!meterInfo && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Search for a meter to manage its settings
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side - Settings Categories */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Configuration Parameters
              </Typography>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && !meterInfo && (
                <Alert severity="info">
                  Please search for a meter to manage its settings
                </Alert>
              )}

              {!loading && meterInfo && categories.length === 0 && (
                <Alert severity="warning">
                  No configurable parameters found for this meter brand
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
                                  <TableCell>Parameter</TableCell>
                                  <TableCell>OBIS Code</TableCell>
                                  <TableCell>Current Value</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {subcategory.parameters.map((param) => {
                                  const currentSetting = settings.get(param.code);
                                  const paramName = extractParameterName(param.description);

                                  return (
                                    <TableRow key={param.code}>
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
                                        {currentSetting ? (
                                          <Chip
                                            label={`${currentSetting.value} ${currentSetting.unit || ''}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                        ) : (
                                          <Typography variant="caption" color="text.secondary">
                                            Not configured
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          {currentSetting ? (
                                            <>
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => openEditDialog(currentSetting)}
                                                title="Edit value"
                                              >
                                                <Edit fontSize="small" />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => deleteParameter(param.code)}
                                                title="Remove"
                                              >
                                                <Delete fontSize="small" />
                                              </IconButton>
                                              {writeToMeter && (
                                                <IconButton
                                                  size="small"
                                                  color="success"
                                                  onClick={() => writeParameterToMeter(currentSetting)}
                                                  title="Write to meter"
                                                >
                                                  <CloudUpload fontSize="small" />
                                                </IconButton>
                                              )}
                                            </>
                                          ) : (
                                            <IconButton
                                              size="small"
                                              color="success"
                                              onClick={() => addNewParameter(param)}
                                              title="Add parameter"
                                            >
                                              <Add fontSize="small" />
                                            </IconButton>
                                          )}
                                        </Box>
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Parameter Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Parameter Value</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Parameter: <strong>{editingParam?.name}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            OBIS Code: {editingParam?.code}
          </Typography>
          <TextField
            fullWidth
            label="Value"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            helperText={editingParam?.unit ? `Unit: ${editingParam.unit}` : ''}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={saveParameterEdit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
