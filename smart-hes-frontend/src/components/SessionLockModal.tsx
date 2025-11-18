import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogTitle,
	Box,
	Typography,
	TextField,
	Button,
	IconButton,
	InputAdornment,
	Avatar,
	Alert,
} from '@mui/material';
import {
	Lock as LockIcon,
	Visibility,
	VisibilityOff,
	Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SessionLockModal: React.FC = () => {
	const { user, isSessionLocked, quickRelogin, logout } = useAuth();
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!password) {
			toast.error('Please enter your password');
			return;
		}

		setIsLoading(true);
		try {
			await quickRelogin(password);
			setPassword('');
		} catch (error) {
			// Error already shown by quickRelogin
		} finally {
			setIsLoading(false);
		}
	};

	const handleFullLogout = () => {
		logout();
		window.location.href = '/login';
	};

	if (!isSessionLocked) return null;

	return (
		<Dialog
			open={isSessionLocked}
			maxWidth="xs"
			fullWidth
			disableEscapeKeyDown
			onClose={(event, reason) => {
				if (reason !== 'backdropClick') {
					return;
				}
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
					<Avatar
						sx={{
							width: 80,
							height: 80,
							bgcolor: 'warning.main',
						}}
					>
						<LockIcon sx={{ fontSize: 40 }} />
					</Avatar>
				</Box>
				<Typography variant="h5" sx={{ fontWeight: 700, color: '#344767' }}>
					Session Locked
				</Typography>
			</DialogTitle>

			<DialogContent>
				<Box sx={{ textAlign: 'center', mb: 3 }}>
					<Alert severity="info" sx={{ mb: 2 }}>
						Your session has been locked due to 10 minutes of inactivity
					</Alert>

					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 1,
							mb: 3,
							p: 2,
							bgcolor: '#f5f5f5',
							borderRadius: 2,
						}}
					>
						<PersonIcon color="primary" />
						<Typography variant="h6" sx={{ fontWeight: 600 }}>
							{user?.username || 'User'}
						</Typography>
					</Box>

					<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
						Please re-enter your password to unlock your session
					</Typography>

					<Box component="form" onSubmit={handleUnlock}>
						<TextField
							fullWidth
							type={showPassword ? 'text' : 'password'}
							label="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoFocus
							disabled={isLoading}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											onClick={() => setShowPassword(!showPassword)}
											edge="end"
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}
							sx={{ mb: 2 }}
						/>

						<Button
							fullWidth
							type="submit"
							variant="contained"
							size="large"
							disabled={isLoading || !password}
							sx={{
								background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
								mb: 1,
							}}
						>
							{isLoading ? 'Unlocking...' : 'Unlock Session'}
						</Button>

						<Button
							fullWidth
							variant="text"
							color="error"
							onClick={handleFullLogout}
							disabled={isLoading}
						>
							Logout Completely
						</Button>
					</Box>
				</Box>
			</DialogContent>
		</Dialog>
	);
};

export default SessionLockModal;
