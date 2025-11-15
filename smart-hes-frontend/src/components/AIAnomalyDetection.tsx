import React, { useEffect, useState } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  BugReport,
  Refresh,
  TrendingUp,
  TrendingDown,
  Warning,
  Shield,
  SignalCellularConnectedNoInternet0Bar,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

interface Anomaly {
  meterId: string;
  type: 'consumption_spike' | 'consumption_drop' | 'unusual_pattern' | 'tamper_suspected' | 'communication_loss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  recommendation: string;
  detectedAt: Date;
}

const anomalyIcons: Record<string, React.ReactElement> = {
  consumption_spike: <TrendingUp />,
  consumption_drop: <TrendingDown />,
  unusual_pattern: <Warning />,
  tamper_suspected: <Shield />,
  communication_loss: <SignalCellularConnectedNoInternet0Bar />,
};

const severityColors: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export const AIAnomalyDetection: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnomalies();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnomalies, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ai/anomalies');
      setAnomalies(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load anomaly detection');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            AI is scanning for anomalies...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Anomaly Detection
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${anomalies.length} Detected`}
              color={anomalies.length > 0 ? 'error' : 'success'}
              size="small"
            />
            <IconButton onClick={fetchAnomalies} size="small">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {anomalies.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              bgcolor: 'success.light',
              borderRadius: 2,
              color: 'success.dark',
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              No anomalies detected
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              All systems are operating within normal parameters
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Detected</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {anomalies.map((anomaly, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {anomalyIcons[anomaly.type]}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {anomaly.type.replace(/_/g, ' ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={anomaly.severity.toUpperCase()}
                        color={severityColors[anomaly.severity]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={anomaly.description} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {anomaly.description}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(anomaly.confidence * 100).toFixed(0)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {moment(anomaly.detectedAt).fromNow()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={anomaly.recommendation} arrow>
                        <IconButton size="small" color="primary">
                          <Warning />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnomalyDetection;
