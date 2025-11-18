import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Grid,
	Paper,
	Card,
	CardContent,
	CardHeader,
	IconButton,
	Chip,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Button,
	LinearProgress,
	Divider,
	Tab,
	Tabs,
	Tooltip,
	CircularProgress,
} from '@mui/material';
import {
	Psychology as PsychologyIcon,
	Warning as WarningIcon,
	TrendingUp as TrendingUpIcon,
	Insights as InsightsIcon,
	Refresh as RefreshIcon,
	Download as DownloadIcon,
	FilterList as FilterListIcon,
	AutoAwesome as AutoAwesomeIcon,
	BubbleChart as BubbleChartIcon,
	Speed as SpeedIcon,
	Security as SecurityIcon,
	AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip as ChartTooltip,
	Legend,
	Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	ChartTooltip,
	Legend,
	Filler
);

interface Anomaly {
	_id: string;
	meter: any;
	type: string;
	severity: string;
	description: string;
	detectedAt: string;
	confidence: number;
	metadata?: any;
}

interface Insight {
	_id: string;
	category: string;
	title: string;
	description: string;
	impact: string;
	recommendations: string[];
	priority: number;
	metadata?: any;
}

interface AIStats {
	totalAnomaliesDetected: number;
	anomaliesLast24h: number;
	anomaliesLast7d: number;
	activeInsights: number;
	systemHealthScore: number;
	predictionAccuracy: number;
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;
	return (
		<div role="tabpanel" hidden={value !== index} {...other}>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

export default function AIDashboard() {
	const [activeTab, setActiveTab] = useState(0);
	const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
	const [insights, setInsights] = useState<Insight[]>([]);
	const [stats, setStats] = useState<AIStats>({
		totalAnomaliesDetected: 0,
		anomaliesLast24h: 0,
		anomaliesLast7d: 0,
		activeInsights: 0,
		systemHealthScore: 0,
		predictionAccuracy: 0,
	});
	const [loading, setLoading] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);

	useEffect(() => {
		fetchAIData();
		// Auto-refresh every 5 minutes
		const interval = setInterval(fetchAIData, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	const fetchAIData = async () => {
		setLoading(true);
		try {
			const [anomaliesRes, insightsRes] = await Promise.all([
				axios.get('/ai/anomalies'),
				axios.get('/ai/insights'),
			]);

			setAnomalies(anomaliesRes.data.data || []);
			setInsights(insightsRes.data.data || []);

			// Calculate stats
			const now = new Date();
			const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

			const anomaliesData = anomaliesRes.data.data || [];
			const insightsData = insightsRes.data.data || [];

			setStats({
				totalAnomaliesDetected: anomaliesData.length,
				anomaliesLast24h: anomaliesData.filter(
					(a: Anomaly) => new Date(a.detectedAt) > last24h
				).length,
				anomaliesLast7d: anomaliesData.filter(
					(a: Anomaly) => new Date(a.detectedAt) > last7d
				).length,
				activeInsights: insightsData.length,
				systemHealthScore: calculateHealthScore(anomaliesData, insightsData),
				predictionAccuracy: 94.5, // This would come from your AI model metrics
			});
		} catch (error: any) {
			console.error('Failed to fetch AI data:', error);
			toast.error('Failed to load AI data');
		} finally {
			setLoading(false);
		}
	};

	const calculateHealthScore = (anomalies: Anomaly[], insights: Insight[]) => {
		// Simple health score calculation
		const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
		const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
		const highInsights = insights.filter(i => i.impact === 'high').length;

		let score = 100;
		score -= criticalAnomalies * 10;
		score -= highAnomalies * 5;
		score -= highInsights * 3;

		return Math.max(0, Math.min(100, score));
	};

	const handleRunAnalysis = async () => {
		setAnalyzing(true);
		try {
			await axios.post('/ai/analyze');
			toast.success('AI analysis completed successfully');
			await fetchAIData();
		} catch (error: any) {
			console.error('Failed to run AI analysis:', error);
			toast.error('Failed to run AI analysis');
		} finally {
			setAnalyzing(false);
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity.toLowerCase()) {
			case 'critical':
				return 'error';
			case 'high':
				return 'warning';
			case 'medium':
				return 'info';
			case 'low':
				return 'success';
			default:
				return 'default';
		}
	};

	const getImpactColor = (impact: string) => {
		switch (impact.toLowerCase()) {
			case 'high':
				return 'error';
			case 'medium':
				return 'warning';
			case 'low':
				return 'success';
			default:
				return 'default';
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category.toLowerCase()) {
			case 'efficiency':
				return <SpeedIcon />;
			case 'security':
				return <SecurityIcon />;
			case 'cost_saving':
				return <MoneyIcon />;
			default:
				return <InsightsIcon />;
		}
	};

	// Chart data for anomalies over time
	const anomalyChartData = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		datasets: [
			{
				label: 'Anomalies Detected',
				data: [12, 19, 8, 15, 10, 13, 9],
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.2)',
				tension: 0.4,
				fill: true,
			},
		],
	};

	// Chart data for severity distribution
	const severityChartData = {
		labels: ['Critical', 'High', 'Medium', 'Low'],
		datasets: [
			{
				data: [
					anomalies.filter(a => a.severity === 'critical').length,
					anomalies.filter(a => a.severity === 'high').length,
					anomalies.filter(a => a.severity === 'medium').length,
					anomalies.filter(a => a.severity === 'low').length,
				],
				backgroundColor: ['#D32F2F', '#FF9800', '#2196F3', '#4CAF50'],
			},
		],
	};

	return (
		<Box sx={{ p: 3 }}>
			{/* Header */}
			<Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<PsychologyIcon sx={{ fontSize: 40, color: '#7B1FA2' }} />
					<Box>
						<Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
							AI Analytics Dashboard
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Intelligent insights and anomaly detection powered by AI
						</Typography>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<Button
						variant="outlined"
						startIcon={<RefreshIcon />}
						onClick={fetchAIData}
						disabled={loading}
					>
						Refresh
					</Button>
					<Button
						variant="contained"
						startIcon={analyzing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
						onClick={handleRunAnalysis}
						disabled={analyzing}
						sx={{
							background: 'linear-gradient(45deg, #7B1FA2 30%, #9C27B0 90%)',
							color: 'white',
						}}
					>
						{analyzing ? 'Analyzing...' : 'Run AI Analysis'}
					</Button>
				</Box>
			</Box>

			{/* Stats Cards */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={6} md={4}>
					<Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
						<CardContent>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Box>
									<Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
										{stats.systemHealthScore}%
									</Typography>
									<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
										System Health Score
									</Typography>
								</Box>
								<SpeedIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
							</Box>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} sm={6} md={4}>
					<Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
						<CardContent>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Box>
									<Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
										{stats.anomaliesLast24h}
									</Typography>
									<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
										Anomalies (24h)
									</Typography>
								</Box>
								<WarningIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
							</Box>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} sm={6} md={4}>
					<Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
						<CardContent>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Box>
									<Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
										{stats.activeInsights}
									</Typography>
									<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
										Active Insights
									</Typography>
								</Box>
								<InsightsIcon sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
							</Box>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Tabs */}
			<Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
					<Tabs
						value={activeTab}
						onChange={(_, newValue) => setActiveTab(newValue)}
						sx={{ px: 2 }}
					>
						<Tab label="Anomaly Detection" icon={<WarningIcon />} iconPosition="start" />
						<Tab label="AI Insights" icon={<InsightsIcon />} iconPosition="start" />
						<Tab label="Analytics" icon={<BubbleChartIcon />} iconPosition="start" />
					</Tabs>
				</Box>

				{/* Anomaly Detection Tab */}
				<TabPanel value={activeTab} index={0}>
					<Box sx={{ px: 3 }}>
						{loading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
								<CircularProgress />
							</Box>
						) : anomalies.length === 0 ? (
							<Alert severity="success" icon={<AutoAwesomeIcon />}>
								No anomalies detected. Your system is running smoothly!
							</Alert>
						) : (
							<>
								<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant="h6">
										Detected Anomalies ({anomalies.length})
									</Typography>
									<Button startIcon={<DownloadIcon />} variant="outlined" size="small">
										Export Report
									</Button>
								</Box>
								<TableContainer>
									<Table>
										<TableHead>
											<TableRow>
												<TableCell><strong>Meter</strong></TableCell>
												<TableCell><strong>Type</strong></TableCell>
												<TableCell><strong>Severity</strong></TableCell>
												<TableCell><strong>Description</strong></TableCell>
												<TableCell><strong>Confidence</strong></TableCell>
												<TableCell><strong>Detected At</strong></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{anomalies.map((anomaly) => (
												<TableRow key={anomaly._id} hover>
													<TableCell>
														{anomaly.meter?.meterNumber || 'N/A'}
													</TableCell>
													<TableCell>
														<Chip
															label={anomaly.type}
															size="small"
															variant="outlined"
														/>
													</TableCell>
													<TableCell>
														<Chip
															label={anomaly.severity}
															size="small"
															color={getSeverityColor(anomaly.severity) as any}
														/>
													</TableCell>
													<TableCell>{anomaly.description}</TableCell>
													<TableCell>
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
															<LinearProgress
																variant="determinate"
																value={anomaly.confidence}
																sx={{ width: 60, height: 6, borderRadius: 3 }}
															/>
															<Typography variant="caption">
																{anomaly.confidence}%
															</Typography>
														</Box>
													</TableCell>
													<TableCell>
														{new Date(anomaly.detectedAt).toLocaleString()}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</>
						)}
					</Box>
				</TabPanel>

				{/* AI Insights Tab */}
				<TabPanel value={activeTab} index={1}>
					<Box sx={{ px: 3 }}>
						{loading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
								<CircularProgress />
							</Box>
						) : insights.length === 0 ? (
							<Alert severity="info">
								No active insights available. Run AI analysis to generate insights.
							</Alert>
						) : (
							<Grid container spacing={3}>
								{insights.map((insight) => (
									<Grid item xs={12} md={6} key={insight._id}>
										<Card sx={{ height: '100%', borderLeft: 4, borderColor: getImpactColor(insight.impact) + '.main' }}>
											<CardHeader
												avatar={getCategoryIcon(insight.category)}
												title={
													<Typography variant="h6" sx={{ fontWeight: 600 }}>
														{insight.title}
													</Typography>
												}
												subheader={
													<Box sx={{ mt: 1 }}>
														<Chip
															label={insight.category.replace('_', ' ').toUpperCase()}
															size="small"
															sx={{ mr: 1 }}
														/>
														<Chip
															label={`Impact: ${insight.impact}`}
															size="small"
															color={getImpactColor(insight.impact) as any}
														/>
													</Box>
												}
											/>
											<CardContent>
												<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
													{insight.description}
												</Typography>
												<Divider sx={{ my: 2 }} />
												<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
													Recommendations:
												</Typography>
												<Box component="ul" sx={{ m: 0, pl: 2 }}>
													{insight.recommendations?.map((rec, idx) => (
														<Typography
															component="li"
															variant="body2"
															key={idx}
															sx={{ mb: 0.5 }}
														>
															{rec}
														</Typography>
													))}
												</Box>
											</CardContent>
										</Card>
									</Grid>
								))}
							</Grid>
						)}
					</Box>
				</TabPanel>

				{/* Analytics Tab */}
				<TabPanel value={activeTab} index={2}>
					<Box sx={{ px: 3 }}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={8}>
								<Paper sx={{ p: 3 }}>
									<Typography variant="h6" sx={{ mb: 3 }}>
										Anomalies Trend (Last 7 Days)
									</Typography>
									<Line
										data={anomalyChartData}
										options={{
											responsive: true,
											plugins: {
												legend: {
													position: 'top' as const,
												},
											},
										}}
									/>
								</Paper>
							</Grid>
							<Grid item xs={12} md={4}>
								<Paper sx={{ p: 3 }}>
									<Typography variant="h6" sx={{ mb: 3 }}>
										Severity Distribution
									</Typography>
									<Doughnut
										data={severityChartData}
										options={{
											responsive: true,
											plugins: {
												legend: {
													position: 'bottom' as const,
												},
											},
										}}
									/>
								</Paper>
							</Grid>

							{/* Additional Stats */}
							<Grid item xs={12}>
								<Paper sx={{ p: 3 }}>
									<Typography variant="h6" sx={{ mb: 3 }}>
										AI Model Performance
									</Typography>
									<Grid container spacing={3}>
										<Grid item xs={12} sm={4}>
											<Box sx={{ textAlign: 'center' }}>
												<Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
													{stats.predictionAccuracy}%
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Prediction Accuracy
												</Typography>
											</Box>
										</Grid>
										<Grid item xs={12} sm={4}>
											<Box sx={{ textAlign: 'center' }}>
												<Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
													{stats.anomaliesLast7d}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Anomalies (7 Days)
												</Typography>
											</Box>
										</Grid>
										<Grid item xs={12} sm={4}>
											<Box sx={{ textAlign: 'center' }}>
												<Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
													{stats.totalAnomaliesDetected}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Total Detected
												</Typography>
											</Box>
										</Grid>
									</Grid>
								</Paper>
							</Grid>
						</Grid>
					</Box>
				</TabPanel>
			</Paper>
		</Box>
	);
}
