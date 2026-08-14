import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Users, Search, ShieldOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '../../components/Pagination';
import AdminDetailsDrawer from '../../components/admin/AdminDetailsDrawer';
import CustomerDetailsView from '../../components/admin/drawers/CustomerDetailsView';

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(searchParams.get('page')) || 1;
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Quick View Drawer state
  const [drawer, setDrawer] = useState({ isOpen: false, entityId: null });

  const openDrawer = (entityId) => {
    setDrawer({ isOpen: true, entityId });
  };

  const closeDrawer = () => {
    setDrawer({ isOpen: false, entityId: null });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (searchInput.trim()) params.set('search', searchInput.trim());
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/auth/customers?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
        setPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ page: 1, search: searchInput, status: statusFilter });
    fetchUsers();
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setSearchParams({ page: 1, search: searchInput, status });
  };

  const statusTabs = [
    { label: 'All Users', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Blocked', value: 'blocked' },
  ];

  return (
    <div className="py-6 px-4 md:px-12 max-w-7xl mx-auto w-full min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-text-primary flex items-center gap-2">
            <Users size={20} /> Manage Users
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {total} registered customer{total !== 1 ? 's' : ''} in the system.
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="glass-card mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              className="form-input text-xs !pl-8 !py-2"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-dark text-[10px] !py-2 !px-4 uppercase tracking-widest cursor-pointer">
            Search
          </button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 bg-neutral-100 border border-border-light rounded-xl p-1">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-neutral-900 text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Users className="text-text-secondary mx-auto mb-3 stroke-1" size={40} />
          <p className="text-xs text-text-secondary font-mono uppercase">No users found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto glass-card !p-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-light text-text-secondary uppercase font-mono tracking-wider bg-neutral-50">
                  <th className="p-4">User</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Spent</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-border-light/60 transition-colors group"
                  >
                    <td className="p-4">
                      <div 
                        onClick={() => openDrawer(u._id)}
                        className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 px-1.5 py-1 -ml-1.5 rounded transition-colors inline-flex"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xs uppercase flex-shrink-0">
                          {u.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary text-[11px] uppercase tracking-wide truncate">{u.name}</p>
                          <p className="text-[9px] font-mono text-text-secondary truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-text-secondary text-[10px]">
                      <span onClick={() => openDrawer(u._id)} className="cursor-pointer hover:text-text-primary hover:underline decoration-dashed transition-colors">
                        {u.phone || '—'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-text-secondary text-[9px]">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span 
                        onClick={() => openDrawer(u._id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity inline-flex"
                      >
                        {u.isBlocked ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full w-fit">
                            <ShieldOff size={9} /> Blocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#16a34a] bg-[#e6f7ee] border border-[#e6f7ee] px-2 py-0.5 rounded-full w-fit">
                            <ShieldCheck size={9} /> Active
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-text-primary font-bold text-[10px]">
                      <span onClick={() => openDrawer(u._id)} className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors">
                        {u.totalOrders ?? '—'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-text-primary font-bold text-[10px]">
                      <span onClick={() => openDrawer(u._id)} className="cursor-pointer hover:text-[#d97706] hover:underline decoration-dashed transition-colors">
                        {u.totalSpent != null ? `₹${u.totalSpent.toLocaleString('en-IN')}` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div
                key={u._id}
                onClick={() => openDrawer(u._id)}
                className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-xs space-y-3 font-sans cursor-pointer hover:border-[#111111] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xs uppercase flex-shrink-0">
                      {u.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#111111] truncate">{u.name}</p>
                      <p className="text-[10px] text-[#6b7280] font-mono truncate">{u.email}</p>
                    </div>
                  </div>
                  {u.isBlocked ? (
                    <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <ShieldOff size={8} /> Blocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-[#16a34a] bg-[#e6f7ee] border border-[#e6f7ee] px-2 py-0.5 rounded-full">
                      <ShieldCheck size={8} /> Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f3f4f6] text-[10px] font-mono">
                  <div>
                    <span className="text-[8px] text-[#6b7280] uppercase block font-bold font-sans">Phone</span>
                    <span className="text-[#111111] truncate block">{u.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#6b7280] uppercase block font-bold font-sans">Orders</span>
                    <span className="font-bold text-[#111111]">{u.totalOrders ?? '0'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#6b7280] uppercase block font-bold font-sans">Spent</span>
                    <span className="font-bold text-[#d97706]">{u.totalSpent != null ? `₹${u.totalSpent.toLocaleString('en-IN')}` : '₹0'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e5e5e5] flex items-center justify-between text-[10px] font-mono text-[#6b7280]">
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="font-bold text-[#111111] uppercase tracking-wider text-[9px]">View Details →</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination
        page={page}
        pages={pages}
        onPageChange={(newPage) => setSearchParams({ page: newPage, search: searchInput, status: statusFilter })}
        loading={loading}
      />

      {/* REUSABLE DETAILS DRAWER */}
      <AdminDetailsDrawer
        isOpen={drawer.isOpen}
        onClose={closeDrawer}
        title="Customer Details"
        subtitle="Quick View"
      >
        {drawer.isOpen && <CustomerDetailsView customerId={drawer.entityId} />}
      </AdminDetailsDrawer>
    </div>
  );
}
