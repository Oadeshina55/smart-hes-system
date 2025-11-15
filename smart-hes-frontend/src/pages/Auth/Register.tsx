import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock, Email, ElectricBolt } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import AuthBackground from '../../components/AuthBackground';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/register', {
        username,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        password,
      });

      toast.success('Account created. Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AuthBackground />
      <Paper
        elevation={24}
        sx={{
          p: 6,
          width: '100%',
          maxWidth: 480,
          borderRadius: 3,
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.35)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.14)',
            }}
          >
            <ElectricBolt sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#344767' }}>
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#67748e' }}>
            Register to access the Smart HES dashboard
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#67748e' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#67748e' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            fullWidth
            label="First Name (Optional)"
            variant="outlined"
            margin="normal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#67748e' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Last Name (Optional)"
            variant="outlined"
            margin="normal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#67748e' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#67748e' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              background: loading
                ? '#ccc'
                : 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
              boxShadow: '0 3px 3px 0 rgba(0, 0, 0, 0.15)',
              '&:hover': {
                boxShadow: '0 14px 26px -12px rgba(73, 163, 241, 0.4)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#67748e' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
