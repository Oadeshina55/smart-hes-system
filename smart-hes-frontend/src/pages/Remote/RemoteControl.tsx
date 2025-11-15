import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function RemoteControl() {
	const [meterNumber, setMeterNumber] = useState('');
	const [meters, setMeters] = useState<any[]>([]);
	const [action, setAction] = useState<'disconnect' | 'connect'>('disconnect');

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
		if (!meterNumber) return toast.error('Please select or enter a meter');
		try {
			const res = await axios.post('/remote/control', { meterNumber, action });
			toast.success(res.data.message || 'Control command sent');
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to send command');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>Remote Control</Typography>
			<Paper sx={{ p: 3 }}>
				<Grid container spacing={2}>
					<Grid item xs={12} md={6}>
						<FormControl fullWidth>
							<InputLabel>Meter</InputLabel>
							<Select value={meterNumber} label="Meter" onChange={(e) => setMeterNumber(e.target.value)}>
								<MenuItem value="">-- Select --</MenuItem>
								{meters.map(m => (
									<MenuItem key={m._id} value={m.meterNumber}>{m.meterNumber} - {m.area?.name || 'N/A'}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid item xs={12} md={6}>
						<FormControl fullWidth>
							<InputLabel>Action</InputLabel>
							<Select value={action} label="Action" onChange={(e) => setAction(e.target.value as any)}>
								<MenuItem value="disconnect">Disconnect Relay</MenuItem>
								<MenuItem value="connect">Connect Relay</MenuItem>
							</Select>
						</FormControl>
					</Grid>

					<Grid item xs={12}>
						<TextField fullWidth label="Or enter meter number" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} />
					</Grid>

					<Grid item xs={12}>
						<Button variant="contained" color={action === 'disconnect' ? 'error' : 'primary'} onClick={handleSubmit}>
							{action === 'disconnect' ? 'Disconnect Relay' : 'Connect Relay'}
						</Button>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
}
