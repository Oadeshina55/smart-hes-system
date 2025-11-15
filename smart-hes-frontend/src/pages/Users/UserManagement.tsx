import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UserManagement() {
	const [users, setUsers] = useState<any[]>([]);

	useEffect(() => { fetchUsers(); }, []);

	const fetchUsers = async () => {
		try {
			const res = await axios.get('/users');
			setUsers(res.data.data || []);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load users');
		}
	};

	const changeRole = async (id: string, role: string) => {
		try {
			await axios.put(`/users/${id}`, { role });
			toast.success('Role updated');
			fetchUsers();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to update role');
		}
	};

	const deactivate = async (id: string) => {
		try {
			await axios.delete(`/users/${id}`);
			toast.success('User deactivated');
			fetchUsers();
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to deactivate user');
		}
	};

	return (
		<Box>
			<Typography variant="h4" sx={{ mb: 2 }}>User Management</Typography>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Username</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Role</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{users.map(u => (
							<TableRow key={u._id}>
								<TableCell>{u.username}</TableCell>
								<TableCell>{u.email}</TableCell>
								<TableCell>
									<Select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
										<MenuItem value="admin">admin</MenuItem>
										<MenuItem value="operator">operator</MenuItem>
										<MenuItem value="customer">customer</MenuItem>
									</Select>
								</TableCell>
								<TableCell>
									<Button color="error" onClick={() => deactivate(u._id)}>Deactivate</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
