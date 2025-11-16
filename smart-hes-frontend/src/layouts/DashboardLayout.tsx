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
  Tooltip,
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
  Upload,
  MonitorHeart,
  QueryStats,
  BatteryChargingFull,
  ControlCamera,
  Group,
  ChevronLeft,
  ChevronRight,
  AutoGraph,
  Security,
  Shield,
  Receipt,
  CloudUpload,
  AdminPanelSettings,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { NHLogoCompact, NHLogo } from '../components/Logo';

const drawerWidth = 260;
const collapsedDrawerWidth = 65;

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
    title: 'Area Management',
    path: '/system/areas',
    icon: <LocationOn />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Meters',
    icon: <ElectricBolt />,
    children: [
      {
        title: 'All Meters',
        path: '/meters',
        icon: <ElectricBolt />,
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
    title: 'Customers',
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
    title: 'Load Profile',
    path: '/advanced/load-profile',
    icon: <Timeline />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Power Quality',
    path: '/advanced/power-quality',
    icon: <QueryStats />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Event Logs',
    path: '/advanced/events',
    icon: <EventNote />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Tamper Detection',
    path: '/advanced/tamper',
    icon: <Shield />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Billing Management',
    path: '/advanced/billing',
    icon: <Receipt />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Firmware Upgrade',
    path: '/advanced/firmware',
    icon: <CloudUpload />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Security Audit',
    path: '/advanced/security',
    icon: <Security />,
    roles: ['admin', 'operator'],
  },
  {
    title: 'Real-Time Monitoring',
    path: '/task-query/monitoring',
    icon: <MonitorHeart />,
  },
  {
    title: 'Online Rate',
    path: '/task-query/online-rate',
    icon: <SignalWifi4Bar />,
  },
  {
    title: 'Energy Consumption',
    path: '/reports/consumption',
    icon: <BatteryChargingFull />,
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
  {
    title: 'Access Control',
    path: '/advanced/access-control',
    icon: <AdminPanelSettings />,
    roles: ['admin'],
  },
];

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeAlerts } = useSocket();
  const { mode, toggleTheme } = useThemeMode();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    // Close all menus when collapsing
    if (!collapsed) {
      setOpenMenus({});
    }
  };

  const handleMenuClick = (title: string) => {
    if (collapsed) {
      // If collapsed, expand the sidebar when clicking a parent menu
      setCollapsed(false);
      setOpenMenus({ [title]: true });
    } else {
      setOpenMenus(prev => ({
        ...prev,
        [title]: !prev[title],
      }));
    }
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

  const currentDrawerWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  const drawer = (
    <div>
      <Toolbar sx={{
        background: mode === 'light'
          ? 'linear-gradient(135deg, #003A5D 0%, #00758F 100%)'
          : 'linear-gradient(135deg, #004070 0%, #008FA0 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 1,
        minHeight: '64px !important',
      }}>
        {collapsed ? (
          <NHLogoCompact sx={{ height: 36 }} />
        ) : (
          <NHLogo sx={{ height: 45, width: 'auto' }} />
        )}
      </Toolbar>
      <Divider />

      {/* Collapse Toggle Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Tooltip title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"} placement="right">
          <IconButton onClick={toggleCollapse} size="small">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />

      <List sx={{ px: collapsed ? 0.5 : 1 }}>
        {menuItems.map((item) => {
          if (!hasAccess(item)) return null;

          if (item.children) {
            return (
              <div key={item.title}>
                <Tooltip title={collapsed ? item.title : ""} placement="right">
                  <ListItemButton
                    onClick={() => handleMenuClick(item.title)}
                    sx={{
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 1 : 2,
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemIcon sx={{
                      color: 'text.secondary',
                      minWidth: collapsed ? 'auto' : 40,
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <>
                        <ListItemText
                          primary={item.title}
                          sx={{ color: 'text.secondary' }}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                        {openMenus[item.title] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
                {!collapsed && (
                  <Collapse in={openMenus[item.title]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => {
                        if (!hasAccess(child)) return null;
                        return (
                          <ListItemButton
                            key={child.path}
                            sx={{
                              pl: 4,
                              py: 0.75,
                              borderRadius: 1,
                              mb: 0.5,
                              bgcolor: location.pathname === child.path ? 'action.selected' : 'transparent',
                              borderLeft: location.pathname === child.path ?
                                '3px solid' : 'none',
                              borderColor: 'primary.main',
                            }}
                            onClick={() => child.path && handleNavigate(child.path)}
                          >
                            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 36 }}>
                              {child.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={child.title}
                              sx={{ color: 'text.primary' }}
                              primaryTypographyProps={{ fontSize: '0.8125rem' }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </div>
            );
          }

          return (
            <ListItem key={item.title} disablePadding>
              <Tooltip title={collapsed ? item.title : ""} placement="right">
                <ListItemButton
                  sx={{
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 2,
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: location.pathname === item.path ? 'action.selected' : 'transparent',
                    borderLeft: location.pathname === item.path ? '3px solid' : 'none',
                    borderColor: 'primary.main',
                  }}
                  onClick={() => item.path && handleNavigate(item.path)}
                >
                  <ListItemIcon sx={{
                    color: 'text.secondary',
                    minWidth: collapsed ? 'auto' : 40,
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.title}
                      sx={{ color: 'text.primary' }}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          backgroundImage: 'none',
          transition: 'width 0.3s, margin 0.3s',
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

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '1.125rem' }}>
            New Hampshire Capital - Head End System
          </Typography>

          <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <IconButton color="inherit" onClick={handleNotificationMenu}>
            <Badge badgeContent={activeAlerts.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Chip
            avatar={<Avatar sx={{ width: 32, height: 32 }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Avatar>}
            label={`${user?.firstName} ${user?.lastName}`}
            onClick={handleProfileMenu}
            sx={{ ml: 2, height: 36 }}
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
                <MenuItem key={index} onClick={() => navigate('/advanced/events')}>
                  <ListItemIcon>
                    <Warning fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.title}
                    secondary={alert.description}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </MenuItem>
              ))
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
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
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
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
              width: currentDrawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width 0.3s',
              overflowX: 'hidden',
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
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          mt: 8,
          transition: 'width 0.3s',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
