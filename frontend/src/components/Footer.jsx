import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '1.5rem',
      color: 'var(--text-muted)',
      borderTop: '1px solid var(--border-color)',
      marginTop: 'auto',
      fontSize: '0.9rem'
    }}>
      <p>PETSYSTEM V3 &copy; {new Date().getFullYear()} — Arquitetura REST (Laravel + React + PostgreSQL)</p>
    </footer>
  );
}
