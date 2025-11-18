import React, { useState, useEffect } from 'react';
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
  Typography,
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Download,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CSVLink } from 'react-csv';

interface Sim {
  _id: string;
  simNumber: string;
  iccid: string;
  provider: string;
  status: string;
  assignedMeter?: string;
}

export default function SimManagement() {
  const [sims, setSims] = useState<Sim[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedSim, setSelectedSim] = useState<Sim | null>(null);
  const [formData, setFormData] = useState({
    simNumber: '',
    iccid: '',
    provider: '',
  });

  useEffect(() => {
    fetchSims();
  }, []);

  const fetchSims = async () => {
    try {
      const res = await axios.get('/sims');
      setSims(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load SIMs');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreate = async () => {
    try {
      await axios.post('/sims', formData);
      toast.success('SIM created successfully');
      setFormData({ simNumber: '', iccid: '', provider: '' });
      fetchSims();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create SIM');
    }
  };

  const handleEdit = (sim: Sim) => {
    setSelectedSim(sim);
    setFormData({
      simNumber: sim.simNumber,
      iccid: sim.iccid,
      provider: sim.provider,
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    if (selectedSim) {
      try {
        await axios.put(`/sims/${selectedSim._id}`, formData);
        toast.success('SIM updated successfully');
        setEditDialog(false);
        fetchSims();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to update SIM');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedSim) {
      try {
        await axios.delete(`/sims/${selectedSim._id}`);
        toast.success('SIM deleted successfully');
        setDeleteDialog(false);
        fetchSims();
      } catch (err) {
        toast.error('Failed to delete SIM');
      }
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: 'success' as const, label: 'ACTIVE' },
      inactive: { color: 'default' as const, label: 'INACTIVE' },
      assigned: { color: 'info' as const, label: 'ASSIGNED' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;

    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const filteredSims = sims.filter(
    (sim) =>
      sim.simNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.iccid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const csvData = filteredSims.map((sim) => ({
    'SIM Number': sim.simNumber,
    'ICCID': sim.iccid,
    'Provider': sim.provider,
    'Status': sim.status,
    'Assigned Meter': sim.assignedMeter || 'Unassigned',
  }));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767', mb: 3 }}>
          SIM Management
        </Typography>

        {/* Create Form */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Create New SIM
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="SIM Number"
                value={formData.simNumber}
                onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ICCID"
                value={formData.iccid}
                onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreate}
                sx={{
                  background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
                  height: '40px',
                }}
              >
                Create SIM
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Search and Export */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search SIMs by number, ICCID, or provider..."
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
            <Grid item xs={12} md={4}>
              <CSVLink data={csvData} filename="sims_export.csv" style={{ textDecoration: 'none' }}>
                <Button fullWidth variant="outlined" startIcon={<Download />}>
                  Export CSV
                </Button>
              </CSVLink>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>SIM Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>ICCID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Provider</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Assigned Meter</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSims
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((sim) => (
                <TableRow key={sim._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{sim.simNumber}</TableCell>
                  <TableCell>{sim.iccid}</TableCell>
                  <TableCell>{sim.provider}</TableCell>
                  <TableCell>{getStatusChip(sim.status)}</TableCell>
                  <TableCell>{sim.assignedMeter || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(sim)}
                        sx={{ color: '#FFA726' }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedSim(sim);
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSims.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit SIM</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SIM Number"
                value={formData.simNumber}
                onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ICCID"
                value={formData.iccid}
                onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{
              background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete SIM {selectedSim?.simNumber}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
