import React, { useEffect, useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	Grid,
	Typography,
	TextField,
	Button,
	Avatar,
	Divider,
	CircularProgress,
	Stack,
	Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Profile() {
	// Profile management
	useAuth();
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [profileData, setProfileData] = useState<any>(null);
	const [formData, setFormData] = useState<any>(null);

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const res = await axios.get('/auth/me');
			setProfileData(res.data.data || res.data);
			setFormData(res.data.data || res.data);
		} catch (err: any) {
			console.error(err);
			toast.error('Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = () => {
		setEditing(true);
		setFormData({ ...profileData });
	};

	const handleCancel = () => {
		setEditing(false);
		setFormData(profileData);
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData({ ...formData, [field]: value });
	};

	const handleSave = async () => {
		try {
			setLoading(true);
			await axios.put(`/users/${profileData._id}`, {
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
			});
			setProfileData(formData);
			setEditing(false);
			toast.success('Profile updated successfully');
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data?.message || 'Failed to update profile');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!profileData) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography color="error">Failed to load profile data</Typography>
			</Box>
		);
	}

	const getInitials = () => {
		const first = profileData.firstName?.[0]?.toUpperCase() || 'U';
		const last = profileData.lastName?.[0]?.toUpperCase() || '';
		return first + last;
	};

	const getRoleColor = (role: string) => {
		const colors: Record<string, 'error' | 'warning' | 'success' | 'info'> = {
			admin: 'error',
			operator: 'warning',
			customer: 'success',
		};
		return colors[role?.toLowerCase()] || 'info';
	};

	return (
		<Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
			<Box sx={{ mb: 4 }}>
				<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
					User Profile
				</Typography>
				<Divider sx={{ mt: 2 }} />
			</Box>

			<Grid container spacing={3}>
				{/* Profile Card */}
				<Grid item xs={12} md={4}>
					<Card
						sx={{
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							textAlign: 'center',
							p: 3,
						}}
					>
						<Avatar
							sx={{
								width: 100,
								height: 100,
								mx: 'auto',
								mb: 2,
								backgroundColor: 'rgba(255, 255, 255, 0.3)',
								fontSize: '2rem',
								fontWeight: 600,
							}}
						>
							{getInitials()}
						</Avatar>
						<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
							{profileData.firstName || 'User'} {profileData.lastName || ''}
						</Typography>
						<Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', mb: 2 }}>
							{profileData.email}
						</Typography>
						<Chip
							icon={<AdminPanelSettingsIcon />}
							label={profileData.role?.toUpperCase()}
							color={getRoleColor(profileData.role)}
							variant="outlined"
							sx={{
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								borderColor: 'rgba(255, 255, 255, 0.5)',
								color: 'white',
								fontWeight: 600,
								fontSize: '0.75rem',
								mb: 2,
							}}
						/>
						<Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.8rem', mt: 2 }}>
							Account created on{'\n'}
							{new Date(profileData.createdAt || Date.now()).toLocaleDateString()}
						</Typography>
					</Card>
				</Grid>

				{/* Details Card */}
				<Grid item xs={12} md={8}>
					<Card>
						<CardContent sx={{ p: 3 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
								<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#333' }}>
									Personal Information
								</Typography>
								{!editing && (
									<Button
										startIcon={<EditIcon />}
										onClick={handleEdit}
										variant="outlined"
										size="small"
										sx={{ fontSize: '0.8rem' }}
									>
										Edit
									</Button>
								)}
							</Box>
							<Divider sx={{ mb: 2 }} />

							{editing ? (
								<Stack spacing={2}>
									<TextField
										fullWidth
										label="First Name"
										value={formData.firstName || ''}
										onChange={(e) => handleInputChange('firstName', e.target.value)}
										size="small"
										variant="outlined"
										InputProps={{ style: { fontSize: '0.9rem' } }}
										InputLabelProps={{ style: { fontSize: '0.9rem' } }}
									/>
									<TextField
										fullWidth
										label="Last Name"
										value={formData.lastName || ''}
										onChange={(e) => handleInputChange('lastName', e.target.value)}
										size="small"
										variant="outlined"
										InputProps={{ style: { fontSize: '0.9rem' } }}
										InputLabelProps={{ style: { fontSize: '0.9rem' } }}
									/>
									<TextField
										fullWidth
										label="Email"
										type="email"
										value={formData.email || ''}
										onChange={(e) => handleInputChange('email', e.target.value)}
										size="small"
										variant="outlined"
										InputProps={{ style: { fontSize: '0.9rem' } }}
										InputLabelProps={{ style: { fontSize: '0.9rem' } }}
									/>
									<Box sx={{ display: 'flex', gap: 1 }}>
										<Button
											startIcon={<SaveIcon />}
											onClick={handleSave}
											variant="contained"
											size="small"
											sx={{ fontSize: '0.8rem' }}
										>
											Save
										</Button>
										<Button
											startIcon={<CancelIcon />}
											onClick={handleCancel}
											variant="outlined"
											size="small"
											sx={{ fontSize: '0.8rem' }}
										>
											Cancel
										</Button>
									</Box>
								</Stack>
							) : (
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
											<PersonIcon sx={{ fontSize: '1rem', color: '#667eea' }} />
											<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
												First Name
											</Typography>
										</Box>
										<Typography sx={{ fontSize: '0.95rem', fontWeight: 500, ml: 4 }}>
											{profileData.firstName || '—'}
										</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
											<PersonIcon sx={{ fontSize: '1rem', color: '#667eea' }} />
											<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
												Last Name
											</Typography>
										</Box>
										<Typography sx={{ fontSize: '0.95rem', fontWeight: 500, ml: 4 }}>
											{profileData.lastName || '—'}
										</Typography>
									</Grid>
									<Grid item xs={12}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
											<EmailIcon sx={{ fontSize: '1rem', color: '#667eea' }} />
											<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
												Email Address
											</Typography>
										</Box>
										<Typography sx={{ fontSize: '0.95rem', fontWeight: 500, ml: 4 }}>
											{profileData.email}
										</Typography>
									</Grid>
									<Grid item xs={12}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
											<AdminPanelSettingsIcon sx={{ fontSize: '1rem', color: '#667eea' }} />
											<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
												Role
											</Typography>
										</Box>
										<Typography sx={{ fontSize: '0.95rem', fontWeight: 500, ml: 4 }}>
											{profileData.role?.toUpperCase()}
										</Typography>
									</Grid>
								</Grid>
							)}
						</CardContent>
					</Card>

					{/* Account Info Card */}
					<Card sx={{ mt: 2 }}>
						<CardContent sx={{ p: 3 }}>
							<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#333', mb: 2 }}>
								Account Information
							</Typography>
							<Divider sx={{ mb: 2 }} />
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
										User ID
									</Typography>
									<Typography sx={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#999' }}>
										{profileData._id}
									</Typography>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
										Account Status
									</Typography>
									<Chip
										label={profileData.isActive ? 'Active' : 'Inactive'}
										color={profileData.isActive ? 'success' : 'error'}
										size="small"
										sx={{ fontSize: '0.75rem' }}
									/>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
										Created At
									</Typography>
									<Typography sx={{ fontSize: '0.85rem' }}>
										{new Date(profileData.createdAt || Date.now()).toLocaleString()}
									</Typography>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
										Last Updated
									</Typography>
									<Typography sx={{ fontSize: '0.85rem' }}>
										{new Date(profileData.updatedAt || Date.now()).toLocaleString()}
									</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
}
