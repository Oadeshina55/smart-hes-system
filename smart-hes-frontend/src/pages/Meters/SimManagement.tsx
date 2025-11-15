import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SimManagement() {
	const [sims, setSims] = useState<any[]>([]);
	const [simNumber, setSimNumber] = useState('');
	const [iccid, setIccid] = useState('');
	const [provider, setProvider] = useState('');

	useEffect(() => { fetchSims(); }, []);

	const fetchSims = async () => {
		try {
			const res = await axios.get('/sims');
			setSims(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load SIMs');
		}
	};

	const handleCreate = async () => {
		try {
			await axios.post('/sims', { simNumber, iccid, provider });
			toast.success('SIM created');
			setSimNumber(''); setIccid(''); setProvider('');
			fetchSims();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to create SIM');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>SIM Management</Typography>
			<Paper sx={{ p: 3, mb: 3 }}>
				<Grid container spacing={2}>
					<Grid item xs={12} md={4}><TextField fullWidth label="SIM Number" value={simNumber} onChange={(e) => setSimNumber(e.target.value)} /></Grid>
					<Grid item xs={12} md={4}><TextField fullWidth label="ICCID" value={iccid} onChange={(e) => setIccid(e.target.value)} /></Grid>
					<Grid item xs={12} md={4}><TextField fullWidth label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} /></Grid>
					<Grid item xs={12}><Button variant="contained" onClick={handleCreate}>Create SIM</Button></Grid>
				</Grid>
			</Paper>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>SIM Number</TableCell>
							<TableCell>ICCID</TableCell>
							<TableCell>Provider</TableCell>
							<TableCell>Status</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sims.map(s => (
							<TableRow key={s._id}>
								<TableCell>{s.simNumber}</TableCell>
								<TableCell>{s.iccid}</TableCell>
								<TableCell>{s.provider}</TableCell>
								<TableCell>{s.status}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
