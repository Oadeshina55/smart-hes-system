import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CSVLink } from 'react-csv';

export default function CustomerManagement() {
	const [customers, setCustomers] = useState<any[]>([]);

	useEffect(() => { fetchCustomers(); }, []);

	const fetchCustomers = async () => {
		try {
			const res = await axios.get('/customers');
			setCustomers(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load customers');
		}
	};

	const csvData = customers.map(c => ({
		name: c.customerName,
		accountNumber: c.accountNumber,
		phone: c.phoneNumber,
		email: c.email,
		meterNumber: c.meterNumber || ''
	}));

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
				<Typography variant="h4">Customer Management</Typography>
				<Box>
					<Button variant="outlined" sx={{ mr: 1 }} onClick={() => window.location.href = '/customers/import'}>Import CSV</Button>
					<CSVLink data={csvData} filename="customers.csv" style={{ textDecoration: 'none' }}>
						<Button variant="contained">Export CSV</Button>
					</CSVLink>
				</Box>
			</Box>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Account</TableCell>
							<TableCell>Phone</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Meter</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{customers.map(c => (
							<TableRow key={c._id}>
								<TableCell>{c.customerName}</TableCell>
								<TableCell>{c.accountNumber}</TableCell>
								<TableCell>{c.phoneNumber}</TableCell>
								<TableCell>{c.email}</TableCell>
								<TableCell>{c.meterNumber || 'Unassigned'}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
