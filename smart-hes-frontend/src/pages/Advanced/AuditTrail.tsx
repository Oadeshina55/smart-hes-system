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
  Paper,
  Button,
  IconButton,
  Stack,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  PersonSearch,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AuditLog {
  _id: string;
  userId?: {
    _id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode: number;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: any;
  timestamp: string;
}

interface AuditStats {
  totalLogs: number;
  actionStats: Array<{ _id: string; count: number }>;
  resourceStats: Array<{ _id: string; count: number }>;
  userStats: Array<{ _id: string; username: string; count: number }>;
  recentActivity: AuditLog[];
}

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);

  // Filters
  const [filterResource, setFilterResource] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filterResource, filterAction, filterUser, startDate, endDate, searchTerm]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };

      if (filterResource) params.resource = filterResource;
      if (filterAction) params.action = filterAction;
      if (filterUser) params.userId = filterUser;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/audit', { params });

      setLogs(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get('/audit/stats/summary', { params });
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (filterResource) params.resource = filterResource;
      if (filterAction) params.action = filterAction;
      if (filterUser) params.userId = filterUser;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get('/audit/export/csv', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Audit logs exported successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialog(true);
  };

  const clearFilters = () => {
    setFilterResource('');
    setFilterAction('');
    setFilterUser('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setPage(1);
  };

  const getMethodColor = (method: string) => {
    const colors: any = {
      GET: 'info',
      POST: 'success',
      PUT: 'warning',
      PATCH: 'warning',
      DELETE: 'error',
    };
    return colors[method] || 'default';
  };

  const getActionColor = (action: string) => {
    const colors: any = {
      login: 'success',
      logout: 'default',
      create: 'success',
      update: 'warning',
      delete: 'error',
      view: 'info',
      export: 'primary',
    };
    return colors[action] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Audit Trail
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System activity logs and security monitoring
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TimelineIcon sx={{ fontSize: 40, color: 'white' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Total Logs
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                      {stats.totalLogs.toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <PersonSearch sx={{ fontSize: 40, color: 'white' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Active Users
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                      {stats.userStats.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FilterIcon sx={{ fontSize: 40, color: 'white' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Resources
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                      {stats.resourceStats.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Actions
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                      {stats.actionStats.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Resource</InputLabel>
                <Select
                  value={filterResource}
                  onChange={(e) => setFilterResource(e.target.value)}
                  label="Resource"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="meters">Meters</MenuItem>
                  <MenuItem value="customers">Customers</MenuItem>
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="events">Events</MenuItem>
                  <MenuItem value="auth">Auth</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  label="Action"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                  <MenuItem value="create">Create</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="view">View</MenuItem>
                  <MenuItem value="export">Export</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Username, action, endpoint..."
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                sx={{ height: '40px' }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Audit Logs
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Alert severity="info">No audit logs found</Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Action</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Resource</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Method</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>IP Address</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="caption">
                            {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {log.userId?.username || log.username || 'System'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action.toUpperCase()}
                            size="small"
                            color={getActionColor(log.action) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.resource}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.method}
                            size="small"
                            color={getMethodColor(log.method) as any}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.statusCode}
                            size="small"
                            color={log.statusCode < 400 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{log.ipAddress || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(log)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedLog && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <SecurityIcon />
                <Typography variant="h6">Audit Log Details</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.userId?.username || selectedLog.username || 'System'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Action
                  </Typography>
                  <Chip label={selectedLog.action.toUpperCase()} color={getActionColor(selectedLog.action) as any} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource
                  </Typography>
                  <Typography variant="body1">{selectedLog.resource}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Method
                  </Typography>
                  <Chip label={selectedLog.method} color={getMethodColor(selectedLog.method) as any} variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status Code
                  </Typography>
                  <Chip
                    label={selectedLog.statusCode}
                    color={selectedLog.statusCode < 400 ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Endpoint
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                    {selectedLog.endpoint}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1">{selectedLog.ipAddress || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource ID
                  </Typography>
                  <Typography variant="body1">{selectedLog.resourceId || 'N/A'}</Typography>
                </Grid>
                {selectedLog.changes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Changes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                {selectedLog.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Metadata
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AuditTrail;
