import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface FirmwareUpgrade {
  _id: string;
  meter: {
    _id: string;
    meterNumber: string;
    brand: string;
    model: string;
  };
  firmware: {
    currentVersion: string;
    targetVersion: string;
    fileName: string;
    fileSize: number;
    checksum: string;
  };
  status: 'pending' | 'preparing' | 'transferring' | 'verifying' | 'installing' | 'activating' | 'completed' | 'failed' | 'rolled_back';
  progress: {
    stage: string;
    percentage: number;
    bytesTransferred: number;
    totalBytes: number;
    estimatedTimeRemaining?: number;
  };
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  metadata?: any;
  createdAt: string;
}

interface Meter {
  _id: string;
  meterNumber: string;
  brand: string;
  model: string;
  firmware: string;
}

const FirmwareManagement: React.FC = () => {
  const [upgrades, setUpgrades] = useState<FirmwareUpgrade[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<FirmwareUpgrade | null>(null);

  // Upload form state
  const [selectedMeter, setSelectedMeter] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);

  const fetchUpgrades = async () => {
    setLoading(true);
    try {
      // Note: This endpoint may not exist yet
      const response = await axios.get('/firmware');
      setUpgrades(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to fetch firmware upgrades');
      }
      setUpgrades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeters = async () => {
    try {
      const response = await axios.get('/meters', { params: { limit: 1000 } });
      setMeters(response.data.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch meters');
    }
  };

  useEffect(() => {
    fetchUpgrades();
    fetchMeters();
  }, []);

  const handleUploadFirmware = async () => {
    if (!selectedMeter || !targetVersion || !firmwareFile) {
      toast.error('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('meterId', selectedMeter);
    formData.append('targetVersion', targetVersion);
    formData.append('firmware', firmwareFile);

    try {
      await axios.post('/firmware', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Firmware upgrade initiated');
      setUploadDialogOpen(false);
      fetchUpgrades();
      // Reset form
      setSelectedMeter('');
      setTargetVersion('');
      setFirmwareFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate firmware upgrade');
    }
  };

  const handleCancelUpgrade = async (upgradeId: string) => {
    try {
      await axios.post(`/firmware/${upgradeId}/cancel`);
      toast.success('Firmware upgrade cancelled');
      fetchUpgrades();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel upgrade');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'default',
      preparing: 'info',
      transferring: 'primary',
      verifying: 'secondary',
      installing: 'warning',
      activating: 'warning',
      completed: 'success',
      failed: 'error',
      rolled_back: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'failed':
      case 'rolled_back':
        return <ErrorIcon />;
      case 'pending':
        return <PendingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStepFromStatus = (status: string): number => {
    const steps = ['pending', 'preparing', 'transferring', 'verifying', 'installing', 'activating', 'completed'];
    return steps.indexOf(status);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <CloudUpload sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Firmware Upgrade Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and monitor firmware upgrades across all meters
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUpgrades}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            New Upgrade
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Total Upgrades
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {upgrades.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                In Progress
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {upgrades.filter(u =>
                  ['preparing', 'transferring', 'verifying', 'installing', 'activating'].includes(u.status)
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Completed
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {upgrades.filter(u => u.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                Failed
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {upgrades.filter(u => u.status === 'failed' || u.status === 'rolled_back').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Upgrades */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Active Firmware Upgrades
          </Typography>
          {upgrades.filter(u =>
            ['preparing', 'transferring', 'verifying', 'installing', 'activating'].includes(u.status)
          ).length === 0 ? (
            <Alert severity="info">No active firmware upgrades at the moment</Alert>
          ) : (
            upgrades
              .filter(u =>
                ['preparing', 'transferring', 'verifying', 'installing', 'activating'].includes(u.status)
              )
              .map((upgrade) => (
                <Card key={upgrade._id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {upgrade.meter?.meterNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {upgrade.meter?.brand || 'N/A'} {upgrade.meter?.model || ''}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {upgrade.firmware.currentVersion} → {upgrade.firmware.targetVersion}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2">{upgrade.progress.stage}</Typography>
                          <Chip
                            label={`${upgrade.progress.percentage}%`}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={upgrade.progress.percentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatBytes(upgrade.progress.bytesTransferred)} /{' '}
                            {formatBytes(upgrade.progress.totalBytes)}
                          </Typography>
                          {upgrade.progress.estimatedTimeRemaining && (
                            <Typography variant="caption" color="text.secondary">
                              ETA: {formatTime(upgrade.progress.estimatedTimeRemaining)}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
          )}
        </CardContent>
      </Card>

      {/* All Upgrades Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Upgrade History
          </Typography>
          {upgrades.length === 0 ? (
            <Alert severity="info">No firmware upgrades found. Start a new upgrade to begin.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Meter</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Firmware</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Progress</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Started</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Completed</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upgrades.map((upgrade) => (
                    <TableRow key={upgrade._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {upgrade.meter?.meterNumber || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {upgrade.meter?.brand || 'N/A'} {upgrade.meter?.model || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {upgrade.firmware.currentVersion} → {upgrade.firmware.targetVersion}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatBytes(upgrade.firmware.fileSize)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(upgrade.status)}
                          label={upgrade.status.toUpperCase()}
                          color={getStatusColor(upgrade.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {['pending', 'completed', 'failed', 'rolled_back'].includes(upgrade.status) ? (
                          <Typography variant="caption">-</Typography>
                        ) : (
                          <Box sx={{ width: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={upgrade.progress.percentage}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {upgrade.progress.percentage}%
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {upgrade.startedAt
                          ? format(new Date(upgrade.startedAt), 'PPp')
                          : 'Not started'}
                      </TableCell>
                      <TableCell>
                        {upgrade.completedAt
                          ? format(new Date(upgrade.completedAt), 'PPp')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUpgrade(upgrade);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          {!['completed', 'failed', 'rolled_back'].includes(upgrade.status) && (
                            <Tooltip title="Cancel Upgrade">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelUpgrade(upgrade._id)}
                              >
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Initiate Firmware Upgrade</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Meter</InputLabel>
              <Select
                value={selectedMeter}
                label="Select Meter"
                onChange={(e) => setSelectedMeter(e.target.value)}
              >
                {meters.map((meter) => (
                  <MenuItem key={meter._id} value={meter._id}>
                    {meter.meterNumber} ({meter.brand} {meter.model}) - v{meter.firmware}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Target Firmware Version"
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              placeholder="e.g., v3.0.0"
            />
            <Box>
              <input
                accept=".bin,.hex,.fw"
                style={{ display: 'none' }}
                id="firmware-file"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFirmwareFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="firmware-file">
                <Button variant="outlined" component="span" fullWidth startIcon={<UploadIcon />}>
                  {firmwareFile ? firmwareFile.name : 'Select Firmware File'}
                </Button>
              </label>
              {firmwareFile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Size: {formatBytes(firmwareFile.size)}
                </Typography>
              )}
            </Box>
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Warning:</strong> Firmware upgrade will temporarily disconnect the meter.
                Ensure the meter has stable power supply.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadFirmware}
            disabled={!selectedMeter || !targetVersion || !firmwareFile}
          >
            Start Upgrade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedUpgrade && (
          <>
            <DialogTitle>
              Firmware Upgrade Details - {selectedUpgrade.meter?.meterNumber || 'N/A'}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Stepper activeStep={getStepFromStatus(selectedUpgrade.status)}>
                    <Step>
                      <StepLabel>Pending</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Preparing</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Transferring</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Verifying</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Installing</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Activating</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Completed</StepLabel>
                    </Step>
                  </Stepper>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Meter
                  </Typography>
                  <Typography variant="body1">
                    {selectedUpgrade.meter.meterNumber} ({selectedUpgrade.meter.brand}{' '}
                    {selectedUpgrade.meter.model})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedUpgrade.status)}
                    label={selectedUpgrade.status.toUpperCase()}
                    color={getStatusColor(selectedUpgrade.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Version
                  </Typography>
                  <Typography variant="body1">{selectedUpgrade.firmware.currentVersion}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Target Version
                  </Typography>
                  <Typography variant="body1">{selectedUpgrade.firmware.targetVersion}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Upgrade Logs
                  </Typography>
                  <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {selectedUpgrade.logs.length === 0 ? (
                        <ListItem>
                          <ListItemText secondary="No logs available" />
                        </ListItem>
                      ) : (
                        selectedUpgrade.logs.map((log, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={log.message}
                              secondary={format(new Date(log.timestamp), 'PPpp')}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: log.level === 'error' ? 'error' : 'textPrimary',
                              }}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FirmwareManagement;
