import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');

  useEffect(() => {
    if (user) {
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

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
