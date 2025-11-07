import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';

const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionStatus } = useWebSocket();
  const { state: authState } = useAuth();
  const [showStatus, setShowStatus] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show status when there are connection issues
  useEffect(() => {
    if (!authState.isAuthenticated) {
      setShowStatus(false);
      return;
    }

    if (!isOnline || (!isConnected && connectionStatus.reconnectAttempts > 0)) {
      setShowStatus(true);
    } else if (isConnected && isOnline) {
      // Hide status after successful connection, with a delay
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isConnected, connectionStatus.reconnectAttempts, authState.isAuthenticated]);

  if (!authState.isAuthenticated || !showStatus) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        type: 'offline',
        message: 'You are offline',
        color: 'bg-red-500',
        icon: '🔴'
      };
    }

    if (!isConnected && connectionStatus.reconnectAttempts === 0) {
      return {
        type: 'connecting',
        message: 'Connecting to real-time updates...',
        color: 'bg-yellow-500',
        icon: '🟡'
      };
    }

    if (!isConnected && connectionStatus.reconnectAttempts > 0) {
      return {
        type: 'reconnecting',
        message: `Reconnecting... (${connectionStatus.reconnectAttempts}/${connectionStatus.maxReconnectAttempts})`,
        color: 'bg-orange-500',
        icon: '🟠'
      };
    }

    if (isConnected) {
      return {
        type: 'connected',
        message: 'Connected to real-time updates',
        color: 'bg-green-500',
        icon: '🟢'
      };
    }

    return {
      type: 'unknown',
      message: 'Connection status unknown',
      color: 'bg-gray-500',
      icon: '⚪'
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`fixed top-4 right-4 z-50 ${status.color} text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform ${showStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm">{status.icon}</span>
        <span className="text-sm font-medium">{status.message}</span>
        {status.type === 'reconnecting' && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;