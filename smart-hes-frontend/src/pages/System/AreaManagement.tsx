import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, IconButton } from '@mui/material';
import axios from 'axios';
import { Add, Delete, Edit } from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function AreaManagement() {
	const [areas, setAreas] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('');
	const [code, setCode] = useState('');

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

	const handleCreate = async () => {
		try {
			const res = await axios.post('/areas', { name, code });
			toast.success('Area created');
			setOpen(false);
			setName(''); setCode('');
			fetchAreas();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to create area');
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
				<Typography variant="h4">Area Management</Typography>
				<Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>New Area</Button>
			</Box>

			<Paper sx={{ p: 2 }}>
				<List>
					{areas.map((a) => (
						<ListItem key={a._id} secondaryAction={(
							<Box>
								<IconButton edge="end" size="small"><Edit /></IconButton>
								<IconButton edge="end" size="small"><Delete /></IconButton>
							</Box>
						)}>
							<ListItemText primary={a.name} secondary={`Code: ${a.code}`} />
						</ListItem>
					))}
				</List>
			</Paper>

			<Dialog open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Create Area</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />
						</Grid>
						<Grid item xs={12}>
							<TextField fullWidth label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleCreate}>Create</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
