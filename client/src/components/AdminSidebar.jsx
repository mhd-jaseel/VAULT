import React, { useContext } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  RotateCcw,
  CheckSquare,
  Wallet,
  Package,
  Layers,
  Award,
  Megaphone,
  Ticket,
  Percent,
  Monitor,
  Users,
  Sliders,
  Eye,
  LogOut,
  ChevronRight,
  X,
  ShieldAlert,
  Truck,
  Star,
  FileText,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import VaultLogo from './VaultLogo';

export default function AdminSidebar({ isMobileOpen, onMobileClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Sales Report', path: '/admin/sales-report', icon: TrendingUp },
      ],
    },
    {
      title: 'ORDERS & PAYMENTS',
      items: [
        { label: 'Manage Orders', path: '/admin/orders', icon: ShoppingBag },
        { label: 'Returns & Refunds', path: '/admin/returns', icon: RotateCcw },
        { label: 'Payment Verification', path: '/admin/payments', icon: CheckSquare },
        { label: 'Wallet / Transactions', path: '/admin/transactions', icon: Wallet },
      ],
    },
    {
      title: 'CATALOG',
      items: [
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Categories', path: '/admin/categories', icon: Layers },
        { label: 'Brands', path: '/admin/brands', icon: Award },
      ],
    },
    {
      title: 'MARKETING',
      items: [
        { label: 'Campaigns / Offers', path: '/admin/campaigns', icon: Megaphone },
        { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
        { label: 'Discounts', path: '/admin/discounts', icon: Percent },
        { label: 'Homepage Banner', path: '/admin/announcement', icon: Monitor },
      ],
    },
    {
      title: 'CUSTOMERS',
      items: [
        { label: 'Customer Reviews', path: '/admin/reviews', icon: Star },
        { label: 'Manage Users', path: '/admin/users', icon: Users },
      ],
    },
    {
      title: 'STORE',
      items: [
        { label: 'Shipping Settings', path: '/admin/shipping', icon: Truck },
        { label: 'About Page Management', path: '/admin/about', icon: FileText },
        { label: 'Store Configuration', path: '/admin/settings', icon: Sliders },
        { label: 'Home Page Preview', path: '/', icon: Eye, external: true },
        { label: 'Shop Page Preview', path: '/shop?preview=true', icon: Eye, external: true },
        { label: 'About Page Preview', path: '/about', icon: Eye, external: true },
      ],
    },
    ...(user && user.email && user.email.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'vault.co.6235@gmail.com').toLowerCase()
      ? [
          {
            title: 'ADMINISTRATION',
            items: [
              { label: 'Admin Management', path: '/admin/admin-management', icon: ShieldAlert },
            ],
          },
        ]
      : []),
  ];

  const isSuperAdmin = Boolean(
    user &&
      user.email &&
      user.email.toLowerCase() ===
        (import.meta.env.VITE_ADMIN_EMAIL || 'vault.co.6235@gmail.com').toLowerCase()
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container — White / Off-White light VAULT theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#e5e5e5] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Header */}
        <div className="p-5 border-b border-[#e5e5e5] flex items-center justify-between">
          <VaultLogo 
            to="/admin/dashboard" 
            size="admin" 
            theme="dark"
            badge={
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#d97706] bg-[#fef3c7] px-2 py-0.5 rounded-full border border-[#fde68a] ml-1">
                {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </span>
            }
          />

          <button
            onClick={onMobileClose}
            className="p-1.5 text-[#6b7280] hover:text-[#111111] lg:hidden rounded-lg hover:bg-[#f3f4f6]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="text-[10px] font-mono font-extrabold uppercase tracking-[0.18em] text-[#9ca3af] px-3 py-1">
                {group.title}
              </h4>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = !item.external && location.pathname === item.path;

                return item.external ? (
                  <a
                    key={item.path + item.label}
                    href={item.path}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs font-mono font-bold text-[#4b5563] hover:text-[#111111] px-3 py-2 rounded-xl hover:bg-[#f3f4f6] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className="text-[#9ca3af] group-hover:text-[#111111]" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={12} className="text-[#9ca3af] group-hover:text-[#4b5563]" />
                  </a>
                ) : (
                  <NavLink
                    key={item.path + item.label}
                    to={item.path}
                    onClick={onMobileClose}
                    className={`flex items-center gap-2.5 text-xs font-mono font-bold px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a] font-extrabold shadow-xs'
                        : 'text-[#4b5563] hover:text-[#111111] hover:bg-[#f9fafb]'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-[#d97706]' : 'text-[#9ca3af]'} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Account & Logout Footer */}
        <div className="p-4 border-t border-[#e5e5e5] bg-[#fafafa] space-y-3 font-mono">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#111111] truncate font-sans">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-[#6b7280] truncate">{user?.email || 'admin@vault.co'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-xs font-bold text-[#dc2626] hover:text-[#b91c1c] bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
