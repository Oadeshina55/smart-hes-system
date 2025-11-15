import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ElectricBolt,
  People,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore,
  LocationOn,
  Speed,
  EventNote,
  SignalWifi4Bar,
  Wifi,
  AccountCircle,
  Logout,
  Notifications,
  Warning,
  Brightness4,
  Brightness7,
  SimCard,
  ReadMore,
  SettingsSuggest,
  PersonAdd,
  Upload,
  MonitorHeart,
  QueryStats,
  BatteryChargingFull,
  ControlCamera,
  Group,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const drawerWidth = 280;

interface MenuItemType {
  title: string;
  path?: string;
  icon: React.ReactElement;
  children?: MenuItemType[];
  roles?: string[];
}

const menuItems: MenuItemType[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <Dashboard />,
  },
  {
    title: 'System',
    icon: <Settings />,
    children: [
      {
        title: 'Area Management',
        path: '/system/areas',
        icon: <LocationOn />,
        roles: ['admin', 'operator'],
      },
    ],
  },
  {
    title: 'Meter Management',
    icon: <ElectricBolt />,
    children: [
      {
        title: 'All Meters',
        path: '/meters',
        icon: <ElectricBolt />,
      },
      {
        title: 'Add Meter',
        path: '/meters/add',
        icon: <ElectricBolt />,
        roles: ['admin', 'operator'],
      },
      {
        title: 'SIM Management',
        path: '/meters/sims',
        icon: <SimCard />,
        roles: ['admin', 'operator'],
      },
      {
        title: 'Meter Reading',
        path: '/meters/reading',
        icon: <ReadMore />,
      },
      {
        title: 'Meter Settings',
        path: '/meters/settings',
        icon: <SettingsSuggest />,
        roles: ['admin', 'operator'],
      },
    ],
  },
  {
    title: 'Customer Management',
    icon: <People />,
    children: [
      {
        title: 'All Customers',
        path: '/customers',
        icon: <People />,
      },
      {
        title: 'Import Customers',
        path: '/customers/import',
        icon: <Upload />,
        roles: ['admin', 'operator'],
      },
    ],
  },
  {
    title: 'Task Query',
    icon: <QueryStats />,
    children: [
      {
        title: 'Real-Time Monitoring',
        path: '/task-query/monitoring',
        icon: <MonitorHeart />,
      },
      {
        title: 'Event Analysis',
        path: '/task-query/events',
        icon: <EventNote />,
      },
      {
        title: 'Online Rate',
        path: '/task-query/online-rate',
        icon: <SignalWifi4Bar />,
      },
    ],
  },
  {
    title: 'Consumption Report',
    icon: <Assessment />,
    children: [
      {
        title: 'Energy Consumption',
        path: '/reports/consumption',
        icon: <BatteryChargingFull />,
      },
    ],
  },
  {
    title: 'Remote',
    icon: <Wifi />,
    children: [
      {
        title: 'Remote Loading',
        path: '/remote/loading',
        icon: <BatteryChargingFull />,
        roles: ['admin', 'operator'],
      },
      {
        title: 'Remote Control',
        path: '/remote/control',
        icon: <ControlCamera />,
        roles: ['admin', 'operator'],
      },
    ],
  },
  {
    title: 'User Management',
    path: '/users',
    icon: <Group />,
    roles: ['admin'],
  },
];

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [darkMode, setDarkMode] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeAlerts } = useSocket();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (title: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    handleCloseMenu();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasAccess = (item: MenuItemType) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  };

  const drawer = (
    <div>
      <Toolbar sx={{ 
        background: 'linear-gradient(195deg, #49a3f1 0%, #1A73E8 100%)',
        color: 'white'
      }}>
        <ElectricBolt sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          HES Core
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          if (!hasAccess(item)) return null;

          if (item.children) {
            return (
              <div key={item.title}>
                <ListItemButton onClick={() => handleMenuClick(item.title)}>
                  <ListItemIcon sx={{ color: '#67748e' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    sx={{ color: '#67748e' }}
                  />
                  {openMenus[item.title] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openMenus[item.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      if (!hasAccess(child)) return null;
                      return (
                        <ListItemButton
                          key={child.path}
                          sx={{ 
                            pl: 4,
                            background: location.pathname === child.path ? 
                              'linear-gradient(195deg, rgba(73,163,241,0.1) 0%, rgba(26,115,232,0.1) 100%)' : 
                              'transparent',
                            borderLeft: location.pathname === child.path ? 
                              '3px solid #1A73E8' : 'none',
                          }}
                          onClick={() => child.path && handleNavigate(child.path)}
                        >
                          <ListItemIcon sx={{ color: '#8392AB', minWidth: 40 }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={child.title}
                            sx={{ color: '#67748e' }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </div>
            );
          }

          return (
            <ListItem key={item.title} disablePadding>
              <ListItemButton
                sx={{ 
                  background: location.pathname === item.path ? 
                    'linear-gradient(195deg, rgba(73,163,241,0.1) 0%, rgba(26,115,232,0.1) 100%)' : 
                    'transparent',
                  borderLeft: location.pathname === item.path ? 
                    '3px solid #1A73E8' : 'none',
                }}
                onClick={() => item.path && handleNavigate(item.path)}
              >
                <ListItemIcon sx={{ color: '#67748e' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title}
                  sx={{ color: '#67748e' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: '#67748e',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#344767' }}>
            Smart Meter Management System
          </Typography>

          <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <IconButton color="inherit" onClick={handleNotificationMenu}>
            <Badge badgeContent={activeAlerts.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Chip
            avatar={<Avatar>{user?.firstName?.[0]}{user?.lastName?.[0]}</Avatar>}
            label={`${user?.firstName} ${user?.lastName}`}
            onClick={handleProfileMenu}
            sx={{ ml: 2 }}
          />
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleCloseNotifications}
            PaperProps={{
              style: { maxHeight: 400, width: 350 }
            }}
          >
            {activeAlerts.length === 0 ? (
              <MenuItem>No active alerts</MenuItem>
            ) : (
              activeAlerts.map((alert, index) => (
                <MenuItem key={index} onClick={() => navigate('/task-query/events')}>
                  <ListItemIcon>
                    <Warning fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={alert.title}
                    secondary={alert.description}
                  />
                </MenuItem>
              ))
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'white',
              borderRight: 'none',
              boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.42)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'white',
              borderRight: 'none',
              boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.42)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
