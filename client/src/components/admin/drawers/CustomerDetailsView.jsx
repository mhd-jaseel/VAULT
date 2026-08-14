import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { DrawerSection, DrawerRow, DrawerBadge } from '../AdminDetailsDrawer';

export default function CustomerDetailsView({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`/auth/customers/${customerId}`);
        if (isMounted && res.data.success) {
          setCustomer(res.data.data.user);
          setStats(res.data.data.stats);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch customer details:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (customerId) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#6b7280] font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin mb-3" />
        Loading customer details...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center font-mono">
        <p className="text-xs text-[#dc2626] font-bold uppercase mb-4">Unable to load details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Profile ── */}
      <DrawerSection title="Profile Information">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xl uppercase flex-shrink-0 shadow-sm">
            {customer.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#111111] uppercase tracking-wide">{customer.name}</h3>
            <p className="text-[10px] font-mono text-[#6b7280]">{customer.email}</p>
          </div>
        </div>

        <DrawerRow 
          label="Account Status" 
          valueNode={
            <DrawerBadge variant={customer.isBlocked ? 'danger' : 'success'}>
              {customer.isBlocked ? 'BLOCKED' : 'ACTIVE'}
            </DrawerBadge>
          } 
        />
        <DrawerRow 
          label="Wallet Balance" 
          value={`₹${(customer.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
        />
        <DrawerRow label="Phone" value={customer.phone || 'Not provided'} />
        <DrawerRow label="Registered" value={new Date(customer.createdAt).toLocaleDateString()} />
      </DrawerSection>

      {/* ── Statistics ── */}
      {stats && (
        <DrawerSection title="Customer Activity">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">Total Orders</span>
              <span className="text-sm font-bold text-[#111111] font-mono">{stats.totalOrders}</span>
            </div>
            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">Total Spent</span>
              <span className="text-sm font-bold text-[#111111] font-mono">₹{stats.totalSpent?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1 text-[#16a34a]">Completed</span>
              <span className="text-sm font-bold text-[#16a34a] font-mono">{stats.completedOrders}</span>
            </div>
            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5]">
              <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1 text-red-500">Cancelled</span>
              <span className="text-sm font-bold text-red-600 font-mono">{stats.cancelledOrders}</span>
            </div>
          </div>
        </DrawerSection>
      )}

      {/* ── Saved Address ── */}
      {customer.address && customer.address.street && (
        <DrawerSection title="Saved Address">
          <div className="text-xs font-sans text-[#111111] bg-[#f9fafb] border border-[#e5e5e5] p-3 rounded-xl leading-relaxed">
            <p>{customer.address.street}</p>
            <p>{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
            <p>{customer.address.country}</p>
          </div>
        </DrawerSection>
      )}

      {/* ── Actions ── */}
      <div className="pt-4 border-t border-[#e5e5e5]">
        <Link 
          to={`/admin/users/${customer._id}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#111111] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors"
        >
          View Full Profile <ExternalLink size={14} />
        </Link>
      </div>

    </div>
  );
}
