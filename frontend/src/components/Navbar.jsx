import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.2rem 2rem',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          color: '#ffffff'
        }}>
          🐾
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          PETSYSTEM <span style={{ color: '#3b82f6' }}>V3</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link 
          to="/" 
          className={`btn ${location.pathname === '/' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Início
        </Link>
        <Link 
          to="/health" 
          className={`btn ${location.pathname === '/health' ? 'btn-primary' : 'btn-secondary'}`}
        >
          API Status
        </Link>
      </div>
    </nav>
  );
}
