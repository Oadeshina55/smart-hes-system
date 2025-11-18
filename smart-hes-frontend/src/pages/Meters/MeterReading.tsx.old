import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField, Typography, Switch, FormControlLabel, Grid, Table, TableHead, TableRow, TableCell, TableBody, Checkbox } from '@mui/material';
// Expand icon removed - not needed after UI update
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

export default function MeterReading() {
	const [meterIdOrNumber, setMeterIdOrNumber] = useState('');
	const [loading, setLoading] = useState(false);
	const [settingsJson, setSettingsJson] = useState('');
	const [currentReading, setCurrentReading] = useState<any>(null);
	const [writeToMeter, setWriteToMeter] = useState(false);
	const { socket, recentEvents } = useSocket();
	const [obisGroups, setObisGroups] = useState<any[]>([]);
	const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(0);
	const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!socket) return;

		const handler = (data: any) => {
			// If the update is for our selected meter, show it
			if (!meterIdOrNumber) return;
			const idMatch = String(data.meterId) === String(meterIdOrNumber);
			const numberMatch = String(data.meterNumber)?.toUpperCase() === String(meterIdOrNumber).toUpperCase();
			if (idMatch || numberMatch) {
				setCurrentReading(data.reading);
				toast.success('Meter reading received');
			}
		};

		socket.on('meter-reading-update', handler);
		return () => {
			socket.off('meter-reading-update', handler);
		};
	}, [socket, meterIdOrNumber]);

	useEffect(() => {
		// when obisGroups updated, default select first group and all items
		if (obisGroups && obisGroups.length) {
			setSelectedGroupIdx(0);
			const initial: Record<string, boolean> = {};
			obisGroups[0].items?.forEach((it: any) => {
				initial[it.code || it.name] = true;
			});
			setSelectedItems(initial);
		}
	}, [obisGroups]);

	const handleGroupSelect = (idx: number) => {
		setSelectedGroupIdx(idx);
		const initial: Record<string, boolean> = {};
		(obisGroups[idx]?.items || []).forEach((it: any) => {
			initial[it.code || it.name] = true;
		});
		setSelectedItems(initial);
	};

	const toggleItem = (code: string) => {
		setSelectedItems(prev => ({ ...prev, [code]: !prev[code] }));
	};

	const isAllSelected = () => {
		const items = obisGroups[selectedGroupIdx]?.items || [];
		if (!items.length) return false;
		return items.every((it: any) => selectedItems[it.code || it.name]);
	};

	const toggleSelectAll = () => {
		const items = obisGroups[selectedGroupIdx]?.items || [];
		const all = isAllSelected();
		const updated: Record<string, boolean> = { ...selectedItems };
		items.forEach((it: any) => {
			updated[it.code || it.name] = !all;
		});
		setSelectedItems(updated);
	};

	const requestRead = async () => {
		if (!meterIdOrNumber) return toast.error('Enter meter id or number');
		setLoading(true);
		try {
			const resp = await axios.post(`/meters/${encodeURIComponent(meterIdOrNumber)}/read`);
			toast.success(resp.data?.message || 'Read requested');
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to request read');
		} finally {
			setLoading(false);
		}
	};

	const fetchSettings = async () => {
		if (!meterIdOrNumber) return toast.error('Enter meter id or number');
		setLoading(true);
		try {
			const resp = await axios.get(`/meters/${encodeURIComponent(meterIdOrNumber)}/settings`);
			const { obisConfiguration, metadata } = resp.data.data;
			setSettingsJson(JSON.stringify({ obisConfiguration, metadata }, null, 2));
			setObisGroups(obisConfiguration || []);
			toast.success('Settings fetched');
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to fetch settings');
		} finally {
			setLoading(false);
		}
	};

	const saveSettings = async () => {
		if (!meterIdOrNumber) return toast.error('Enter meter id or number');
		let parsed: any = {};
		try {
			parsed = JSON.parse(settingsJson || '{}');
		} catch (e) {
			return toast.error('Settings JSON is invalid');
		}

		setLoading(true);
		try {
			const resp = await axios.post(`/meters/${encodeURIComponent(meterIdOrNumber)}/settings`, {
				settings: parsed.obisConfiguration || parsed.settings || parsed,
				metadata: parsed.metadata || {},
				writeToMeter: writeToMeter,
			});

			toast.success(resp.data?.message || 'Settings saved');
			// update local view
			setSettingsJson(JSON.stringify(resp.data.data, null, 2));
		} catch (err: any) {
			toast.error(err.response?.data?.message || 'Failed to save settings');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h5" gutterBottom>Meter Reading & Settings</Typography>

			<Paper sx={{ p: 2, mb: 2 }}>
				<TextField
					label="Meter ID or Meter Number"
					value={meterIdOrNumber}
					onChange={(e) => setMeterIdOrNumber(e.target.value)}
					fullWidth
					sx={{ mb: 2 }}
				/>

				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button variant="contained" onClick={requestRead} disabled={loading}>Request Read</Button>
					<Button variant="outlined" onClick={fetchSettings} disabled={loading}>Fetch Settings</Button>
					<Button color="success" variant="contained" onClick={saveSettings} disabled={loading}>Save Settings</Button>
					<FormControlLabel control={<Switch checked={writeToMeter} onChange={(e) => setWriteToMeter(e.target.checked)} />} label="Write to meter" />
				</Box>
			</Paper>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2 }}>
						<Typography variant="h6">Current Reading</Typography>
						{currentReading ? (
							<div style={{ maxHeight: 400, overflow: 'auto' }}>
								<pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(currentReading, null, 2)}</pre>
							</div>
						) : (
							<Typography color="textSecondary">No reading yet for selected meter.</Typography>
						)}
					</Paper>
				</Grid>

				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2 }}>
						<Typography variant="h6">On Demand Reading</Typography>
						{obisGroups && obisGroups.length ? (
							<Box>
								{/* Group tiles */}
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
									{obisGroups.map((group: any, idx: number) => (
										<Button
											key={idx}
											variant={selectedGroupIdx === idx ? 'contained' : 'outlined'}
											sx={{
												textTransform: 'none',
												backgroundColor: selectedGroupIdx === idx ? 'primary.main' : '#eee',
												color: selectedGroupIdx === idx ? 'white' : 'text.primary',
												px: 2,
												py: 1.2,
											}}
											onClick={() => handleGroupSelect(idx)}
										>
											{group.name}
										</Button>
									))}
								</Box>

								{/* Items table for selected group */}
								<Box>
									<Table size="small">
										<TableHead>
											<TableRow sx={{ backgroundColor: 'primary.main', '& th': { color: 'white', fontWeight: 600 } }}>
												<TableCell>
													<Checkbox checked={isAllSelected()} onChange={toggleSelectAll} sx={{ color: 'white' }} />
													Select All Item
												</TableCell>
												<TableCell>Value</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{(obisGroups[selectedGroupIdx]?.items || []).map((it: any, i: number) => {
												const code = it.code || it.name || String(i);
												const checked = !!selectedItems[code];
												const value = currentReading && currentReading[it.code] !== undefined ? String(currentReading[it.code]) : '-';
												return (
													<TableRow key={code} sx={checked ? { backgroundColor: 'rgba(2,119,189,0.08)' } : {}}>
														<TableCell>
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
															<Checkbox checked={checked} onChange={() => toggleItem(code)} />
															<Box>
																<Typography variant="body2" sx={{ fontWeight: 600 }}>{it.name || code}</Typography>
																<Typography variant="caption" color="textSecondary">Code: {it.code}</Typography>
															</Box>
															</Box>
														</TableCell>
														<TableCell>{value}</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</Box>
							</Box>
						) : (
							<Typography color="textSecondary">No OBIS configuration loaded. Fetch settings to load meter OBIS parameters.</Typography>
						)}
					</Paper>
				</Grid>
			</Grid>

			<Paper sx={{ p: 2, mt: 2 }}>
				<Typography variant="h6">Raw Settings (JSON)</Typography>
				<TextField
					value={settingsJson}
					onChange={(e) => setSettingsJson(e.target.value)}
					multiline
					rows={8}
					fullWidth
					placeholder='{"obisConfiguration": {...}, "metadata": {...}}'
				/>
			</Paper>

			<Paper sx={{ p: 2, mt: 2 }}>
				<Typography variant="h6">Recent Events</Typography>
				{recentEvents && recentEvents.length ? (
					<ul>
						{recentEvents.slice(0, 10).map((ev: any) => (
							<li key={ev._id || ev.id || JSON.stringify(ev)}>
								{new Date(ev.timestamp || ev.createdAt || Date.now()).toLocaleString()} - {ev.description || ev.eventType}
							</li>
						))}
					</ul>
				) : (
					<Typography color="textSecondary">No recent events</Typography>
				)}
			</Paper>
		</Box>
	);
}
