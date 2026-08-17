import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
