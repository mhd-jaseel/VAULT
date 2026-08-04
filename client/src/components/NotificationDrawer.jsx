import React, { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { X, Bell, Check, MailOpen } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markRead, markAllRead } = useContext(SocketContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-dark-card border-l border-dark-border text-gray-200">
          <div className="h-full flex flex-col py-6 shadow-2xl">
            {/* Header */}
            <div className="px-6 flex items-center justify-between border-b border-dark-border pb-4">
              <div className="flex items-center gap-2">
                <Bell className="text-gold" size={20} />
                <h2 className="text-lg font-semibold font-display">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-6 py-2.5 bg-black/30 border-b border-dark-border flex justify-end">
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-gold hover:text-gold-light font-medium cursor-pointer transition-colors"
                >
                  <MailOpen size={14} /> Mark all as read
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                  <Bell size={40} className="stroke-1 mb-3 text-zinc-700" />
                  <p className="text-sm">No notifications yet.</p>
                  <p className="text-xs text-zinc-600 mt-1">We'll alert you here when updates happen.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif._id}
                    className={`relative p-4 rounded-xl border transition-all duration-200 ${
                      notif.read 
                        ? 'bg-zinc-900/30 border-zinc-900/50 opacity-70' 
                        : 'bg-gold/5 border-gold/20 shadow-md shadow-gold/[0.02]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-sm font-semibold ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <button
                          onClick={() => markRead(notif._id)}
                          className="text-gold hover:text-gold-light p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-zinc-600 block mt-2">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
