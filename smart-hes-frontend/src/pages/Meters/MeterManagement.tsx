import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Visibility,
  Add,
  Download,
  FilterList,
  WifiTethering,
  WifiTetheringOff,
  Warning,
  CheckCircle,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CSVLink } from 'react-csv';

const meterTypes = ['single-phase', 'three-phase', 'prepaid', 'postpaid'];

const METER_PATTERNS: Record<string, { regex: RegExp; hint: string }> = {
  hexing: { regex: /^145\d{7,}$/, hint: 'Hexing meters start with "145" (e.g., 145xxxxxxxx)' },
  hexcell: { regex: /^46\d{7,}$/, hint: 'Hexcell meters start with "46" (e.g., 46xxxxxxxxx)' },
};

interface Meter {
  _id: string;
  meterNumber: string;
  concentratorId: string;
  meterType: string;
  brand: string;
  model: string;
  area: any;
  customer?: any;
  status: string;
  lastSeen?: string;
  currentReading: {
    totalEnergy: number;
    voltage: number;
    current: number;
    power: number;
  };
  relayStatus: string;
  tamperStatus: {
    coverOpen: boolean;
    magneticTamper: boolean;
    reverseFlow: boolean;
    neutralDisturbance: boolean;
  };
}

const MeterManagement: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Add Meter Dialog States
  const [addDialog, setAddDialog] = useState(false);
  const [newMeterNumber, setNewMeterNumber] = useState('');
  const [newMeterType, setNewMeterType] = useState('single-phase');
  const [newBrand, setNewBrand] = useState('hexing');
  const [newModel, setNewModel] = useState('');
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newPort, setNewPort] = useState('');
  const [newArea, setNewArea] = useState('');
  const [meterNumberError, setMeterNumberError] = useState('');

  const fetchMeters = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (areaFilter !== 'all') params.area = areaFilter;
      
      const response = await axios.get('/meters', { params });
      setMeters(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch meters');
    }
  }, [statusFilter, areaFilter]);

  const fetchAreas = async () => {
    try {
      const response = await axios.get('/areas');
      setAreas(response.data.data);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (meter: Meter) => {
    setSelectedMeter(meter);
    setDetailsDialog(true);
  };

  const handleDelete = async () => {
    if (selectedMeter) {
      try {
        await axios.delete(`/meters/${selectedMeter._id}`);
        toast.success('Meter deleted successfully');
        fetchMeters();
        setDeleteDialog(false);
      } catch (error) {
        toast.error('Failed to delete meter');
      }
    }
  };

  // Add Meter Dialog Handlers
  const validateMeterNumber = (number: string, selectedBrand: string) => {
    if (!number) {
      setMeterNumberError('');
      return true;
    }
    const pattern = METER_PATTERNS[selectedBrand.toLowerCase()];
    if (!pattern.regex.test(number)) {
      setMeterNumberError(`Invalid meter number. ${pattern.hint}`);
      return false;
    }
    setMeterNumberError('');
    return true;
  };

  const handleMeterNumberChange = (value: string) => {
    setNewMeterNumber(value);
    validateMeterNumber(value, newBrand);
  };

  const handleBrandChange = (brand: string) => {
    setNewBrand(brand);
    if (newMeterNumber) {
      validateMeterNumber(newMeterNumber, brand);
    }
  };

  const resetAddMeterForm = () => {
    setNewMeterNumber('');
    setNewMeterType('single-phase');
    setNewBrand('hexing');
    setNewModel('');
    setNewIpAddress('');
    setNewPort('');
    setNewArea('');
    setMeterNumberError('');
  };

  const handleOpenAddDialog = () => {
    resetAddMeterForm();
    setAddDialog(true);
  };

  const handleCreateMeter = async () => {
    // Validation
    if (!newMeterNumber) {
      toast.error('Meter number is required');
      return;
    }
    if (!validateMeterNumber(newMeterNumber, newBrand)) {
      toast.error(meterNumberError);
      return;
    }
    if (!newModel) {
      toast.error('Model is required');
      return;
    }
    if (!newArea) {
      toast.error('Area is required');
      return;
    }

    try {
      await axios.post('/meters', {
        meterNumber: newMeterNumber,
        meterType: newMeterType,
        brand: newBrand.toLowerCase(),
        model: newModel,
        area: newArea,
        ipAddress: newIpAddress || undefined,
        port: newPort ? Number(newPort) : undefined
      });
      toast.success('Meter created successfully');
      setAddDialog(false);
      resetAddMeterForm();
      fetchMeters();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create meter';
      toast.error(errorMessage);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      online: { color: 'success' as const, icon: <WifiTethering fontSize="small" /> },
      offline: { color: 'error' as const, icon: <WifiTetheringOff fontSize="small" /> },
      active: { color: 'info' as const, icon: <CheckCircle fontSize="small" /> },
      warehouse: { color: 'default' as const, icon: null },
      faulty: { color: 'warning' as const, icon: <Warning fontSize="small" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

    return (
      <Chip
        label={status.toUpperCase()}
        color={config.color}
        size="small"
        icon={config.icon || undefined}
      />
    );
  };

  const getTamperIndicator = (tamperStatus: any) => {
    const hasTamper = 
      tamperStatus.coverOpen || 
      tamperStatus.magneticTamper || 
      tamperStatus.reverseFlow || 
      tamperStatus.neutralDisturbance;

    if (hasTamper) {
      return (
        <Tooltip title="Tamper detected">
          <Warning color="error" fontSize="small" />
        </Tooltip>
      );
    }
    return null;
  };

  const filteredMeters = meters.filter(meter =>
    meter.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meter.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meter.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const csvData = filteredMeters.map(meter => ({
    'Meter Number': meter.meterNumber,
    'Brand': meter.brand,
    'Model': meter.model,
    'Type': meter.meterType,
    'Status': meter.status,
    'Area': meter.area?.name || 'N/A',
    'Customer': meter.customer?.customerName || 'Unassigned',
    'Last Seen': meter.lastSeen ? new Date(meter.lastSeen).toLocaleString() : 'Never',
    'Total Energy (kWh)': meter.currentReading.totalEnergy,
    'Voltage (V)': meter.currentReading.voltage,
    'Current (A)': meter.currentReading.current,
    'Power (kW)': meter.currentReading.power,
    'Relay Status': meter.relayStatus,
  }));

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Meter Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAddDialog}
            sx={{
              background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
            }}
          >
            Add Meter
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/meters/import'}
          >
            Import CSV
          </Button>
          <CSVLink data={csvData} filename="meters_export.csv" style={{ textDecoration: 'none' }}>
            <Button variant="outlined" startIcon={<Download />}>
              Export CSV
            </Button>
          </CSVLink>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search meters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="warehouse">Warehouse</MenuItem>
                <MenuItem value="faulty">Faulty</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Area Filter</InputLabel>
              <Select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                label="Area Filter"
              >
                <MenuItem value="all">All Areas</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area._id} value={area._id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setAreaFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Meter Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Brand/Model</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Area</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Energy (kWh)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Last Seen</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tamper</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMeters
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((meter) => (
                <TableRow key={meter._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{meter.meterNumber}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{meter.brand}</Typography>
                      <Typography variant="caption" sx={{ color: '#8392AB' }}>
                        {meter.model}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={meter.meterType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{meter.area?.name || 'N/A'}</TableCell>
                  <TableCell>{meter.customer?.customerName || 'Unassigned'}</TableCell>
                  <TableCell>{getStatusChip(meter.status)}</TableCell>
                  <TableCell>{meter.currentReading.totalEnergy.toFixed(2)}</TableCell>
                  <TableCell>
                    {meter.lastSeen ? (
                      <Box>
                        <Typography variant="caption">
                          {new Date(meter.lastSeen).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" sx={{ color: '#8392AB' }}>
                          {new Date(meter.lastSeen).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {getTamperIndicator(meter.tamperStatus)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(meter)}
                        sx={{ color: '#49a3f1' }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => window.location.href = `/meters/edit/${meter._id}`}
                        sx={{ color: '#FFA726' }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedMeter(meter);
                          setDeleteDialog(true);
                        }}
                        sx={{ color: '#EC407A' }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredMeters.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Meter Details</DialogTitle>
        <DialogContent>
          {selectedMeter && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Meter Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedMeter.meterNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Status
                </Typography>
                <Box sx={{ mb: 2 }}>{getStatusChip(selectedMeter.status)}</Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Brand & Model
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedMeter.brand} - {selectedMeter.model}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Meter Type
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedMeter.meterType}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Area
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedMeter.area?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Concentrator ID
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedMeter.concentratorId || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Current Readings
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Total Energy
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedMeter.currentReading.totalEnergy.toFixed(2)} kWh
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Voltage
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedMeter.currentReading.voltage.toFixed(1)} V
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Current
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedMeter.currentReading.current.toFixed(2)} A
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" sx={{ color: '#8392AB' }}>
                  Power
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedMeter.currentReading.power.toFixed(2)} kW
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Tamper Status
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label="Cover"
                  color={selectedMeter.tamperStatus.coverOpen ? 'error' : 'success'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label="Magnetic"
                  color={selectedMeter.tamperStatus.magneticTamper ? 'error' : 'success'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label="Reverse Flow"
                  color={selectedMeter.tamperStatus.reverseFlow ? 'error' : 'success'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip
                  label="Neutral"
                  color={selectedMeter.tamperStatus.neutralDisturbance ? 'error' : 'success'}
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete meter {selectedMeter?.meterNumber}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Meter Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Add New Meter
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Alert icon={<InfoIcon />} severity="info">
                {METER_PATTERNS[newBrand.toLowerCase()].hint}
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meter Number"
                value={newMeterNumber}
                onChange={(e) => handleMeterNumberChange(e.target.value)}
                error={!!meterNumberError}
                helperText={meterNumberError}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Meter Type"
                value={newMeterType}
                onChange={(e) => setNewMeterType(e.target.value)}
              >
                {meterTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Brand"
                value={newBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <MenuItem value="hexing">Hexing</MenuItem>
                <MenuItem value="hexcell">Hexcell</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                required
                helperText="Model name is required"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IP Address (Optional)"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="e.g., 192.168.1.100"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Port (Optional)"
                value={newPort}
                onChange={(e) => setNewPort(e.target.value)}
                placeholder="e.g., 4059"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Area"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                required
                helperText="Area assignment is required"
              >
                <MenuItem value="">Select Area</MenuItem>
                {areas.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateMeter}
            variant="contained"
            sx={{
              background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
            }}
          >
            Create Meter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeterManagement;
