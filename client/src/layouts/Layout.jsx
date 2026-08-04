import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import NotificationDrawer from '../components/NotificationDrawer';

export default function Layout({ children }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Header toggleNotifications={() => setNotifOpen(!notifOpen)} />

      {/* Main Contents */}
      <main className="flex-grow pb-24 md:pb-8">
        {children}
      </main>

      {/* Slide-out notifications log */}
      <NotificationDrawer 
        isOpen={notifOpen} 
        onClose={() => setNotifOpen(false)} 
      />

      {/* Footer (hidden or styled appropriately for mobile first) */}
      <Footer />

      {/* Mobile Sticky bottom menu */}
      <MobileNav />
    </div>
  );
}
