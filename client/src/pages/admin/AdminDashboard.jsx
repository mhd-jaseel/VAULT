import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Settings, 
  FileSpreadsheet,
  ChevronRight,
  Megaphone
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/dashboard/stats')
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary">
          Admin Control Center
        </h1>
        <p className="text-xs text-text-secondary mt-1">Monitor operational metrics, verify payments, and manage catalog.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue */}
        <div className="glass-card flex flex-col justify-between !p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold">Total Revenue</span>
            <DollarSign className="text-text-primary" size={16} />
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold text-text-primary font-mono">₹{stats?.revenue.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-[#16a34a] mt-1 font-mono font-bold uppercase">Verified Payments</p>
          </div>
        </div>

        {/* Orders */}
        <div className="glass-card flex flex-col justify-between !p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold">Total Orders</span>
            <ShoppingBag className="text-text-primary" size={16} />
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold text-text-primary font-mono">{stats?.totalOrders}</h3>
            <p className="text-[9px] text-text-secondary mt-1 font-mono uppercase">
              <span className="text-text-primary font-bold">{stats?.pendingOrders}</span> pending shipping
            </p>
          </div>
        </div>

        {/* Payments Verification */}
        <div className="glass-card flex flex-col justify-between !p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold">Pending Payments</span>
            <FileSpreadsheet className="text-text-primary" size={16} />
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold text-text-primary font-mono">{stats?.pendingPayments}</h3>
            <p className="text-[9px] mt-1 font-mono">
              <Link to="/admin/payments" className="text-text-primary font-bold hover:underline">ACTION REQUIRED</Link>
            </p>
          </div>
        </div>

        {/* Customers */}
        <div className="glass-card flex flex-col justify-between !p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono font-bold">Registered Clients</span>
            <Users className="text-text-primary" size={16} />
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold text-text-primary font-mono">{stats?.customers}</h3>
            <p className="text-[9px] text-text-secondary mt-1 font-mono uppercase">Active buyers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Navigation Sidebar list */}
        <div className="space-y-4">
          <div className="glass-card flex flex-col gap-3">
            <h3 className="font-mono font-bold text-[10px] uppercase tracking-wider text-text-secondary border-b border-border-light pb-2.5 mb-1">
              Manager Sections
            </h3>
            
            <Link 
              to="/admin/returns"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">RETURNS & REFUNDS</span>
              <ChevronRight size={12} />
            </Link>

            <Link 
              to="/admin/products"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE PRODUCTS</span>
              <span className="text-[9px] font-mono bg-neutral-200 text-text-primary px-2 py-0.5 rounded-full font-bold">{stats?.products}</span>
            </Link>

            <Link 
              to="/admin/categories"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE CATEGORIES</span>
              <ChevronRight size={12} className="text-text-secondary" />
            </Link>

            <Link 
              to="/admin/orders"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE ORDERS</span>
              <span className="text-[9px] font-mono bg-neutral-900 text-white px-2 py-0.5 rounded-full font-bold">{stats?.pendingOrders}</span>
            </Link>

            <Link 
              to="/admin/payments"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">VERIFY PAYMENTS</span>
              {stats?.pendingPayments > 0 && (
                <span className="text-[8px] bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-mono font-bold">
                  ACTION REQUIRED
                </span>
              )}
            </Link>

            <Link 
              to="/admin/settings"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">STORE CONFIGURATION</span>
              <Settings size={14} className="text-text-secondary" />
            </Link>

            <Link 
              to="/admin/campaigns"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE CAMPAIGNS</span>
              <ChevronRight size={12} className="text-text-secondary" />
            </Link>

            <Link 
              to="/admin/brands"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE BRANDS</span>
              <ChevronRight size={12} className="text-text-secondary" />
            </Link>

            <Link 
              to="/admin/coupons"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE COUPONS</span>
              <ChevronRight size={12} className="text-text-secondary" />
            </Link>

            <Link 
              to="/admin/discounts"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">MANAGE DISCOUNTS</span>
              <ChevronRight size={12} className="text-text-secondary" />
            </Link>

            <Link 
              to="/admin/users"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-900 rounded-xl text-white hover:bg-neutral-800 border border-neutral-800 transition-all"
            >
              <span className="font-mono text-[10px] font-bold flex items-center gap-1.5"><Users size={11} /> MANAGE USERS</span>
              <ChevronRight size={12} className="text-white/60" />
            </Link>

            <Link 
              to="/"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-text-secondary hover:text-text-primary border border-border-light transition-all"
            >
              <span className="font-mono text-[10px] font-bold">HOME PAGE PREVIEW</span>
              <ChevronRight size={12} className="text-text-secondary" />
            </Link>

            <Link 
              to="/shop"
              className="flex items-center justify-between text-xs py-2.5 px-3 bg-neutral-50 rounded-xl text-[#b45309] hover:text-[#92400e] border border-amber-200/50 bg-amber-50/20 transition-all font-bold"
            >
              <span className="font-mono text-[10px]">PRODUCT PAGE PREVIEW</span>
              <ChevronRight size={12} className="text-amber-600" />
            </Link>
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card h-full flex flex-col justify-between">
            <div>
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary border-b border-border-light pb-3 mb-4 flex items-center gap-1.5">
                <AlertTriangle className="text-text-primary" size={14} /> Inventory Stock Alerts
              </h3>

              {stats?.lowStockProducts.length === 0 ? (
                <div className="text-center py-10 text-text-secondary text-xs font-mono">
                  All accessories stock levels are healthy!
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {stats?.lowStockProducts.map((prod) => (
                    <div 
                      key={prod._id}
                      className="flex justify-between items-center bg-neutral-50 border border-border-light p-3 rounded-xl text-xs"
                    >
                      <div>
                        <p className="font-bold text-text-primary uppercase tracking-wide text-[11px]">{prod.name}</p>
                        <p className="text-[9px] font-mono text-text-secondary">{prod.category?.name || 'Accessories'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-[9px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          {prod.stock} UNITS LEFT
                        </span>
                        <Link 
                          to={`/admin/products?edit=${prod._id}`}
                          className="text-[9px] font-mono text-text-primary hover:underline block mt-1"
                        >
                          Restock
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
