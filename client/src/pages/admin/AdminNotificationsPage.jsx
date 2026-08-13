import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Package,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = '/notifications?limit=50';
      if (filterType === 'unread') {
        url += '&unreadOnly=true';
      } else if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }
      const res = await axios.get(url);
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch notifications page error:', err);
      toast.error('Unable to load notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterType]);

  const handleNotificationClick = async (notif) => {
    try {
      const res = await axios.get(`/notifications/${notif._id}/verify-action`);
      if (res.data.success) {
        if (!res.data.canPerformAction && res.data.stateMessage) {
          toast.info(res.data.stateMessage);
        }

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
      toast.error('Unable to load requested item.');
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

  const handleClearRead = async () => {
    try {
      const res = await axios.delete('/notifications/clear-read');
      if (res.data.success) {
        toast.success('Read notifications cleared.');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to clear read notifications.');
    }
  };

  const handleDeleteSingle = async (e, notifId) => {
    e.stopPropagation();
    try {
      const res = await axios.delete(`/notifications/${notifId}`);
      if (res.data.success) {
        toast.success('Notification deleted.');
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      toast.error('Failed to delete notification.');
    }
  };

  const getCategoryBadge = (type) => {
    switch (type) {
      case 'NEW_ORDER':
        return <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-md">Order</span>;
      case 'RETURN_REQUEST':
      case 'REPLACEMENT_REQUEST':
        return <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#2563eb] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded-md">Return</span>;
      case 'PAYMENT_VERIFICATION_REQUIRED':
      case 'REFUND_ACTION_REQUIRED':
        return <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#d97706] bg-[#fffbeb] border border-[#fde68a] px-2 py-0.5 rounded-md">Payment</span>;
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 rounded-md">Inventory</span>;
      default:
        return <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#6b7280] bg-[#f3f4f6] border border-[#e5e5e5] px-2 py-0.5 rounded-md">System</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full font-sans text-[#111111] space-y-5 min-w-0">
      {/* Header */}
      <div className="pb-4 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Notifications
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-0.5">
            Stay updated with orders, payments, returns and inventory alerts ({unreadCount} unread).
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#374151] hover:text-[#111111] bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <CheckCheck size={13} /> Mark All Read
            </button>
          )}

          <button
            onClick={handleClearRead}
            className="text-xs font-mono font-bold uppercase tracking-wider text-[#6b7280] hover:text-[#dc2626] bg-white border border-[#e5e5e5] hover:bg-[#fef2f2] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Remove read notifications"
          >
            <Trash2 size={13} /> Clear Read
          </button>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-mono">
        {[
          { label: 'ALL', value: 'all' },
          { label: 'UNREAD', value: 'unread' },
          { label: 'ORDERS', value: 'NEW_ORDER' },
          { label: 'PAYMENTS', value: 'PAYMENT_VERIFICATION_REQUIRED' },
          { label: 'RETURNS', value: 'RETURN_REQUEST' },
          { label: 'INVENTORY', value: 'LOW_STOCK' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab.value
                ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                : 'bg-white border-[#e5e5e5] text-[#6b7280] hover:text-[#111111]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Compact Notification List Container */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#6b7280] flex flex-col items-center justify-center font-mono">
          <div className="w-6 h-6 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-2" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl font-mono">
          <Bell size={28} className="mx-auto mb-2 text-[#9ca3af]" />
          <p className="text-xs font-bold text-[#111111] mb-0.5">No notifications found.</p>
          <p className="text-[11px] text-[#6b7280]">Actionable events will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-xs divide-y divide-[#e5e5e5] font-mono overflow-hidden">
          {notifications.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 sm:p-4 hover:bg-[#f9fafb] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUnread ? 'bg-[#fcfdfd]' : ''
                }`}
              >
                {/* Left Side: Indicator + Details */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Unread Dot */}
                  <div className="pt-1 flex-shrink-0">
                    {isUnread ? (
                      <span className="w-2 h-2 rounded-full bg-[#d97706] block" title="Unread" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent block" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs uppercase font-sans truncate ${isUnread ? 'font-black text-[#111111]' : 'font-bold text-[#374151]'}`}>
                        {notif.title}
                      </h4>
                      {getCategoryBadge(notif.type)}
                    </div>

                    <p className={`text-xs font-sans leading-snug line-clamp-2 ${isUnread ? 'text-[#111111]' : 'text-[#6b7280]'}`}>
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-[#9ca3af] pt-0.5">
                      <span>
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })},{' '}
                        {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Action Button + Delete Icon */}
                <div className="flex items-center justify-end gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleNotificationClick(notif)}
                    className="px-3 py-1.5 bg-white border border-[#e5e5e5] hover:bg-[#111111] hover:text-white text-[#111111] text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    {notif.action?.replace(/_/g, ' ') || 'VIEW'}
                  </button>

                  <button
                    onClick={(e) => handleDeleteSingle(e, notif._id)}
                    className="p-1.5 text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
