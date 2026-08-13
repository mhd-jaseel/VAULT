import React, { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminNotificationBell from './AdminNotificationBell';
import { Menu } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center min-h-screen bg-[#F7F7F5]">
        <div className="w-12 h-12 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-panel-theme bg-[#F7F7F5] min-h-screen text-[#111111] antialiased flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Admin Body Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0 w-full">
        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between shadow-xs">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-[#111111] hover:bg-[#f3f4f6] rounded-xl"
          >
            <Menu size={20} />
          </button>
          <span className="font-display font-black text-base tracking-[0.2em] text-[#111111]">
            VAULT.<span className="text-[#d97706] text-xs font-mono">ADMIN</span>
          </span>
          <AdminNotificationBell />
        </header>

        {/* Desktop Header Bar */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e5e5e5] px-8 py-3.5 items-center justify-between shadow-xs">
          <div>
            <span className="font-display font-black text-sm tracking-[0.25em] text-[#111111]">
              VAULT <span className="text-[#d97706] text-[10px] font-mono">CONTROL CENTER</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <AdminNotificationBell />
          </div>
        </header>

        {/* Page Children Content Container */}
        <main className="flex-1 p-4 md:p-8 min-w-0 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
