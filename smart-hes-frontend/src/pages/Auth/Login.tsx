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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AuthBackground from '../../components/AuthBackground';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          maxWidth: 450,
          borderRadius: 3,
          position: 'relative',
          zIndex: 2,
          // translucent card with blur
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.5px' }}
          >
            Welcome back
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: '#8892a4', fontWeight: 400, mt: 1 }}
          >
            Enter your username and password to sign in
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
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

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
                disabled={loading}
              />
            }
            label={<Typography variant="body2" sx={{ color: '#8892a4' }}>Remember me</Typography>}
            sx={{ mt: 1, mb: 1 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 2,
              mb: 2,
              borderRadius: 2,
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              py: 1.2,
              background: loading 
                ? '#ccc'
                : '#1a73e8',
              boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)',
              '&:hover': {
                background: '#1557b0',
                boxShadow: '0 6px 16px rgba(26, 115, 232, 0.35)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <Box sx={{ mt: 2.5, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#8892a4' }}>
            Don't have an account?{' '}
            <Link 
              component={RouterLink} 
              to="/register" 
              underline="none"
              sx={{ 
                color: '#1a73e8', 
                fontWeight: 600,
                '&:hover': { color: '#1557b0' }
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>

        {/* <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#8392AB' }}>
            Default Admin Credentials:
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: '#67748e' }}>
            Username: admin | Password: Admin@123456
          </Typography>
        </Box> */}
      </Paper>
    </Box>
  );
};

export default Login;
