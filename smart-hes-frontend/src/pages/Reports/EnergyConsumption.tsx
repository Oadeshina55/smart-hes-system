import React, { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Paper,
	TextField,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	MenuItem,
	Grid,
	CircularProgress,
	Card,
	CardContent,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConsumptionData {
	_id: string;
	meter: { _id: string; meterNumber: string };
	area: { _id: string; name: string };
	timestamp: string;
	interval: string;
	energy: {
		activeEnergy: number;
		reactiveEnergy: number;
		apparentEnergy: number;
		exportedEnergy: number;
	};
	power: {
		activePower: number;
		maxDemand: number;
	};
	voltage: { average: number };
	current: { average: number };
	powerFactor: { average: number };
	frequency: number;
}

export default function EnergyConsumption() {
	const [areas, setAreas] = useState<any[]>([]);
	const [meters, setMeters] = useState<any[]>([]);
	const [selectedArea, setSelectedArea] = useState('');
	const [selectedMeter, setSelectedMeter] = useState('');
	const [searchMeter, setSearchMeter] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [interval, setInterval] = useState('daily');
	const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);
	const [loading, setLoading] = useState(false);
	const [chartData, setChartData] = useState<any[]>([]);

	useEffect(() => {
		fetchAreas();
		fetchMeters();
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

	const fetchMeters = async (areaId?: string) => {
		try {
			const params = areaId ? { area: areaId } : {};
			const res = await axios.get('/meters', { params });
			setMeters(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load meters');
		}
	};

	const handleAreaChange = (areaId: string) => {
		setSelectedArea(areaId);
		setSelectedMeter('');
		if (areaId) {
			fetchMeters(areaId);
		} else {
			fetchMeters();
		}
	};

	const generateReport = async () => {
		if (!selectedMeter && !selectedArea) {
			return toast.error('Select an area or meter');
		}

		setLoading(true);
		try {
			const params: any = { interval };
			if (selectedMeter) params.meterId = selectedMeter;
			if (selectedArea) params.areaId = selectedArea;
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const res = await axios.get('/consumption', { params });
			const data = res.data.data || [];
			setConsumptionData(data);

			// prepare chart data
			const chartData = data.map((d: ConsumptionData) => ({
				timestamp: new Date(d.timestamp).toLocaleDateString(),
				activeEnergy: d.energy.activeEnergy,
				activePower: d.power.activePower,
				voltage: d.voltage.average,
				current: d.current.average,
			}));
			setChartData(chartData);

			toast.success(`Report generated: ${data.length} records`);
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to generate report');
		} finally {
			setLoading(false);
		}
	};

	const downloadCSV = async () => {
		if (consumptionData.length === 0) {
			return toast.error('No data to export');
		}

		try {
			const params: any = { interval };
			if (selectedMeter) params.meterId = selectedMeter;
			if (selectedArea) params.areaId = selectedArea;
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const response = await axios.get('/consumption/export', { params, responseType: 'blob' });
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `consumption_${Date.now()}.csv`);
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
			toast.success('CSV downloaded');
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to download CSV');
		}
	};

	const downloadPDF = async () => {
		if (consumptionData.length === 0) {
			return toast.error('No data to export');
		}

		try {
			const params: any = { interval };
			if (selectedMeter) params.meterId = selectedMeter;
			if (selectedArea) params.areaId = selectedArea;
			if (startDate) params.startDate = startDate;
			if (endDate) params.endDate = endDate;

			const response = await axios.get('/consumption/export/pdf', { params, responseType: 'blob' });
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `consumption_${Date.now()}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
			toast.success('PDF downloaded');
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to download PDF');
		}
	};

	// Summary stats
	const stats = {
		totalEnergy: consumptionData.reduce((sum, d) => sum + (d.energy.activeEnergy || 0), 0),
		avgPower: consumptionData.length ? consumptionData.reduce((sum, d) => sum + (d.power.activePower || 0), 0) / consumptionData.length : 0,
		avgVoltage: consumptionData.length ? consumptionData.reduce((sum, d) => sum + (d.voltage.average || 0), 0) / consumptionData.length : 0,
		avgCurrent: consumptionData.length ? consumptionData.reduce((sum, d) => sum + (d.current.average || 0), 0) / consumptionData.length : 0,
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#344767' }}>Energy Consumption Report</Typography>

			{/* Filters */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Report Filters</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} md={6}>
						<TextField
							select
							fullWidth
							label="Select Area"
							value={selectedArea}
							onChange={(e) => handleAreaChange(e.target.value)}
						>
							<MenuItem value="">All Areas</MenuItem>
							{areas.map((a) => (
								<MenuItem key={a._id} value={a._id}>
									{a.name}
								</MenuItem>
							))}
						</TextField>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							select
							fullWidth
							label="Select Meter"
							value={selectedMeter}
							onChange={(e) => setSelectedMeter(e.target.value)}
						>
							<MenuItem value="">All Meters</MenuItem>
							{meters.map((m) => (
								<MenuItem key={m._id} value={m._id}>
									{m.meterNumber}
								</MenuItem>
							))}
						</TextField>
					</Grid>

					<Grid item xs={12} md={3}>
						<TextField
							fullWidth
							type="date"
							label="Start Date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>

					<Grid item xs={12} md={3}>
						<TextField
							fullWidth
							type="date"
							label="End Date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>

					<Grid item xs={12} md={3}>
						<TextField
							select
							fullWidth
							label="Interval"
							value={interval}
							onChange={(e) => setInterval(e.target.value)}
						>
							<MenuItem value="hourly">Hourly</MenuItem>
							<MenuItem value="daily">Daily</MenuItem>
							<MenuItem value="weekly">Weekly</MenuItem>
							<MenuItem value="monthly">Monthly</MenuItem>
						</TextField>
					</Grid>

					<Grid item xs={12} md={3}>
						<Button
							variant="contained"
							fullWidth
							onClick={generateReport}
							disabled={loading}
							sx={{
								height: '56px',
								background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
							}}
						>
							{loading ? <CircularProgress size={24} /> : 'Generate Report'}
						</Button>
					</Grid>
				</Grid>
			</Paper>

			{/* Summary Cards */}
			{consumptionData.length > 0 && (
				<Grid container spacing={2} sx={{ mb: 3 }}>
					<Grid item xs={12} sm={6} md={3}>
						<Card sx={{ borderRadius: 3 }}>
							<CardContent>
								<Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
									Total Energy
								</Typography>
								<Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.totalEnergy.toFixed(2)} kWh</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Card sx={{ borderRadius: 3 }}>
							<CardContent>
								<Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
									Avg Power
								</Typography>
								<Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.avgPower.toFixed(2)} kW</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Card sx={{ borderRadius: 3 }}>
							<CardContent>
								<Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
									Avg Voltage
								</Typography>
								<Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.avgVoltage.toFixed(2)} V</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Card sx={{ borderRadius: 3 }}>
							<CardContent>
								<Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem' }}>
									Avg Current
								</Typography>
								<Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.avgCurrent.toFixed(2)} A</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			)}

			{/* Chart */}
			{chartData.length > 0 && (
				<Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
					<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
						Energy & Power Trend
					</Typography>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="timestamp" />
							<YAxis />
							<Tooltip />
							<Legend />
							<Line type="monotone" dataKey="activeEnergy" stroke="#8884d8" name="Active Energy (kWh)" />
							<Line type="monotone" dataKey="activePower" stroke="#82ca9d" name="Active Power (kW)" />
						</LineChart>
					</ResponsiveContainer>
				</Paper>
			)}

			{/* Export Buttons */}
			{consumptionData.length > 0 && (
				<Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
					<Button
						variant="outlined"
						startIcon={<DownloadIcon />}
						onClick={downloadCSV}
						disabled={loading}
					>
						Export as CSV
					</Button>
					<Button
						variant="outlined"
						startIcon={<DownloadIcon />}
						onClick={downloadPDF}
						disabled={loading}
					>
						Export as PDF
					</Button>
				</Box>
			)}

			{/* Data Table */}
			{consumptionData.length > 0 && (
				<TableContainer component={Paper} sx={{ borderRadius: 3 }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Meter</TableCell>
								<TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Area</TableCell>
								<TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Timestamp</TableCell>
								<TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Active Energy (kWh)</TableCell>
								<TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Active Power (kW)</TableCell>
								<TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Voltage (V)</TableCell>
								<TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Current (A)</TableCell>
								<TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Power Factor</TableCell>
								<TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }}>Frequency (Hz)</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{consumptionData.map((row, idx) => (
								<TableRow key={idx} hover>
									<TableCell sx={{ fontWeight: 600 }}>{row.meter?.meterNumber}</TableCell>
									<TableCell>{row.area?.name}</TableCell>
									<TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
									<TableCell align="right">{row.energy.activeEnergy.toFixed(2)}</TableCell>
									<TableCell align="right">{row.power.activePower.toFixed(2)}</TableCell>
									<TableCell align="right">{row.voltage.average.toFixed(2)}</TableCell>
									<TableCell align="right">{row.current.average.toFixed(2)}</TableCell>
									<TableCell align="right">{row.powerFactor.average.toFixed(3)}</TableCell>
									<TableCell align="right">{row.frequency.toFixed(2)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{consumptionData.length === 0 && !loading && (
				<Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
					<Typography color="textSecondary">No data available. Configure filters and click "Generate Report".</Typography>
				</Paper>
			)}
		</Box>
	);
}

