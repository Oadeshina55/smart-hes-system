import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  TableContainer,
  LinearProgress,
} from '@mui/material';
import {
  Upload,
  Download,
  CheckCircle,
  Error,
  Info,
  ArrowBack,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MeterImport() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        toast.success('CSV file selected');
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        toast.success('CSV file selected');
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a CSV file');

    setLoading(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await axios.post('/meters/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(res.data);
      toast.success(`Successfully imported ${res.data.successCount || 0} meters`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/meters');
  };

  const downloadTemplate = () => {
    const template = [
      ['meterNumber', 'concentratorId', 'meterType', 'brand', 'model', 'firmware', 'ipAddress', 'port', 'area', 'customer', 'simCard'],
      ['MET001', 'CONC001', 'Single Phase', 'Hexing', 'HXE310', '1.0.0', '192.168.1.100', '4059', 'AreaCode1', 'CUST001', 'SIM001'],
      ['MET002', 'CONC001', 'Three Phase', 'Hexcell', 'HCE410', '1.0.1', '192.168.1.101', '4059', 'AreaCode1', '', ''],
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'meter_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    toast.success('Template downloaded');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
          Import Meters from CSV
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleBackToList}
        >
          Back to Meters
        </Button>
      </Box>

      {!results ? (
        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Upload CSV File
              </Typography>

              {/* Drag & Drop Zone */}
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  border: `2px dashed ${dragActive ? '#1976d2' : '#ccc'}`,
                  borderRadius: 2,
                  p: 6,
                  textAlign: 'center',
                  backgroundColor: dragActive ? '#f0f7ff' : '#f9f9f9',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  mb: 3,
                }}
              >
                <Upload sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Drag and drop your CSV file here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  or
                </Typography>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="contained" component="span">
                    Browse Files
                  </Button>
                </label>
              </Box>

              {file && (
                <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
                  <Typography variant="body2">
                    <strong>File selected:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Typography>
                </Alert>
              )}

              {loading && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Uploading and processing...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
                  sx={{
                    background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
                  }}
                >
                  {loading ? 'Uploading...' : 'Upload & Import'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFile(null);
                    setResults(null);
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Instructions Section */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Instructions
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="1. Download Template"
                      secondary="Use our CSV template with the correct format"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="2. Fill Data"
                      secondary="Add meter information to the template"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="3. Upload File"
                      secondary="Upload the completed CSV file"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="4. Review Results"
                      secondary="Check import results and fix errors"
                    />
                  </ListItem>
                </List>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Download />}
                  onClick={downloadTemplate}
                  sx={{ mt: 2 }}
                >
                  Download Template
                </Button>
              </CardContent>
            </Card>

            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                <strong>Required Fields:</strong><br />
                • Meter Number (unique)<br />
                • Meter Type<br />
                • Brand & Model<br />
                <br />
                <strong>Optional Fields:</strong><br />
                • IP Address & Port (for DLMS)<br />
                • Area, Customer, SIM Card<br />
                • Firmware, Concentrator ID
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      ) : (
        <Box>
          {/* Results Summary */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, bgcolor: '#4caf50', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {results.successCount || 0}
                      </Typography>
                      <Typography variant="body2">Successful Imports</Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 60, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, bgcolor: '#f44336', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {results.failures?.length || 0}
                      </Typography>
                      <Typography variant="body2">Failed Imports</Typography>
                    </Box>
                    <Error sx={{ fontSize: 60, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, bgcolor: '#2196f3', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {results.total || 0}
                      </Typography>
                      <Typography variant="body2">Total Rows</Typography>
                    </Box>
                    <Info sx={{ fontSize: 60, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Overall Status Alert */}
          <Alert
            severity={results.successCount === results.total ? 'success' : 'warning'}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Import Results: {results.successCount} of {results.total} rows imported successfully
            </Typography>
            {results.failures && results.failures.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {results.failures.length} row(s) failed. Please review the errors below and try again.
              </Typography>
            )}
          </Alert>

          {/* Failed Rows Table */}
          {results.failures && results.failures.length > 0 && (
            <Paper sx={{ borderRadius: 3, mb: 3 }}>
              <Box sx={{ p: 3, bgcolor: '#fff3cd', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#856404' }}>
                  Failed Rows ({results.failures.length})
                </Typography>
                <Typography variant="body2" sx={{ color: '#856404', mt: 0.5 }}>
                  Review and fix the following errors before re-importing
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Row #</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Meter Number</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Brand</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Model</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.failures.map((failure: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip label={failure.index + 1} size="small" color="error" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {failure.row?.meterNumber || failure.row?.meter || '-'}
                        </TableCell>
                        <TableCell>{failure.row?.brand || '-'}</TableCell>
                        <TableCell>{failure.row?.model || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'error.main' }}>
                            {failure.error}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={handleBackToList}
              sx={{
                background: 'linear-gradient(195deg, #66BB6A 0%, #43A047 100%)',
              }}
            >
              View All Meters
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setResults(null);
                setFile(null);
              }}
            >
              Import Another File
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
