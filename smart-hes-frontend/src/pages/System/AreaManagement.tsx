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
  Add,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Area {
  _id: string;
  name: string;
  code: string;
  meterCount?: number;
}

export default function AreaManagement() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await axios.get('/areas');
      setAreas(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load areas');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (area?: Area) => {
    if (area) {
      setIsEdit(true);
      setSelectedArea(area);
      setFormData({ name: area.name, code: area.code });
    } else {
      setIsEdit(false);
      setSelectedArea(null);
      setFormData({ name: '', code: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEdit(false);
    setSelectedArea(null);
    setFormData({ name: '', code: '' });
  };

  const handleSubmit = async () => {
    try {
      if (isEdit && selectedArea) {
        await axios.put(`/areas/${selectedArea._id}`, formData);
        toast.success('Area updated successfully');
      } else {
        await axios.post('/areas', formData);
        toast.success('Area created successfully');
      }
      handleCloseDialog();
      fetchAreas();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (selectedArea) {
      try {
        await axios.delete(`/areas/${selectedArea._id}`);
        toast.success('Area deleted successfully');
        setDeleteDialog(false);
        fetchAreas();
      } catch (err) {
        toast.error('Failed to delete area');
      }
    }
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Area Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
          }}
        >
          Add Area
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search areas by name or code..."
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
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Area Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Area Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Number of Meters</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAreas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((area) => (
                <TableRow key={area._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{area.code}</TableCell>
                  <TableCell>{area.name}</TableCell>
                  <TableCell>{area.meterCount || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(area)}
                        sx={{ color: '#FFA726' }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedArea(area);
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
          count={filteredAreas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Area' : 'Create New Area'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Area Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Area Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
            }}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete area "{selectedArea?.name}"? This action cannot be undone.
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
