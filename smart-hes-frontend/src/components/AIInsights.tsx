import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert as MuiAlert,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Security,
  Savings,
  Build,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Refresh,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AIInsight {
  category: 'efficiency' | 'cost_saving' | 'maintenance' | 'security' | 'performance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions?: string[];
}

const categoryIcons: Record<string, React.ReactElement> = {
  efficiency: <TrendingUp />,
  cost_saving: <Savings />,
  maintenance: <Build />,
  security: <Security />,
  performance: <Psychology />,
};

const impactColors: Record<string, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get('ai/insights');
      setInsights(response.data.data || []);
    } catch (error: any) {
      toast.error('Failed to load AI insights');
      console.error(error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            AI is analyzing your system...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Insights
              </Typography>
            </Box>
            <IconButton onClick={fetchInsights} size="small">
              <Refresh />
            </IconButton>
          </Box>
          <MuiAlert severity="success">
            <Typography variant="body2">
              System is operating optimally. No AI-generated recommendations at this time.
            </Typography>
          </MuiAlert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Insights & Recommendations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${insights.length} Insight${insights.length > 1 ? 's' : ''}`}
              color="primary"
              size="small"
            />
            <IconButton onClick={fetchInsights} size="small">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        <List sx={{ p: 0 }}>
          {insights.map((insight, index) => (
            <Box key={index}>
              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => handleExpand(index)}
              >
                <ListItemIcon>{categoryIcons[insight.category]}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {insight.title}
                      </Typography>
                      <Chip
                        label={insight.impact.toUpperCase()}
                        color={impactColors[insight.impact]}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      {insight.actionable && (
                        <Chip
                          label="Actionable"
                          color="info"
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {insight.description}
                    </Typography>
                  }
                />
                <IconButton edge="end">
                  {expandedIndex === index ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </ListItem>

              <Collapse in={expandedIndex === index} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                  {insight.actions && insight.actions.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Recommended Actions:
                      </Typography>
                      <List dense>
                        {insight.actions.map((action, actionIndex) => (
                          <ListItem key={actionIndex} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircle color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2">{action}</Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default AIInsights;
