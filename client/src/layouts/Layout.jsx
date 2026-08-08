import React, { useState, useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import SidebarMenu from '../components/SidebarMenu';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [pathname, search, navigationType]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header onMenuClick={() => setMenuOpen(true)} />

      {/* Main Contents */}
      <main className="flex-grow pb-24 md:pb-8">
        {children}
      </main>

      {/* Slide-out navigation menu */}
      <SidebarMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
      />

      {/* Footer (hidden or styled appropriately for mobile first) */}
      <Footer />

      {/* Mobile Sticky bottom menu */}
      <MobileNav />
    </div>
  );
}
