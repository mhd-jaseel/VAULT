import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // Fetch initial notifications from DB
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Initialize Socket Connection
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
      });

      setSocket(newSocket);

      // Join appropriate rooms
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        newSocket.emit('join', user._id);
        if (user.role === 'admin') {
          newSocket.emit('join_admins');
        }
      });

      // Listen for real-time notifications
      newSocket.on('new_notification', (notification) => {
        console.log('New notification received:', notification);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Optional: show a browser or toast alert
        if (Notification.permission === 'granted') {
          new Image().onload = () => {}; // pre-load icon if needed
          new window.Notification(notification.title, {
            body: notification.message,
          });
        }
      });

      // Ask for notification permission
      if (window.Notification && window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }

      return () => {
        newSocket.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      const res = await axios.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await axios.put('/notifications/readall');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
