import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

export default function EventAnalysis() {
	const [events, setEvents] = useState<any[]>([]);
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

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>Event Analysis</Typography>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Timestamp</TableCell>
							<TableCell>Meter</TableCell>
							<TableCell>Type</TableCell>
							<TableCell>Category</TableCell>
							<TableCell>Description</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{events.map(e => (
							<TableRow key={e._id || e.eventId}>
								<TableCell>{new Date(e.timestamp || e.createdAt || Date.now()).toLocaleString()}</TableCell>
								<TableCell>{e.meter?.meterNumber || e.meter}</TableCell>
								<TableCell>{e.eventType}</TableCell>
								<TableCell>{e.category}</TableCell>
								<TableCell>{e.description}</TableCell>
								<TableCell>
									{!e.acknowledged && (
										<Button onClick={() => acknowledge(e._id)} variant="outlined">Acknowledge</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
