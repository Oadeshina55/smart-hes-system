import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
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
} from '@mui/material';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

interface ObisParameter {
  code: string;
  name: string;
  value?: string;
  unit?: string;
}

export default function MeterSettings() {
  const [meterIdOrNumber, setMeterIdOrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [writeToMeter, setWriteToMeter] = useState(false);
  const [settings, setSettings] = useState<ObisParameter[]>([]);
  const [editingParameter, setEditingParameter] = useState<ObisParameter | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editValue, setEditValue] = useState('');
  const { socket } = useSocket();

  const fetchSettings = async () => {
    if (!meterIdOrNumber) return toast.error('Enter meter id or number');
    setLoading(true);
    try {
      const resp = await axios.get(`/meters/${encodeURIComponent(meterIdOrNumber)}/settings`);
      const { obisConfiguration = {} } = resp.data.data;
      
      // Convert to display format
      const settingsArray: ObisParameter[] = Object.entries(obisConfiguration).map(([code, value]: any) => ({
        code,
        name: code,
        value: String(value),
      }));
      
      setSettings(settingsArray);
      toast.success('Settings fetched');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (param: ObisParameter) => {
    setEditingParameter(param);
    setEditValue(param.value || '');
    setEditDialog(true);
  };

  const saveParameterEdit = () => {
    if (!editingParameter) return;
    setSettings(
      settings.map(p =>
        p.code === editingParameter.code
          ? { ...p, value: editValue }
          : p
      )
    );
    setEditDialog(false);
    setEditingParameter(null);
  };

  const saveAllSettings = async () => {
    if (!meterIdOrNumber) return toast.error('Enter meter id or number');
    
    setLoading(true);
    try {
      // Convert settings array back to object format
      const obisConfiguration: any = {};
      settings.forEach(s => {
        obisConfiguration[s.code] = s.value;
      });

      const resp = await axios.post(`/meters/${encodeURIComponent(meterIdOrNumber)}/settings`, {
        settings: obisConfiguration,
        metadata: {},
        writeToMeter: writeToMeter,
      });

      toast.success(resp.data?.message || 'Settings saved');
      
      if (writeToMeter && socket) {
        toast('Write command sent to meter');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addNewParameter = () => {
    setSettings([
      ...settings,
      { code: '', name: '', value: '' }
    ]);
  };

  const deleteParameter = (code: string) => {
    setSettings(settings.filter(s => s.code !== code));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Meter Settings & OBIS Configuration</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Meter ID or Meter Number"
          value={meterIdOrNumber}
          onChange={(e) => setMeterIdOrNumber(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" onClick={fetchSettings} disabled={loading}>
            Fetch Settings
          </Button>
          <Button variant="outlined" color="success" onClick={saveAllSettings} disabled={loading || settings.length === 0}>
            Save Settings
          </Button>
          <FormControlLabel
            control={<Switch checked={writeToMeter} onChange={(e) => setWriteToMeter(e.target.checked)} />}
            label="Write to Meter"
          />
        </Box>

        {writeToMeter && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Write to Meter is enabled. Settings will be sent to the meter device.
          </Alert>
        )}
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {settings.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">OBIS Parameters</Typography>
            <Button variant="outlined" size="small" onClick={addNewParameter}>
              Add Parameter
            </Button>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>OBIS Code</strong></TableCell>
                <TableCell><strong>Parameter Name</strong></TableCell>
                <TableCell><strong>Value</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.map((param, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={param.code}
                      onChange={(e) => {
                        const updated = [...settings];
                        updated[idx].code = e.target.value;
                        setSettings(updated);
                      }}
                      placeholder="e.g., 1.0.1.8.0.255"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={param.name}
                      onChange={(e) => {
                        const updated = [...settings];
                        updated[idx].name = e.target.value;
                        setSettings(updated);
                      }}
                      placeholder="Parameter name"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{ cursor: 'pointer', p: 1, border: '1px solid #ccc', borderRadius: 1 }}
                      onClick={() => openEditDialog(param)}
                    >
                      {param.value || '(empty)'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openEditDialog(param)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => deleteParameter(param.code)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Edit Parameter Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Edit Parameter Value</DialogTitle>
        <DialogContent sx={{ minWidth: 400, mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Parameter: {editingParameter?.code || editingParameter?.name}
          </Typography>
          <TextField
            fullWidth
            label="Value"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            multiline
            rows={4}
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

