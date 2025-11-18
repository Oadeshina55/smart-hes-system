import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  VerifiedUser,
  Refresh,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AuthBackground from '../../components/AuthBackground';
import axios from 'axios';
import toast from 'react-hot-toast';
const Login: React.FC = () => {
  // Tab state: 0 = Regular Login, 1 = OTP Login
  const [tabValue, setTabValue] = useState(0);

  // Regular login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP login states
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Passcode state (replaces CAPTCHA)
  const [sessionPasscode, setSessionPasscode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [userPasscode, setUserPasscode] = useState('');
  const [loadingPasscode, setLoadingPasscode] = useState(true);

  // General states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // Generate passcode on mount
  useEffect(() => {
    generateNewPasscode();
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Generate new login passcode
  const generateNewPasscode = async () => {
    setLoadingPasscode(true);
    try {
      const response = await axios.post('/auth/generate-passcode');
      if (response.data.success) {
        setSessionPasscode(response.data.data.passcode);
        setSessionId(response.data.data.sessionId);
        setUserPasscode(''); // Clear user input
      }
    } catch (err) {
      console.error('Failed to generate passcode:', err);
      toast.error('Failed to generate login passcode');
    } finally {
      setLoadingPasscode(false);
    }
  };

  // Regular login with passcode verification
  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    if (!userPasscode) {
      setError('Please enter the passcode shown above');
      return;
    }

    if (userPasscode.toUpperCase() !== sessionPasscode) {
      setError('Invalid passcode. Please check and try again.');
      return;
    }

    setLoading(true);

    try {
      // Login with username, password, passcode, and sessionId
      const response = await axios.post('/auth/login', {
        username,
        password,
        passcode: userPasscode,
        sessionId,
      });

      const { user, token } = response.data.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('savedUsername', username);
      localStorage.setItem('lastActivity', Date.now().toString());

      toast.success('Login successful!');
      navigate('/dashboard');
      window.location.reload(); // Refresh to update auth context
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      toast.error('Login failed');
      // Generate new passcode after failed attempt
      generateNewPasscode();
    } finally {
      setLoading(false);
    }
  };

  // Request OTP for email-based login
  const handleRequestOTP = async () => {
    setError('');

    if (!otpEmail) {
      setError('Please enter your email or username');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/request-otp', {
        email: otpEmail.includes('@') ? otpEmail : undefined,
        username: !otpEmail.includes('@') ? otpEmail : undefined,
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(600); // 10 minutes
        setCanResend(false);
        toast.success('OTP sent to your email!');
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/verify-otp', {
        email: otpEmail.includes('@') ? otpEmail : undefined,
        username: !otpEmail.includes('@') ? otpEmail : undefined,
        otp: otpCode,
      });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        toast.success('Login successful!');
        navigate('/dashboard');
        window.location.reload(); // Refresh to update auth context
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/resend-otp', {
        email: otpEmail.includes('@') ? otpEmail : undefined,
        username: !otpEmail.includes('@') ? otpEmail : undefined,
      });

      if (response.data.success) {
        setOtpTimer(600);
        setCanResend(false);
        toast.success('OTP resent successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          maxWidth: 500,
          borderRadius: 3,
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.5px' }}
          >
            🔐 Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ color: '#8892a4', fontWeight: 400, mt: 1 }}>
            Sign in to New Hampshire Capital HES
          </Typography>
        </Box>

        {/* Login Method Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => {
            setTabValue(newValue);
            setError('');
            setOtpSent(false);
          }}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Password Login" icon={<Lock />} iconPosition="start" />
          <Tab label="OTP Login" icon={<Email />} iconPosition="start" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Regular Password Login */}
        {tabValue === 0 && (
          <form onSubmit={handleRegularLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
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
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Remember me"
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Stack>

            {/* Login Passcode */}
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" icon={<Security />} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Your unique login passcode:
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 2,
                    textAlign: 'center',
                    border: '2px dashed #667eea',
                  }}
                >
                  {loadingPasscode ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 8,
                        fontFamily: 'monospace',
                        color: '#667eea',
                      }}
                    >
                      {sessionPasscode}
                    </Typography>
                  )}
                </Box>
              </Alert>

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  label="Enter Passcode"
                  variant="outlined"
                  value={userPasscode}
                  onChange={(e) => setUserPasscode(e.target.value.toUpperCase())}
                  disabled={loading || loadingPasscode}
                  inputProps={{
                    maxLength: 6,
                    style: { textTransform: 'uppercase', letterSpacing: 4 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedUser color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={generateNewPasscode}
                  disabled={loading || loadingPasscode}
                  sx={{
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 1 }}>
                Type the passcode shown above to verify you're human
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a4193 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        )}

        {/* OTP-Based Login */}
        {tabValue === 1 && (
          <>
            {!otpSent ? (
              <Box>
                <Alert severity="info" icon={<Security />} sx={{ mb: 3 }}>
                  Enter your email or username. We'll send a verification code to your registered email.
                </Alert>

                <TextField
                  fullWidth
                  label="Email or Username"
                  variant="outlined"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleRequestOTP}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3d94e5 0%, #00d9e5 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <Alert severity="success" icon={<Email />} sx={{ mb: 3 }}>
                  OTP sent to your email! Please check your inbox.
                </Alert>

                <TextField
                  fullWidth
                  label="Enter 6-Digit OTP"
                  variant="outlined"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedUser color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Chip
                    label={`Expires in ${formatTime(otpTimer)}`}
                    color={otpTimer > 120 ? 'success' : 'warning'}
                    size="small"
                  />
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                  >
                    Resend OTP
                  </Button>
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otpCode.length !== 6}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3ad069 0%, #2fe0c5 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Sign In'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setOtpTimer(0);
                  }}
                  sx={{ mt: 2 }}
                >
                  Use different email
                </Button>
              </form>
            )}
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register" fontWeight={600}>
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
