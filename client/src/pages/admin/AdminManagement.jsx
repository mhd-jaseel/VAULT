import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Users,
  CheckCircle,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function AdminManagement() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'admins'

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Modal confirmation states
  const [promoteModal, setPromoteModal] = useState({ open: false, targetUser: null });
  const [demoteModal, setDemoteModal] = useState({ open: false, targetAdmin: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async (query = '') => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`/admin-management/users?search=${encodeURIComponent(query)}`);
      if (res.data.success) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching promotable users:', err);
      toast.error(err.response?.data?.message || 'Unable to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await axios.get('/admin-management/admins');
      if (res.data.success) {
        setAdminsList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin accounts:', err);
      toast.error(err.response?.data?.message || 'Unable to load administrators. Please try again.');
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handlePromoteConfirm = async () => {
    if (!promoteModal.targetUser) return;
    setSubmitting(true);
    try {
      const res = await axios.put(`/admin-management/${promoteModal.targetUser._id}/make-admin`);
      if (res.data.success) {
        toast.success(res.data.message || 'Admin access granted successfully.');
        setPromoteModal({ open: false, targetUser: null });
        fetchUsers(searchQuery);
        fetchAdmins();
      }
    } catch (err) {
      console.error('Promote admin error:', err);
      toast.error(err.response?.data?.message || 'Failed to promote user to administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoteConfirm = async () => {
    if (!demoteModal.targetAdmin) return;
    setSubmitting(true);
    try {
      const res = await axios.put(`/admin-management/${demoteModal.targetAdmin._id}/remove-admin`);
      if (res.data.success) {
        toast.success(res.data.message || 'Admin access removed successfully.');
        setDemoteModal({ open: false, targetAdmin: null });
        fetchUsers(searchQuery);
        fetchAdmins();
      }
    } catch (err) {
      console.error('Demote admin error:', err);
      toast.error(err.response?.data?.message || 'Failed to remove admin status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    if (admin.isSuperAdmin) {
      toast.error('Super Admin account status cannot be modified.');
      return;
    }

    const newStatus = admin.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await axios.put(`/admin-management/${admin._id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Admin account ${newStatus === 'disabled' ? 'disabled' : 'activated'}.`);
        fetchAdmins();
      }
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update admin status.');
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto text-[#111111]">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-[#111111]">
            Admin Management
          </h1>
          <p className="text-xs text-[#6b7280] font-mono mt-1">
            Manage administrator access for registered users.
          </p>
        </div>

        <button
          onClick={() => {
            fetchUsers(searchQuery);
            fetchAdmins();
          }}
          className="self-start sm:self-auto p-2.5 bg-white border border-[#e5e5e5] hover:bg-[#f9fafb] rounded-xl text-[#374151] hover:text-[#111111] transition-all cursor-pointer shadow-xs flex items-center gap-2 font-mono text-xs font-bold"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#e5e5e5] pb-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 rounded-xl font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white border border-[#e5e5e5] text-[#6b7280] hover:text-[#111111]'
            }`}
          >
            Registered Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-2 px-4 rounded-xl font-bold uppercase transition-all cursor-pointer ${
              activeTab === 'admins'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white border border-[#e5e5e5] text-[#6b7280] hover:text-[#111111]'
            }`}
          >
            Administrators ({adminsList.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-xl py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-[#111111]"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-[#9ca3af]" />
          </div>
        )}
      </div>

      {/* TAB 1: REGISTERED USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs font-mono">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide flex items-center gap-2">
              <Users size={16} className="text-[#111111]" /> Registered Customers &amp; Users
            </h3>
            <span className="text-xs text-[#6b7280]">Click "Make Admin" to grant access</span>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-xs text-[#6b7280]">Loading users...</div>
          ) : usersList.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6b7280]">No eligible users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                    <th className="p-3">User</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Login Method</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3">Current Role</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="p-3 font-bold text-[#111111] font-sans">{u.name}</td>
                      <td className="p-3 text-[#374151]">{u.email}</td>
                      <td className="p-3">
                        <span className="text-[9px] font-bold uppercase text-[#4b5563] bg-[#f3f4f6] px-2 py-0.5 rounded-md border border-[#e5e5e5]">
                          {u.loginMethod}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            u.status === 'active'
                              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                              : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 uppercase text-[10px] font-bold text-[#6b7280]">
                        {u.role || 'USER'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setPromoteModal({ open: true, targetUser: u })}
                          className="bg-[#111111] hover:bg-black text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          MAKE ADMIN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADMINISTRATORS LIST */}
      {activeTab === 'admins' && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 space-y-4 shadow-xs font-mono">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h3 className="text-sm font-extrabold uppercase text-[#111111] tracking-wide flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#d97706]" /> Active Administrators
            </h3>
            <span className="text-xs text-[#6b7280]">{adminsList.length} Admins</span>
          </div>

          {loadingAdmins ? (
            <div className="py-12 text-center text-xs text-[#6b7280]">Loading administrators...</div>
          ) : adminsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6b7280]">No administrators found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#e5e5e5] text-[#6b7280] uppercase text-[10px] bg-[#f9fafb]">
                    <th className="p-3">Administrator</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Login Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {adminsList.map((adm) => (
                    <tr key={adm._id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="p-3 font-bold text-[#111111] font-sans">
                        <div className="flex items-center gap-2">
                          <span>{adm.name}</span>
                          {adm.isSuperAdmin && (
                            <span className="text-[8px] font-mono font-bold uppercase text-[#d97706] bg-[#fef3c7] px-2 py-0.5 rounded-full border border-[#fde68a]">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-[#374151]">{adm.email}</td>
                      <td className="p-3">
                        <span className="text-[9px] font-bold uppercase text-[#4b5563] bg-[#f3f4f6] px-2 py-0.5 rounded-md border border-[#e5e5e5]">
                          {adm.loginMethod}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            adm.status === 'active'
                              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]'
                              : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
                          }`}
                        >
                          {adm.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {adm.isSuperAdmin ? (
                          <span className="text-[10px] text-[#9ca3af] italic font-sans">System Owner</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(adm)}
                              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                adm.status === 'active'
                                  ? 'bg-[#fffbeb] border-[#fde68a] text-[#d97706] hover:bg-[#fef3c7]'
                                  : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] hover:bg-[#dcfce7]'
                              }`}
                            >
                              {adm.status === 'active' ? 'DISABLE' : 'ACTIVATE'}
                            </button>
                            <button
                              onClick={() => setDemoteModal({ open: true, targetAdmin: adm })}
                              className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-[#fef2f2] border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2] transition-all cursor-pointer"
                            >
                              REMOVE ADMIN
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MAKE ADMIN CONFIRMATION MODAL */}
      {promoteModal.open && promoteModal.targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111]">
                Make this user an administrator?
              </h3>
              <button onClick={() => setPromoteModal({ open: false, targetUser: null })} className="text-[#6b7280] hover:text-[#111111]">
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#f9fafb] p-3 rounded-xl border border-[#e5e5e5] space-y-1">
              <p className="font-bold text-xs text-[#111111] font-sans">{promoteModal.targetUser.name}</p>
              <p className="text-[11px] text-[#6b7280]">{promoteModal.targetUser.email}</p>
            </div>

            <p className="text-xs text-[#4b5563] font-sans">
              This user will be able to access the admin panel and manage store operations.
            </p>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setPromoteModal({ open: false, targetUser: null })}
                className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handlePromoteConfirm}
                className="bg-[#111111] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all"
              >
                {submitting ? 'Updating...' : 'MAKE ADMIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE ADMIN CONFIRMATION MODAL */}
      {demoteModal.open && demoteModal.targetAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl font-mono text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <h3 className="font-sans font-bold text-sm uppercase text-[#111111]">
                Remove admin access?
              </h3>
              <button onClick={() => setDemoteModal({ open: false, targetAdmin: null })} className="text-[#6b7280] hover:text-[#111111]">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#4b5563] font-sans leading-relaxed">
              <strong className="text-[#111111]">{demoteModal.targetAdmin.name}</strong> will no longer be able to access the admin panel. Their account will remain a registered customer.
            </p>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setDemoteModal({ open: false, targetAdmin: null })}
                className="px-4 py-2 text-xs text-[#6b7280] hover:text-[#111111] font-bold uppercase"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDemoteConfirm}
                className="bg-[#dc2626] hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all"
              >
                {submitting ? 'Removing...' : 'REMOVE ADMIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
