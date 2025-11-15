import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function OnlineRate() {
	const [areaStats, setAreaStats] = useState<any[]>([]);

	useEffect(() => { fetchAreaStats(); }, []);

	const fetchAreaStats = async () => {
		try {
			const res = await axios.get('/dashboard/area-stats');
			setAreaStats(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load area stats');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>Online Rate by Area</Typography>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Area</TableCell>
							<TableCell>Total Meters</TableCell>
							<TableCell>Online</TableCell>
							<TableCell>Offline</TableCell>
							<TableCell>Online %</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{areaStats.map(a => (
							<TableRow key={a._id}>
								<TableCell>{a.name}</TableCell>
								<TableCell>{a.meterCount}</TableCell>
								<TableCell>{a.onlineCount}</TableCell>
								<TableCell>{a.offlineCount}</TableCell>
								<TableCell>{a.meterCount ? ((a.onlineCount / a.meterCount) * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
