import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Alert, CircularProgress, Autocomplete } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const meterTypes = ['single-phase', 'three-phase', 'prepaid', 'postpaid'];

const METER_NUMBER_PATTERN = /^\d{11}$|^\d{13}$/;
const METER_NUMBER_HINT = 'Meter number must be exactly 11 or 13 digits';

export default function EditMeter() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Meter fields
	const [meterNumber, setMeterNumber] = useState('');
	const [meterType, setMeterType] = useState('single-phase');
	const [brand, setBrand] = useState('hexing');
	const [model, setModel] = useState('');
	const [firmware, setFirmware] = useState('');
	const [ipAddress, setIpAddress] = useState('');
	const [port, setPort] = useState('');
	const [concentratorId, setConcentratorId] = useState('');
	const [meterNumberError, setMeterNumberError] = useState('');

	// Dropdowns data
	const [areas, setAreas] = useState<any[]>([]);
	const [customers, setCustomers] = useState<any[]>([]);
	const [simCards, setSimCards] = useState<any[]>([]);

	// Selected values
	const [selectedArea, setSelectedArea] = useState<any>(null);
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [selectedSimCard, setSelectedSimCard] = useState<any>(null);

	useEffect(() => {
		fetchMeterData();
		fetchAreas();
		fetchCustomers();
		fetchSimCards();
	}, [id]);

	const fetchMeterData = async () => {
		try {
			const res = await axios.get(`/meters/${id}`);
			const meter = res.data.data;

			setMeterNumber(meter.meterNumber || '');
			setMeterType(meter.meterType || 'single-phase');
			setBrand(meter.brand || 'hexing');
			setModel(meter.model || '');
			setFirmware(meter.firmware || '');
			setIpAddress(meter.ipAddress || '');
			setPort(meter.port ? String(meter.port) : '');
			setConcentratorId(meter.concentratorId || '');

			// Set selected area
			if (meter.area) {
				setSelectedArea(typeof meter.area === 'object' ? meter.area : { _id: meter.area });
			}

			// Set selected customer
			if (meter.customer) {
				setSelectedCustomer(typeof meter.customer === 'object' ? meter.customer : { _id: meter.customer });
			}

			// Set selected SIM card
			if (meter.simCard) {
				setSelectedSimCard(typeof meter.simCard === 'object' ? meter.simCard : { _id: meter.simCard });
			}

			setLoading(false);
		} catch (err: any) {
			console.error(err);
			toast.error('Failed to load meter data');
			navigate('/meters');
		}
	};

	const fetchAreas = async () => {
		try {
			const res = await axios.get('/areas');
			setAreas(res.data.data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchCustomers = async () => {
		try {
			const res = await axios.get('/customers');
			setCustomers(res.data.data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchSimCards = async () => {
		try {
			const res = await axios.get('/sims');
			const allSims = res.data.data || [];
			// Show only unassigned SIM cards or the currently assigned one
			const availableSims = allSims.filter((sim: any) =>
				!sim.assignedTo || sim._id === selectedSimCard?._id
			);
			setSimCards(availableSims);
		} catch (err) {
			console.error(err);
		}
	};

	const validateMeterNumber = (number: string) => {
		if (!number) {
			setMeterNumberError('');
			return true;
		}
		if (!METER_NUMBER_PATTERN.test(number)) {
			setMeterNumberError(METER_NUMBER_HINT);
			return false;
		}
		setMeterNumberError('');
		return true;
	};

	const handleMeterNumberChange = (value: string) => {
		const digitsOnly = value.replace(/\D/g, '');
		setMeterNumber(digitsOnly);
		validateMeterNumber(digitsOnly);
	};

	const handleUpdate = async () => {
		// Validation
		if (!meterNumber) {
			toast.error('Meter number is required');
			return;
		}
		if (!validateMeterNumber(meterNumber)) {
			toast.error(meterNumberError);
			return;
		}
		if (!model) {
			toast.error('Model is required');
			return;
		}
		if (!selectedArea) {
			toast.error('Area is required');
			return;
		}

		setSaving(true);
		try {
			const updateData: any = {
				meterNumber,
				meterType,
				brand: brand.toLowerCase(),
				model,
				firmware,
				area: selectedArea._id,
				ipAddress: ipAddress || undefined,
				port: port ? Number(port) : undefined,
				concentratorId: concentratorId || undefined,
				customer: selectedCustomer?._id || undefined,
				simCard: selectedSimCard?._id || undefined,
			};

			await axios.put(`/meters/${id}`, updateData);
			toast.success('Meter updated successfully');
			navigate('/meters');
		} catch (err: any) {
			console.error(err);
			const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update meter';
			toast.error(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="h4" sx={{ fontWeight: 700, color: '#344767' }}>
					Edit Meter
				</Typography>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/meters')}
				>
					Back to Meters
				</Button>
			</Box>

			<Paper sx={{ p: 4, borderRadius: 3 }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Alert icon={<InfoIcon />} severity="info">
							{METER_NUMBER_HINT}
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
							inputProps={{ maxLength: 13, inputMode: 'numeric' }}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField select fullWidth label="Meter Type" value={meterType} onChange={(e) => setMeterType(e.target.value)}>
							{meterTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
						</TextField>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField select fullWidth label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
							<MenuItem value="hexing">Hexing</MenuItem>
							<MenuItem value="hexcell">Hexcell</MenuItem>
						</TextField>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Model"
							value={model}
							onChange={(e) => setModel(e.target.value)}
							required
							helperText="Model name is required"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Firmware Version"
							value={firmware}
							onChange={(e) => setFirmware(e.target.value)}
							helperText="Optional firmware version"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Concentrator ID"
							value={concentratorId}
							onChange={(e) => setConcentratorId(e.target.value)}
							helperText="Optional concentrator identifier"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="IP Address"
							value={ipAddress}
							onChange={(e) => setIpAddress(e.target.value)}
							helperText="Optional IP address"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<TextField
							fullWidth
							label="Port"
							value={port}
							onChange={(e) => setPort(e.target.value)}
							helperText="Optional port number"
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<Autocomplete
							options={areas}
							getOptionLabel={(option) => option.name || ''}
							value={selectedArea}
							onChange={(_, newValue) => setSelectedArea(newValue)}
							renderInput={(params) => (
								<TextField {...params} label="Area" required helperText="Area assignment is required" />
							)}
							isOptionEqualToValue={(option, value) => option._id === value._id}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<Autocomplete
							options={customers}
							getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''} (${option.accountNumber || ''})`.trim()}
							value={selectedCustomer}
							onChange={(_, newValue) => setSelectedCustomer(newValue)}
							renderInput={(params) => (
								<TextField {...params} label="Customer (Optional)" helperText="Link meter to a customer" />
							)}
							isOptionEqualToValue={(option, value) => option._id === value._id}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<Autocomplete
							options={simCards}
							getOptionLabel={(option) => `${option.iccid || ''} - ${option.phoneNumber || ''} (${option.provider || ''})`.trim()}
							value={selectedSimCard}
							onChange={(_, newValue) => setSelectedSimCard(newValue)}
							renderInput={(params) => (
								<TextField {...params} label="SIM Card (Optional)" helperText="Assign a SIM card to this meter" />
							)}
							isOptionEqualToValue={(option, value) => option._id === value._id}
						/>
					</Grid>

					<Grid item xs={12}>
						<Box sx={{ display: 'flex', gap: 2 }}>
							<Button
								variant="contained"
								startIcon={<SaveIcon />}
								onClick={handleUpdate}
								disabled={saving}
								size="large"
								sx={{
									background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
									px: 4
								}}
							>
								{saving ? 'Updating...' : 'Update Meter'}
							</Button>
							<Button
								variant="outlined"
								onClick={() => navigate('/meters')}
								disabled={saving}
								size="large"
							>
								Cancel
							</Button>
						</Box>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
}
