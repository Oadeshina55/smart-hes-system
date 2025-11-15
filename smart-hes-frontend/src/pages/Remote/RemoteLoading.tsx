import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

export default function RemoteLoading() {
	const [meterNumber, setMeterNumber] = useState('');
	const [amount, setAmount] = useState<number | ''>('');
	const [token, setToken] = useState('');
	const [meters, setMeters] = useState<any[]>([]);
	const { recentEvents } = useSocket();

	useEffect(() => { fetchMeters(); }, []);

	const fetchMeters = async () => {
		try {
			const res = await axios.get('/meters');
			setMeters(res.data.data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const handleSubmit = async () => {
		if (!meterNumber) return toast.error('Please select or enter a meter number');
		if (!amount && !token) return toast.error('Provide an amount or token');

		try {
			const body: any = { meterNumber };
			if (token) body.token = token;
			if (amount) body.amount = amount;

			const res = await axios.post('/remote/load', body);
			toast.success(res.data.message || 'Load command sent');
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to send load');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>Remote Loading</Typography>
			<Paper sx={{ p: 3, mb: 3 }}>
				<Grid container spacing={2}>
					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							select
							label="Select Meter"
							value={meterNumber}
							onChange={(e) => setMeterNumber(e.target.value)}
							helperText="Or type a meter number"
						>
							<MenuItem value="">-- Choose meter --</MenuItem>
							{meters.map(m => (
								<MenuItem key={m._id} value={m.meterNumber}>{m.meterNumber} - {m.area?.name || 'N/A'}</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField fullWidth label="Or enter meter number" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} />
					</Grid>

					<Grid item xs={12} md={4}>
						<TextField fullWidth label="Amount (optional)" type="number" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} />
					</Grid>
					<Grid item xs={12} md={8}>
						<TextField fullWidth label="Token (optional)" value={token} onChange={(e) => setToken(e.target.value)} />
					</Grid>

					<Grid item xs={12}>
						<Button variant="contained" onClick={handleSubmit}>Send Load</Button>
					</Grid>
				</Grid>
			</Paper>

			<Paper sx={{ p: 2 }}>
				<Typography variant="h6">Recent Events</Typography>
				{recentEvents.slice(0, 10).map((ev: any) => (
					<Box key={ev._id || ev.eventId} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
						<Typography variant="subtitle2">{ev.eventType || ev.event}</Typography>
						<Typography variant="caption" sx={{ color: '#666' }}>{new Date(ev.timestamp || ev.createdAt || Date.now()).toLocaleString()}</Typography>
						<Typography>{ev.description || ev.message}</Typography>
					</Box>
				))}
			</Paper>
		</Box>
	);
}
