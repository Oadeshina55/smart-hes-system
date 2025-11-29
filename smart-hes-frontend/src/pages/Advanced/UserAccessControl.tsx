import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'customer';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions?: string[];
  assignedAreas?: Array<{ _id: string; name: string; code: string }>;
  createdAt: string;
}

interface Area {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'meters.view', label: 'View Meters', category: 'Meters' },
  { id: 'meters.create', label: 'Create Meters', category: 'Meters' },
  { id: 'meters.edit', label: 'Edit Meters', category: 'Meters' },
  { id: 'meters.delete', label: 'Delete Meters', category: 'Meters' },
  { id: 'meters.read', label: 'Read Meter Data', category: 'Meters' },
  { id: 'customers.view', label: 'View Customers', category: 'Customers' },
  { id: 'customers.create', label: 'Create Customers', category: 'Customers' },
  { id: 'customers.edit', label: 'Edit Customers', category: 'Customers' },
  { id: 'customers.delete', label: 'Delete Customers', category: 'Customers' },
  { id: 'billing.view', label: 'View Billing', category: 'Billing' },
  { id: 'billing.create', label: 'Create Billing', category: 'Billing' },
  { id: 'billing.edit', label: 'Edit Billing', category: 'Billing' },
  { id: 'events.view', label: 'View Events', category: 'Events' },
  { id: 'events.acknowledge', label: 'Acknowledge Events', category: 'Events' },
  { id: 'firmware.view', label: 'View Firmware', category: 'Firmware' },
  { id: 'firmware.upload', label: 'Upload Firmware', category: 'Firmware' },
  { id: 'users.view', label: 'View Users', category: 'Users' },
  { id: 'users.create', label: 'Create Users', category: 'Users' },
  { id: 'users.edit', label: 'Edit Users', category: 'Users' },
  { id: 'users.delete', label: 'Delete Users', category: 'Users' },
  { id: 'security.audit', label: 'View Security Audit', category: 'Security' },
  { id: 'reports.view', label: 'View Reports', category: 'Reports' },
  { id: 'reports.export', label: 'Export Reports', category: 'Reports' },
];

const UserAccessControl: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [assignedAreaIds, setAssignedAreaIds] = useState<string[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/users');
      setUsers(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await axios.get('/areas');
      setAreas(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch areas:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAreas();
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setPermissions(user.permissions || []);
    setAssignedAreaIds(user.assignedAreas?.map(a => a._id) || []);
    setEditDialogOpen(true);
  };

  const handleTogglePermission = (permissionId: string) => {
    setPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleToggleArea = (areaId: string) => {
    setAssignedAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        permissions,
      };

      // Only include assignedAreas for customer users
      if (selectedUser.role === 'customer') {
        updateData.assignedAreas = assignedAreaIds;
      }

      await axios.patch(`/users/${selectedUser._id}`, updateData);
      toast.success('User settings updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user settings');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/users/${userId}`, {
        isActive: !currentStatus,
      });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'operator':
      case 'customer':
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      admin: 'error',
      operator: 'primary',
      customer: 'success',
    };
    return colors[role] || 'default';
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              User Access Control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage user roles and permissions
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AdminIcon sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Administrators
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {users.filter(u => u.role === 'admin').length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Operators
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {users.filter(u => u.role === 'operator').length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Active Users
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {users.filter(u => u.isActive).length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            System Users
          </Typography>
          {users.length === 0 ? (
            <Alert severity="info">No users found</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Assigned Areas</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Last Login</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getRoleIcon(user.role)}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role.toUpperCase()}
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {user.role === 'customer' ? (
                          user.assignedAreas && user.assignedAreas.length > 0 ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {user.assignedAreas.map((area) => (
                                <Chip
                                  key={area._id}
                                  label={area.name}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="error">
                              No areas assigned
                            </Typography>
                          )
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            All areas
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.isActive ? <UnlockIcon /> : <LockIcon />}
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? format(new Date(user.lastLogin), 'PPp') : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={user.isActive ? 'error' : 'success'}
                            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                          >
                            {user.isActive ? <LockIcon /> : <UnlockIcon />}
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <SecurityIcon />
                <Typography variant="h6">
                  Manage Permissions - {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>User:</strong> {selectedUser.username} ({selectedUser.email})
                </Typography>
                <Typography variant="body2">
                  <strong>Role:</strong> {selectedUser.role.toUpperCase()}
                </Typography>
              </Alert>
              <Divider sx={{ my: 2 }} />

              {/* Area Access Control for Customer Users */}
              {selectedUser.role === 'customer' && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Area Access Control
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Customer users can only access meters and data from their assigned areas.
                    Select the areas this customer should have access to.
                  </Alert>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {areas.length === 0 ? (
                      <Grid item xs={12}>
                        <Alert severity="info">No areas found. Please create areas first.</Alert>
                      </Grid>
                    ) : (
                      areas.map((area) => (
                        <Grid item xs={12} sm={6} md={4} key={area._id}>
                          <Card
                            variant="outlined"
                            sx={{
                              border: assignedAreaIds.includes(area._id) ? 2 : 1,
                              borderColor: assignedAreaIds.includes(area._id) ? 'primary.main' : 'divider',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: 2,
                              }
                            }}
                            onClick={() => handleToggleArea(area._id)}
                          >
                            <CardContent>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Checkbox
                                  checked={assignedAreaIds.includes(area._id)}
                                  onChange={() => handleToggleArea(area._id)}
                                />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {area.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Code: {area.code}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    )}
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Typography variant="h6" sx={{ mb: 2 }}>
                Permissions
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <Grid item xs={12} md={6} key={category}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {category}
                        </Typography>
                        <FormGroup>
                          {perms.map((perm) => (
                            <FormControlLabel
                              key={perm.id}
                              control={
                                <Checkbox
                                  checked={permissions.includes(perm.id)}
                                  onChange={() => handleTogglePermission(perm.id)}
                                />
                              }
                              label={<Typography variant="body2">{perm.label}</Typography>}
                            />
                          ))}
                        </FormGroup>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserAccessControl;
