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
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  ElectricBolt,
  Business,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import AuthBackground from '../../components/AuthBackground';

const Register: React.FC = () => {
  const [registrationType, setRegistrationType] = useState<'user' | 'network'>('user');

  // User registration fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Customer network registration fields
  const [networkName, setNetworkName] = useState('');
  const [networkCode, setNetworkCode] = useState('');
  const [networkEmail, setNetworkEmail] = useState('');
  const [networkPhone, setNetworkPhone] = useState('');
  const [networkAddress, setNetworkAddress] = useState('');
  const [operatorFirstName, setOperatorFirstName] = useState('');
  const [operatorLastName, setOperatorLastName] = useState('');
  const [operatorUsername, setOperatorUsername] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [operatorConfirmPassword, setOperatorConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleUserRegistration = async (e: React.FormEvent) => {
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

  const handleNetworkRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (operatorPassword !== operatorConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!networkName || !networkCode || !networkEmail || !networkPhone || !networkAddress ||
        !operatorFirstName || !operatorLastName || !operatorUsername || !operatorPassword) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Register customer network with operator account
      await axios.post('/auth/register-network', {
        networkName,
        networkCode,
        networkEmail,
        networkPhone,
        networkAddress,
        operatorFirstName,
        operatorLastName,
        operatorUsername,
        operatorPassword,
      });

      toast.success('Customer network registered successfully. Please sign in with your operator credentials.');
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Network registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = registrationType === 'user' ? handleUserRegistration : handleNetworkRegistration;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      <AuthBackground />
      <Paper
        elevation={24}
        sx={{
          p: 6,
          width: '100%',
          maxWidth: registrationType === 'network' ? 800 : 480,
          borderRadius: 3,
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.35)',
          maxHeight: '90vh',
          overflow: 'auto',
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
            {registrationType === 'user' ? (
              <Person sx={{ fontSize: 40, color: 'white' }} />
            ) : (
              <Business sx={{ fontSize: 40, color: 'white' }} />
            )}
          </Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#344767' }}>
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#67748e', mb: 2 }}>
            {registrationType === 'user'
              ? 'Register to access the Smart HES dashboard'
              : 'Register your utility company as a customer network'}
          </Typography>

          {/* Registration Type Toggle */}
          <ToggleButtonGroup
            value={registrationType}
            exclusive
            onChange={(e, value) => value && setRegistrationType(value)}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="user">
              <Person sx={{ mr: 1 }} />
              Individual User
            </ToggleButton>
            <ToggleButton value="network">
              <Business sx={{ mr: 1 }} />
              Utility Company
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {registrationType === 'user' ? (
            // Individual User Registration Form
            <>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                variant="outlined"
                margin="normal"
                type={showPassword ? 'text' : 'password'}
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                variant="outlined"
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#67748e' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </>
          ) : (
            // Customer Network Registration Form
            <>
              <Typography variant="h6" gutterBottom sx={{ color: '#344767', fontWeight: 600, mb: 2 }}>
                Utility Company Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company/Network Name"
                    variant="outlined"
                    value={networkName}
                    onChange={(e) => setNetworkName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="e.g., Urabus Renewable Energy"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Network Code"
                    variant="outlined"
                    value={networkCode}
                    onChange={(e) => setNetworkCode(e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                    placeholder="e.g., URABUS"
                    helperText="Unique identifier for your network"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ElectricBolt sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Email"
                    variant="outlined"
                    type="email"
                    value={networkEmail}
                    onChange={(e) => setNetworkEmail(e.target.value)}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    variant="outlined"
                    value={networkPhone}
                    onChange={(e) => setNetworkPhone(e.target.value)}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Address"
                    variant="outlined"
                    value={networkAddress}
                    onChange={(e) => setNetworkAddress(e.target.value)}
                    required
                    disabled={loading}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ color: '#344767', fontWeight: 600, mb: 2 }}>
                Primary Operator Account
              </Typography>
              <Typography variant="body2" sx={{ color: '#67748e', mb: 2 }}>
                This will be your admin account for managing the network
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Operator First Name"
                    variant="outlined"
                    value={operatorFirstName}
                    onChange={(e) => setOperatorFirstName(e.target.value)}
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
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Operator Last Name"
                    variant="outlined"
                    value={operatorLastName}
                    onChange={(e) => setOperatorLastName(e.target.value)}
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
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    variant="outlined"
                    value={operatorUsername}
                    onChange={(e) => setOperatorUsername(e.target.value)}
                    required
                    disabled={loading}
                    helperText="This will be your login username"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    value={operatorPassword}
                    onChange={(e) => setOperatorPassword(e.target.value)}
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
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    value={operatorConfirmPassword}
                    onChange={(e) => setOperatorConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#67748e' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
              '&:hover': {
                background: 'linear-gradient(195deg, #42a5f5 0%, #1565c0 100%)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : registrationType === 'user' ? (
              'Create Account'
            ) : (
              'Register Utility Company'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#67748e' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 600, color: '#1A73E8' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;
