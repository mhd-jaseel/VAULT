import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Package,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications?limit=15');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s refetch
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      // 1. Verify database state & mark read
      const res = await axios.get(`/notifications/${notif._id}/verify-action`);
      if (res.data.success) {
        fetchNotifications();

        if (!res.data.canPerformAction && res.data.stateMessage) {
          toast.info(res.data.stateMessage);
        }

        // 2. Actionable Navigation based on relatedType & action
        setIsOpen(false);
        if (notif.relatedType === 'Order') {
          navigate('/admin/orders');
        } else if (notif.relatedType === 'Return') {
          navigate('/admin/returns');
        } else if (notif.relatedType === 'Product') {
          navigate('/admin/products');
        } else if (notif.relatedType === 'Payment') {
          navigate('/admin/payments');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      console.error('Notification action error:', err);
      toast.error('Unable to load requested item. Please try again.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await axios.patch('/notifications/read-all');
      if (res.data.success) {
        toast.success('All notifications marked as read.');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to mark notifications as read.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_ORDER':
        return <ShoppingBag size={14} className="text-[#16a34a]" />;
      case 'RETURN_REQUEST':
      case 'REPLACEMENT_REQUEST':
        return <RotateCcw size={14} className="text-[#2563eb]" />;
      case 'PAYMENT_VERIFICATION_REQUIRED':
      case 'REFUND_ACTION_REQUIRED':
        return <CreditCard size={14} className="text-[#d97706]" />;
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <Package size={14} className="text-[#dc2626]" />;
      default:
        return <Bell size={14} className="text-[#111111]" />;
    }
  };

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      {/* Bell Icon Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] text-[#111111] transition-all cursor-pointer shadow-xs flex items-center justify-center"
        title="Admin Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#dc2626] text-white font-extrabold text-[9px] min-w-[18px] h-4 rounded-full px-1 flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#e5e5e5] rounded-2xl shadow-xl z-50 overflow-hidden font-sans text-[#111111]">
          {/* Panel Header */}
          <div className="p-4 border-b border-[#e5e5e5] bg-[#f9fafb] flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-[#111111] uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-[#6b7280] hover:text-[#111111] font-bold uppercase underline flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} /> Mark Read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#9ca3af] hover:text-[#111111] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#e5e5e5]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6b7280] font-mono">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-[#f9fafb] transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    !notif.isRead ? 'bg-[#f0fdf4]/40 font-medium' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white border border-[#e5e5e5] shadow-xs flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] flex-shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-[#111111] truncate">{notif.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#4b5563] line-clamp-2 leading-relaxed font-sans">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-[#9ca3af] font-mono block pt-1">
                        {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[#111111] text-white flex items-center gap-1 shadow-xs">
                      {notif.action?.replace(/_/g, ' ')} <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-[#e5e5e5] bg-[#f9fafb] text-center font-mono">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/notifications');
              }}
              className="text-[10px] font-bold text-[#111111] uppercase hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              View Notification History <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
