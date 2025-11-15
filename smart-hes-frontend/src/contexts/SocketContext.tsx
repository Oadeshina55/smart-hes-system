import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineMeters: number;
  offlineMeters: number;
  activeAlerts: any[];
  recentEvents: any[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineMeters, setOnlineMeters] = useState(0);
  const [offlineMeters, setOfflineMeters] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-room', {
          room: user.role,
          userId: user.id,
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      // Listen for meter status updates
      newSocket.on('meter-status-change', (data) => {
        console.log('Meter status changed:', data);
        // Update local state or trigger refetch
      });

      // Listen for meter going online
      newSocket.on('meter-online', (data) => {
        toast.success(`Meter ${data.meterNumber} is now online`);
        setOnlineMeters(prev => prev + 1);
        setOfflineMeters(prev => Math.max(0, prev - 1));
      });

      // Listen for meter going offline
      newSocket.on('meter-offline', (data) => {
        toast.error(`Meter ${data.meterNumber} went offline`);
        setOfflineMeters(prev => prev + 1);
        setOnlineMeters(prev => Math.max(0, prev - 1));
      });

      // Listen for new alerts
      newSocket.on('new-alert', (data) => {
        toast.error(`New Alert: ${data.title}`, {
          duration: 6000,
        });
        setActiveAlerts(prev => [data, ...prev].slice(0, 10));
      });

      // Listen for tamper alerts
      newSocket.on('tamper-alert', (data) => {
        toast.error(`🚨 TAMPER ALERT: ${data.description} on meter ${data.meterNumber}`, {
          duration: 10000,
          style: {
            background: '#EC407A',
            color: '#fff',
          },
        });
      });

      // Listen for alert acknowledgment
      newSocket.on('alert-acknowledged', (data) => {
        setActiveAlerts(prev => 
          prev.map(alert => 
            alert.alertId === data.alertId 
              ? { ...alert, status: 'acknowledged' }
              : alert
          )
        );
      });

      // Listen for alert resolution
      newSocket.on('alert-resolved', (data) => {
        setActiveAlerts(prev => 
          prev.filter(alert => alert.alertId !== data.alertId)
        );
        toast.success('Alert resolved');
      });

      // Listen for meter reading updates
      newSocket.on('meter-reading-update', (data) => {
        console.log('New meter reading:', data);
        // Update consumption charts or displays
      });

      // Listen for events
      newSocket.on('new-event', (data) => {
        setRecentEvents(prev => [data, ...prev].slice(0, 20));
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineMeters,
        offlineMeters,
        activeAlerts,
        recentEvents,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
