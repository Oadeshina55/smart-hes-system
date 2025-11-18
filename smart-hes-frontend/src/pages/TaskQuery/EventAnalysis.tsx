import React, { useEffect, useState } from 'react';
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Chip
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

export default function EventAnalysis() {
	const [events, setEvents] = useState<any[]>([]);
	const [resolveDialog, setResolveDialog] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<any>(null);
	const [resolutionNotes, setResolutionNotes] = useState('');
	const { recentEvents } = useSocket();

	useEffect(() => { fetchEvents(); }, []);

	useEffect(() => {
		if (recentEvents.length) {
			// Prepend socket events to the list
			setEvents(prev => [...recentEvents, ...prev].slice(0, 200));
		}
	}, [recentEvents]);

	const fetchEvents = async () => {
		try {
			const res = await axios.get('/events', { params: { limit: 100 } });
			setEvents(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load events');
		}
	};

	const acknowledge = async (id: string) => {
		try {
			await axios.post(`/events/${id}/acknowledge`);
			toast.success('Event acknowledged');
			fetchEvents();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to acknowledge');
		}
	};

	const openResolveDialog = (event: any) => {
		setSelectedEvent(event);
		setResolutionNotes('');
		setResolveDialog(true);
	};

	const handleResolve = async () => {
		if (!resolutionNotes.trim()) {
			toast.error('Please enter resolution notes');
			return;
		}

		try {
			await axios.post(`/events/${selectedEvent._id}/resolve`, { resolution: resolutionNotes });
			toast.success('Event resolved successfully');
			setResolveDialog(false);
			setSelectedEvent(null);
			setResolutionNotes('');
			fetchEvents();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to resolve event');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#344767' }}>Event Analysis</Typography>
			<TableContainer component={Paper} sx={{ borderRadius: 3 }}>
				<Table>
					<TableHead sx={{ bgcolor: 'primary.main' }}>
						<TableRow>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Timestamp</TableCell>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Meter</TableCell>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
							<TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{events.map(e => (
							<TableRow key={e._id || e.eventId} hover>
								<TableCell>{new Date(e.timestamp || e.createdAt || Date.now()).toLocaleString()}</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>{e.meter?.meterNumber || e.meter}</TableCell>
								<TableCell>
									<Chip label={e.eventType} size="small" color="primary" variant="outlined" />
								</TableCell>
								<TableCell>{e.category}</TableCell>
								<TableCell>{e.description}</TableCell>
								<TableCell>
									{e.resolution ? (
										<Chip label="Resolved" size="small" color="success" />
									) : e.acknowledged ? (
										<Chip label="Acknowledged" size="small" color="warning" />
									) : (
										<Chip label="Pending" size="small" color="error" />
									)}
								</TableCell>
								<TableCell>
									<Box sx={{ display: 'flex', gap: 1 }}>
										{!e.acknowledged && (
											<Button onClick={() => acknowledge(e._id)} variant="outlined" size="small">
												Acknowledge
											</Button>
										)}
										{!e.resolution && (
											<Button onClick={() => openResolveDialog(e)} variant="contained" size="small" color="success">
												Resolve
											</Button>
										)}
									</Box>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Resolve Dialog */}
			<Dialog open={resolveDialog} onClose={() => setResolveDialog(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Resolve Event</DialogTitle>
				<DialogContent>
					{selectedEvent && (
						<Box sx={{ mb: 2, mt: 1 }}>
							<Typography variant="subtitle2" color="text.secondary">Event Details</Typography>
							<Typography variant="body2"><strong>Meter:</strong> {selectedEvent.meter?.meterNumber || selectedEvent.meter}</Typography>
							<Typography variant="body2"><strong>Type:</strong> {selectedEvent.eventType}</Typography>
							<Typography variant="body2"><strong>Description:</strong> {selectedEvent.description}</Typography>
						</Box>
					)}
					<TextField
						fullWidth
						multiline
						rows={4}
						label="Resolution Notes"
						value={resolutionNotes}
						onChange={(e) => setResolutionNotes(e.target.value)}
						placeholder="Describe how this event was resolved..."
						required
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setResolveDialog(false)}>Cancel</Button>
					<Button onClick={handleResolve} variant="contained" color="success">
						Resolve Event
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
