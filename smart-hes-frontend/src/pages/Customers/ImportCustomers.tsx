import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Input, Table, TableBody, TableCell, TableHead, TableRow, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ImportCustomers() {
	const [file, setFile] = useState<File | null>(null);
	const [results, setResults] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleUpload = async () => {
		if (!file) return toast.error('Select a CSV file');
		setLoading(true);
		const form = new FormData();
		form.append('file', file);
		try {
			const res = await axios.post('/customers/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
			setResults(res.data);
			toast.success(`Imported ${res.data.successCount || 0} customers`);
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Import failed');
		} finally {
			setLoading(false);
		}
	};

	const handleBackToList = () => {
		navigate('/customers');
	};

	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h4" sx={{ mb: 2 }}>Import Customers (CSV)</Typography>

			{!results ? (
				<Paper sx={{ p: 3 }}>
					<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
						Select a CSV file with columns: customerName, accountNumber, email, phoneNumber, street, city, state, postalCode, country
					</Typography>
					<Input type="file" inputProps={{ accept: '.csv' }} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} />
					<Box sx={{ mt: 2 }}>
						<Button variant="contained" onClick={handleUpload} disabled={!file || loading}>
							{loading ? <CircularProgress size={24} /> : 'Upload & Import'}
						</Button>
					</Box>
				</Paper>
			) : (
				<Box>
					<Alert severity={results.successCount === results.total ? 'success' : 'warning'} sx={{ mb: 2 }}>
						<Typography variant="body2">
							<strong>Import Results:</strong> {results.successCount} of {results.total} rows imported successfully
						</Typography>
					</Alert>

					{results.failures && results.failures.length > 0 && (
						<Paper sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
							<Typography variant="h6" sx={{ mb: 2 }}>Failed Rows ({results.failures.length})</Typography>
							<Table size="small">
								<TableHead>
									<TableRow sx={{ backgroundColor: '#f5f5f5' }}>
										<TableCell><strong>Row #</strong></TableCell>
										<TableCell><strong>Name</strong></TableCell>
										<TableCell><strong>Account</strong></TableCell>
										<TableCell><strong>Error</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{results.failures.map((failure: any, idx: number) => (
										<TableRow key={idx}>
											<TableCell>{failure.index + 1}</TableCell>
											<TableCell>{failure.row?.customerName || failure.row?.name || '-'}</TableCell>
											<TableCell>{failure.row?.accountNumber || failure.row?.account || '-'}</TableCell>
											<TableCell sx={{ color: 'red', fontSize: '0.9em' }}>{failure.error}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Paper>
					)}

					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button variant="contained" onClick={handleBackToList}>
							Back to Customers
						</Button>
						<Button variant="outlined" onClick={() => { setResults(null); setFile(null); }}>
							Import Another File
						</Button>
					</Box>
				</Box>
			)}
		</Box>
	);
}
