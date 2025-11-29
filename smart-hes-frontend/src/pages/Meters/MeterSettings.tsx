import React, { useState } from 'react';
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
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import MeterAutocomplete from '../../components/MeterAutocomplete';

interface ObisParameter {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  dataType?: string;
  accessRight?: string;
  currentValue?: any;
  newValue?: string;
}

interface ObisGroup {
  name: string;
  items: ObisParameter[];
}

export default function MeterSettings() {
  const [meterIdOrNumber, setMeterIdOrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [writeableGroups, setWriteableGroups] = useState<ObisGroup[]>([]);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(0);
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});
  const [newValues, setNewValues] = useState<Record<string, string>>({});

  // Step 1: Fetch writeable parameters
  const fetchWriteableParameters = async () => {
    if (!meterIdOrNumber) return toast.error('Enter meter ID or number');
    setLoading(true);
    try {
      const resp = await axios.get(`/meters/${encodeURIComponent(meterIdOrNumber)}/writeable-parameters`);
      const { writeableParameters } = resp.data.data;

      setWriteableGroups(writeableParameters || []);
      setSelectedGroupIdx(0);
      setParameterValues({});
      setNewValues({});

      toast.success(`Found ${resp.data.data.totalCount} writeable parameters`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch writeable parameters');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Read current values from meter
  const readMeterValues = async () => {
    if (!meterIdOrNumber) return toast.error('Enter meter ID or number');
    if (writeableGroups.length === 0) {
      return toast.error('Fetch writeable parameters first');
    }

    setLoading(true);
    try {
      // Get all OBIS codes from writeable parameters
      const allCodes = writeableGroups.flatMap(group => group.items.map(item => item.code));

      const resp = await axios.post(`/meters/${encodeURIComponent(meterIdOrNumber)}/read-current-values`, {
        obisCodes: allCodes
      });

      const { readings } = resp.data.data;

      // Map readings to parameter values
      const values: Record<string, any> = {};
      readings?.forEach((reading: any) => {
        values[reading.obisCode] = reading.actualValue !== undefined ? reading.actualValue : reading.value;
      });

      setParameterValues(values);
      toast.success('Meter values read successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to read meter values');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Write value to meter
  const writeParameter = async (code: string, value: string) => {
    if (!meterIdOrNumber) return toast.error('Enter meter ID or number');
    if (!value || value.trim() === '') {
      return toast.error('Enter a value to write');
    }

    setLoading(true);
    try {
      // Try to parse value as number if it looks like a number
      let parsedValue: any = value;
      if (!isNaN(Number(value))) {
        parsedValue = Number(value);
      }

      await axios.post(`/meters/${encodeURIComponent(meterIdOrNumber)}/write-obis`, {
        obisCode: code,
        value: parsedValue
      });

      toast.success(`Parameter ${code} written successfully`);

      // Clear the new value after successful write
      setNewValues(prev => {
        const updated = { ...prev };
        delete updated[code];
        return updated;
      });

      // Re-read the meter to get updated value
      setTimeout(() => {
        readMeterValues();
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to write parameter');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (idx: number) => {
    setSelectedGroupIdx(idx);
  };

  const handleValueChange = (code: string, value: string) => {
    setNewValues(prev => ({
      ...prev,
      [code]: value
    }));
  };

  const currentGroup = writeableGroups[selectedGroupIdx];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Meter Settings - Write Parameters
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <MeterAutocomplete
            value={meterIdOrNumber}
            onChange={setMeterIdOrNumber}
            label="Meter Number"
            placeholder="Type to search for meters..."
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={fetchWriteableParameters}
            disabled={loading}
          >
            1. Fetch Writeable Parameters
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={readMeterValues}
            disabled={loading || writeableGroups.length === 0}
          >
            2. Read Current Values
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>

      {writeableGroups.length > 0 && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Workflow:</strong> 1) Fetch writeable parameters → 2) Read current values from meter → 3) Enter new values → 4) Write to meter
          </Alert>

          {/* Group Selection */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Parameter Groups
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {writeableGroups.map((group, idx) => (
                <Chip
                  key={idx}
                  label={`${group.name} (${group.items.length})`}
                  onClick={() => handleGroupSelect(idx)}
                  color={selectedGroupIdx === idx ? 'primary' : 'default'}
                  variant={selectedGroupIdx === idx ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Paper>

          {/* Parameters Table */}
          {currentGroup && (
            <Paper sx={{ p: 2, overflowX: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {currentGroup.name} - Writeable Parameters
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>OBIS Code</strong></TableCell>
                    <TableCell><strong>Parameter Name</strong></TableCell>
                    <TableCell><strong>Current Value</strong></TableCell>
                    <TableCell><strong>New Value</strong></TableCell>
                    <TableCell><strong>Unit</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentGroup.items.map((param) => {
                    const currentValue = parameterValues[param.code];
                    const newValue = newValues[param.code] || '';
                    const hasCurrentValue = currentValue !== undefined && currentValue !== null;

                    return (
                      <TableRow key={param.code}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {param.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {param.name}
                          </Typography>
                          {param.description && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              {param.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasCurrentValue ? (
                            <Chip
                              label={currentValue}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Not read yet
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={newValue}
                            onChange={(e) => handleValueChange(param.code, e.target.value)}
                            placeholder={hasCurrentValue ? String(currentValue) : 'Enter value'}
                            sx={{ minWidth: 150 }}
                            InputProps={{
                              endAdornment: param.unit && (
                                <InputAdornment position="end">
                                  <Typography variant="caption">{param.unit}</Typography>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{param.unit || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            disabled={loading || !newValue || newValue.trim() === ''}
                            onClick={() => writeParameter(param.code, newValue)}
                          >
                            Write
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {writeableGroups.length === 0 && !loading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Enter a meter ID/number and click "Fetch Writeable Parameters" to begin
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
