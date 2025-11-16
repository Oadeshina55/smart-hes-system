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
  Paper,
  IconButton,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  getWritableCategories,
  getWritableOBISByCategory,
  getOBISByCode,
  type OBISCategory,
  type OBISCode,
} from '../../utils/obis-codes';

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

interface SettingValue {
  obisCode: string;
  name: string;
  currentValue: any;
  newValue: any;
  unit?: string;
  description?: string;
  modified: boolean;
  timestamp?: Date;
}

const MeterSettings: React.FC = () => {
  const [meterNumber, setMeterNumber] = useState('');
  const [meter, setMeter] = useState<Meter | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingValues, setSettingValues] = useState<Map<string, SettingValue>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [reading, setReading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ setting: SettingValue; action: string } | null>(null);

  const writableCategories = getWritableCategories();

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
        setSettingValues(new Map());
        setSelectedCategory('');
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

  const readCategorySettings = async (category: OBISCategory) => {
    if (!meter) {
      toast.error('Please search for a meter first');
      return;
    }

    setSelectedCategory(category);
    setReading(true);

    try {
      const obisCodes = getWritableOBISByCategory(category);
      const newSettings: Map<string, SettingValue> = new Map();

      // Read current values for all OBIS codes in this category
      for (const obis of obisCodes) {
        try {
          const response = await axios.post('/dlms/read', {
            meterId: meter._id,
            obisCode: obis.code,
          });

          if (response.data.success) {
            newSettings.set(obis.code, {
              obisCode: obis.code,
              name: obis.name,
              currentValue: response.data.value,
              newValue: response.data.value,
              unit: obis.unit,
              description: obis.description,
              modified: false,
              timestamp: new Date(),
            });
          } else {
            // If read fails, still add to map with empty values
            newSettings.set(obis.code, {
              obisCode: obis.code,
              name: obis.name,
              currentValue: null,
              newValue: '',
              unit: obis.unit,
              description: obis.description,
              modified: false,
            });
          }
        } catch (error) {
          console.error(`Failed to read ${obis.code}:`, error);
          // Add with empty values if read fails
          newSettings.set(obis.code, {
            obisCode: obis.code,
            name: obis.name,
            currentValue: null,
            newValue: '',
            unit: obis.unit,
            description: obis.description,
            modified: false,
          });
        }
      }

      setSettingValues(newSettings);
      toast.success(`Loaded ${newSettings.size} settings from ${category}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to load ${category} settings`);
    } finally {
      setReading(false);
    }
  };

  const handleValueChange = (obisCode: string, value: any) => {
    const current = settingValues.get(obisCode);
    if (!current) return;

    const updated = new Map(settingValues);
    updated.set(obisCode, {
      ...current,
      newValue: value,
      modified: value !== current.currentValue,
    });
    setSettingValues(updated);
  };

  const isCriticalSetting = (obisCode: string): boolean => {
    const critical = [
      '0.0.96.3.10.255', // Relay Control
      '0.0.17.0.0.255',  // Load Limit
      '0.0.40.0.0.255',  // Password LL
      '0.0.40.0.1.255',  // Password HL
      '0.0.1.0.0.255',   // Clock
    ];
    return critical.includes(obisCode);
  };

  const writeSingleSetting = async (setting: SettingValue, skipConfirm: boolean = false) => {
    if (!meter) return;

    if (isCriticalSetting(setting.obisCode) && !skipConfirm) {
      setConfirmAction({ setting, action: 'write' });
      setConfirmDialog(true);
      return;
    }

    setWriting(true);
    try {
      const response = await axios.post('/dlms/write', {
        meterId: meter._id,
        obisCode: setting.obisCode,
        value: setting.newValue,
      });

      if (response.data.success) {
        // Update the setting to mark as written
        const updated = new Map(settingValues);
        updated.set(setting.obisCode, {
          ...setting,
          currentValue: setting.newValue,
          modified: false,
          timestamp: new Date(),
        });
        setSettingValues(updated);
        toast.success(`${setting.name} updated successfully`);
      } else {
        toast.error(response.data.message || 'Failed to write setting');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to write ${setting.name}`);
    } finally {
      setWriting(false);
    }
  };

  const writeAllModifiedSettings = async () => {
    if (!meter) return;

    const modifiedSettings = Array.from(settingValues.values()).filter(s => s.modified);

    if (modifiedSettings.length === 0) {
      toast.error('No settings have been modified');
      return;
    }

    // Check if any critical settings are modified
    const hasCritical = modifiedSettings.some(s => isCriticalSetting(s.obisCode));
    if (hasCritical) {
      setConfirmAction({ setting: modifiedSettings[0], action: 'writeAll' });
      setConfirmDialog(true);
      return;
    }

    await performWriteAll(modifiedSettings);
  };

  const performWriteAll = async (settings: SettingValue[]) => {
    setWriting(true);
    let successCount = 0;
    let failCount = 0;

    for (const setting of settings) {
      try {
        const response = await axios.post('/dlms/write', {
          meterId: meter!._id,
          obisCode: setting.obisCode,
          value: setting.newValue,
        });

        if (response.data.success) {
          // Update the setting
          const updated = new Map(settingValues);
          updated.set(setting.obisCode, {
            ...setting,
            currentValue: setting.newValue,
            modified: false,
            timestamp: new Date(),
          });
          setSettingValues(updated);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to write ${setting.obisCode}:`, error);
        failCount++;
      }
    }

    setWriting(false);

    if (successCount > 0) {
      toast.success(`Successfully wrote ${successCount} setting(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to write ${failCount} setting(s)`);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmDialog(false);

    if (confirmAction.action === 'write') {
      await writeSingleSetting(confirmAction.setting, true);
    } else if (confirmAction.action === 'writeAll') {
      const modifiedSettings = Array.from(settingValues.values()).filter(s => s.modified);
      await performWriteAll(modifiedSettings);
    }

    setConfirmAction(null);
  };

  const resetValue = (obisCode: string) => {
    const current = settingValues.get(obisCode);
    if (!current) return;

    const updated = new Map(settingValues);
    updated.set(obisCode, {
      ...current,
      newValue: current.currentValue,
      modified: false,
    });
    setSettingValues(updated);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  const modifiedCount = Array.from(settingValues.values()).filter(s => s.modified).length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
        Meter Settings & Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Customer Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Meter Information
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
                        Meter Type:
                      </Typography>
                      <Typography variant="body2">
                        {meter.brand} {meter.model}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Area:
                      </Typography>
                      <Typography variant="body2">
                        {meter.area?.name || 'N/A'}
                      </Typography>
                    </Box>

                    {meter.customer && (
                      <>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Customer:
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

                    <Chip
                      label={meter.status.toUpperCase()}
                      color={meter.status === 'online' ? 'success' : 'error'}
                      size="small"
                    />

                    <Divider />

                    {modifiedCount > 0 && (
                      <Alert severity="warning" icon={<WarningIcon />}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {modifiedCount} setting(s) modified
                        </Typography>
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={writing ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={writeAllModifiedSettings}
                      disabled={writing || modifiedCount === 0}
                      sx={{ mt: 1 }}
                    >
                      {writing ? 'Writing...' : `Write All (${modifiedCount})`}
                    </Button>
                  </>
                )}

                {!meter && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      Enter a meter number and click search to configure settings
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Settings Categories */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Configuration Categories
                </Typography>
                {meter && selectedCategory && (
                  <Chip
                    icon={<InfoIcon />}
                    label={`Category: ${selectedCategory}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              {!meter && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Please search and select a meter to enable configuration
                </Alert>
              )}

              {/* Category Buttons */}
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {writableCategories.map((category) => (
                  <Grid item xs={6} sm={4} md={3} key={category}>
                    <Button
                      fullWidth
                      variant={selectedCategory === category ? 'contained' : 'outlined'}
                      onClick={() => readCategorySettings(category)}
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

              {/* Settings Table */}
              {settingValues.size > 0 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Settings ({selectedCategory})
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => selectedCategory && readCategorySettings(selectedCategory as OBISCategory)}
                        variant="outlined"
                        disabled={reading}
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Parameter</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>OBIS Code</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Current Value</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>New Value</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.from(settingValues.values()).map((setting) => (
                          <TableRow
                            key={setting.obisCode}
                            sx={{
                              bgcolor: setting.modified ? 'warning.lighter' : 'transparent',
                            }}
                          >
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {setting.name}
                                </Typography>
                                {setting.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {setting.description}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {setting.obisCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatValue(setting.currentValue)}
                                {setting.unit && (
                                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    {setting.unit}
                                  </Typography>
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={setting.newValue}
                                onChange={(e) => handleValueChange(setting.obisCode, e.target.value)}
                                disabled={writing}
                                InputProps={{
                                  endAdornment: setting.unit ? (
                                    <InputAdornment position="end">
                                      <Typography variant="caption">{setting.unit}</Typography>
                                    </InputAdornment>
                                  ) : null,
                                }}
                                sx={{ minWidth: 150 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Write to meter">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => writeSingleSetting(setting)}
                                      disabled={!setting.modified || writing}
                                    >
                                      {isCriticalSetting(setting.obisCode) ? (
                                        <WarningIcon fontSize="small" />
                                      ) : (
                                        <SaveIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Reset to current value">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => resetValue(setting.obisCode)}
                                      disabled={!setting.modified || writing}
                                    >
                                      <RefreshIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" icon={<InfoIcon />}>
                      <Typography variant="caption">
                        {modifiedCount > 0
                          ? `${modifiedCount} setting(s) modified. Click individual Save buttons or "Write All" to apply changes.`
                          : 'Modify values and click Save to write to the meter. Critical settings will require confirmation.'}
                      </Typography>
                    </Alert>
                  </Box>
                </Box>
              )}

              {settingValues.size === 0 && meter && (
                <Alert severity="info">
                  Click a category button above to load writable settings for the meter
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Critical Setting Change
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction?.setting && (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  You are about to modify a critical setting:
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {confirmAction.setting.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    OBIS: {confirmAction.setting.obisCode}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Current: {formatValue(confirmAction.setting.currentValue)}
                  </Typography>
                  <Typography variant="body2">
                    New: {formatValue(confirmAction.setting.newValue)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="error">
                  This action may affect meter operation. Are you sure you want to proceed?
                </Typography>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="warning" variant="contained" autoFocus>
            Confirm & Write
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeterSettings;
