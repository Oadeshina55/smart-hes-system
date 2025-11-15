import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Alert } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import toast from 'react-hot-toast';

const meterTypes = ['single-phase', 'three-phase', 'prepaid', 'postpaid'];

const METER_PATTERNS: Record<string, { regex: RegExp; hint: string }> = {
	hexing: { regex: /^145\d{7,}$/, hint: 'Hexing meters start with "145" (e.g., 145xxxxxxxx)' },
	hexcell: { regex: /^46\d{7,}$/, hint: 'Hexcell meters start with "46" (e.g., 46xxxxxxxxx)' },
};

export default function AddMeter() {
	const [meterNumber, setMeterNumber] = useState('');
	const [meterType, setMeterType] = useState('single-phase');
	const [brand, setBrand] = useState('hexing');
	const [model, setModel] = useState('');
	const [ipAddress, setIpAddress] = useState('');
	const [port, setPort] = useState('');
	const [areas, setAreas] = useState<any[]>([]);
	const [area, setArea] = useState('');
	const [meterNumberError, setMeterNumberError] = useState('');

	useEffect(() => { fetchAreas(); }, []);

	const fetchAreas = async () => {
		try {
			const res = await axios.get('/areas');
			setAreas(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load areas');
		}
	};

	const validateMeterNumber = (number: string, selectedBrand: string) => {
		if (!number) {
			setMeterNumberError('');
			return true;
		}
		const pattern = METER_PATTERNS[selectedBrand.toLowerCase()];
		if (!pattern.regex.test(number)) {
			setMeterNumberError(`Invalid meter number. ${pattern.hint}`);
			return false;
		}
		setMeterNumberError('');
		return true;
	};

	const handleMeterNumberChange = (value: string) => {
		setMeterNumber(value);
		validateMeterNumber(value, brand);
	};

	const handleBrandChange = (newBrand: string) => {
		setBrand(newBrand);
		if (meterNumber) {
			validateMeterNumber(meterNumber, newBrand);
		}
	};

	const handleCreate = async () => {
		if (!meterNumber) {
			toast.error('Meter number is required');
			return;
		}
		if (!validateMeterNumber(meterNumber, brand)) {
			toast.error(meterNumberError);
			return;
		}
		try {
			await axios.post('/meters', { meterNumber, meterType, brand: brand.toLowerCase(), model, area, ipAddress: ipAddress || undefined, port: port ? Number(port) : undefined });
			toast.success('Meter created');
			// redirect to management
			window.location.href = '/meters';
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to create meter');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>Add Meter</Typography>
			<Paper sx={{ p: 3 }}>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Alert icon={<InfoIcon />} severity="info">
							{METER_PATTERNS[brand.toLowerCase()].hint}
						</Alert>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField 
							fullWidth 
							label="Meter Number" 
							value={meterNumber} 
							onChange={(e) => handleMeterNumberChange(e.target.value)}
							error={!!meterNumberError}
							helperText={meterNumberError}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField select fullWidth label="Meter Type" value={meterType} onChange={(e) => setMeterType(e.target.value)}>
							{meterTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
						</TextField>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField select fullWidth label="Brand" value={brand} onChange={(e) => handleBrandChange(e.target.value)}>
							<MenuItem value="hexing">Hexing</MenuItem>
							<MenuItem value="hexcell">Hexcell</MenuItem>
						</TextField>
					</Grid>
					<Grid item xs={12} md={6}><TextField fullWidth label="Model" value={model} onChange={(e) => setModel(e.target.value)} /></Grid>
					<Grid item xs={12} md={6}>
						<TextField fullWidth label="IP Address" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} />
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField fullWidth label="Port" value={port} onChange={(e) => setPort(e.target.value)} />
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField select fullWidth label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
							<MenuItem value="">Unassigned</MenuItem>
							{areas.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}
						</TextField>
					</Grid>
					<Grid item xs={12}>
						<Button variant="contained" onClick={handleCreate}>Create Meter</Button>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
}
