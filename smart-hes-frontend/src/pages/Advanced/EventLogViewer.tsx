import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Event {
  _id: string;
  meter: {
    _id: string;
    meterNumber: string;
    brand?: string;
    model?: string;
  };
  eventType: string;
  eventCode: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'communication' | 'power' | 'tamper' | 'billing' | 'configuration' | 'technical';
  description: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: {
    username: string;
  };
  acknowledgedAt?: string;
  metadata?: any;
  createdAt: string;
}

const EventLogViewer: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Detail dialog
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (acknowledgedFilter !== 'all') params.acknowledged = acknowledgedFilter === 'true';
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get('/events', { params });
      setEvents(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage, severityFilter, categoryFilter, acknowledgedFilter, startDate, endDate]);

  const handleSearch = () => {
    setPage(0);
    fetchEvents();
  };

  const handleAcknowledge = async (eventId: string) => {
    try {
      await axios.patch(`/events/${eventId}/acknowledge`);
      toast.success('Event acknowledged');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to acknowledge event');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Timestamp', 'Meter', 'Event Type', 'Severity', 'Category', 'Description', 'Acknowledged'].join(','),
      ...events.map(event =>
        [
          format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          event.meter?.meterNumber || 'N/A',
          event.eventType,
          event.severity,
          event.category,
          `"${event.description}"`,
          event.acknowledged ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    a.click();
    toast.success('Events exported');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'critical':
        return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      communication: 'primary',
      power: 'warning',
      tamper: 'error',
      billing: 'success',
      configuration: 'info',
      technical: 'secondary',
    };
    return colors[category] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Event Log Viewer
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={events.length === 0}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filters & Search</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Search (Meter, Event Type, Description)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={handleSearch}>
                          <SearchIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Severity</InputLabel>
                    <Select
                      value={severityFilter}
                      label="Severity"
                      onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="communication">Communication</MenuItem>
                      <MenuItem value="power">Power</MenuItem>
                      <MenuItem value="tamper">Tamper</MenuItem>
                      <MenuItem value="billing">Billing</MenuItem>
                      <MenuItem value="configuration">Configuration</MenuItem>
                      <MenuItem value="technical">Technical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={acknowledgedFilter}
                      label="Status"
                      onChange={(e) => setAcknowledgedFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="false">Unacknowledged</MenuItem>
                      <MenuItem value="true">Acknowledged</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Total Events
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Critical
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {events.filter(e => e.severity === 'critical').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Unacknowledged
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {events.filter(e => !e.acknowledged).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Tamper Events
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                {events.filter(e => e.category === 'tamper').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Timestamp</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Meter</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Event Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Severity</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info">No events found</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow
                    key={event._id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: event.acknowledged ? 'transparent' : 'rgba(255, 165, 0, 0.05)',
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {event.meter?.meterNumber || 'N/A'}
                        </Typography>
                        {event.meter?.brand && (
                          <Typography variant="caption" color="text.secondary">
                            {event.meter.brand} {event.meter.model}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {event.eventType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.eventCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getSeverityIcon(event.severity)}
                        label={event.severity.toUpperCase()}
                        color={getSeverityColor(event.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.category.toUpperCase()}
                        color={getCategoryColor(event.category) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {event.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {event.acknowledged ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Acknowledged"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip label="Pending" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {!event.acknowledged && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(event._id);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Event Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getSeverityIcon(selectedEvent.severity)}
                <Typography variant="h6">{selectedEvent.eventType}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Meter Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedEvent.meter?.meterNumber || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedEvent.timestamp), 'PPpp')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Severity
                  </Typography>
                  <Chip
                    icon={getSeverityIcon(selectedEvent.severity)}
                    label={selectedEvent.severity.toUpperCase()}
                    color={getSeverityColor(selectedEvent.severity) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip
                    label={selectedEvent.category.toUpperCase()}
                    color={getCategoryColor(selectedEvent.category) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{selectedEvent.description}</Typography>
                </Grid>
                {selectedEvent.acknowledged && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Acknowledged By
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent.acknowledgedBy?.username || 'Unknown'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Acknowledged At
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent.acknowledgedAt &&
                          format(new Date(selectedEvent.acknowledgedAt), 'PPpp')}
                      </Typography>
                    </Grid>
                  </>
                )}
                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Additional Information
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <pre style={{ margin: 0, fontSize: '12px' }}>
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {!selectedEvent.acknowledged && (
                <Button
                  onClick={() => {
                    handleAcknowledge(selectedEvent._id);
                    setDetailOpen(false);
                  }}
                  variant="contained"
                >
                  Acknowledge Event
                </Button>
              )}
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EventLogViewer;
