import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import MeterManagement from './pages/Meters/MeterManagement';
import AddMeter from './pages/Meters/AddMeter';
import MeterImport from './pages/Meters/MeterImport';
import MeterReading from './pages/Meters/MeterReading';
import MeterSettings from './pages/Meters/MeterSettings';
import SimManagement from './pages/Meters/SimManagement';
import AreaManagement from './pages/System/AreaManagement';
import CustomerManagement from './pages/Customers/CustomerManagement';
import ImportCustomers from './pages/Customers/ImportCustomers';
import RealTimeMonitoring from './pages/TaskQuery/RealTimeMonitoring';
import EventAnalysis from './pages/TaskQuery/EventAnalysis';
import OnlineRate from './pages/TaskQuery/OnlineRate';
import EnergyConsumption from './pages/Reports/EnergyConsumption';
import RemoteLoading from './pages/Remote/RemoteLoading';
import RemoteControl from './pages/Remote/RemoteControl';
import UserManagement from './pages/Users/UserManagement';
import Profile from './pages/Profile/Profile';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <SocketProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    borderRadius: '12px',
                    fontSize: '14px',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#00C853',
                      secondary: '#FFFFFF',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#D32F2F',
                      secondary: '#FFFFFF',
                    },
                  },
                }}
              />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<PrivateRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* System Routes - Admin & Operator only */}
                    <Route element={<PrivateRoute allowedRoles={['admin', 'operator']} />}>
                      <Route path="/system/areas" element={<AreaManagement />} />
                    </Route>
                    
                    {/* Meter Management Routes - Admin & Operator only */}
                    <Route element={<PrivateRoute allowedRoles={['admin', 'operator']} />}>
                      <Route path="/meters" element={<MeterManagement />} />
                      <Route path="/meters/add" element={<AddMeter />} />
                      <Route path="/meters/import" element={<MeterImport />} />
                      <Route path="/meters/sims" element={<SimManagement />} />
                      <Route path="/meters/reading" element={<MeterReading />} />
                      <Route path="/meters/settings" element={<MeterSettings />} />
                    </Route>
                    
                    {/* Customer Management Routes - Admin & Operator only */}
                    <Route element={<PrivateRoute allowedRoles={['admin', 'operator']} />}>
                      <Route path="/customers" element={<CustomerManagement />} />
                      <Route path="/customers/import" element={<ImportCustomers />} />
                    </Route>
                    
                    {/* Task Query Routes - All authenticated users */}
                    <Route path="/task-query/monitoring" element={<RealTimeMonitoring />} />
                    <Route path="/task-query/events" element={<EventAnalysis />} />
                    <Route path="/task-query/online-rate" element={<OnlineRate />} />
                    
                    {/* Reports Routes - All authenticated users */}
                    <Route path="/reports/consumption" element={<EnergyConsumption />} />
                    
                    {/* Remote Routes - Admin & Operator only */}
                    <Route element={<PrivateRoute allowedRoles={['admin', 'operator']} />}>
                      <Route path="/remote/loading" element={<RemoteLoading />} />
                      <Route path="/remote/control" element={<RemoteControl />} />
                    </Route>
                    
                    {/* User Management - Admin only */}
                    <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                      <Route path="/users" element={<UserManagement />} />
                    </Route>
                    
                    {/* Profile - All authenticated users */}
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                </Route>
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </Router>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}

export default App;
