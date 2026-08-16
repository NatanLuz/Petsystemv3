import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card-glass" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
        <span className="badge badge-success" style={{ marginBottom: '1.5rem' }}>
          ✨ Fundação Técnica Operacional
        </span>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>
          Bem-vindo ao <span style={{ color: '#3b82f6' }}>PETSYSTEM V3</span>
        </h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 2rem' }}>
          Sistema de gerenciamento para PetShops e Clínicas Veterinárias construído sobre uma arquitetura moderna e desacoplada.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/health" className="btn btn-primary">
            Verificar Conexão com API
          </Link>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="btn btn-secondary"
          >
            Documentação do Projeto
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card-glass">
          <h3 style={{ marginBottom: '0.5rem', color: '#3b82f6' }}>🚀 Backend Laravel</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            API RESTful construída em PHP/Laravel com Eloquent ORM e Laravel Sanctum preparados.
          </p>
        </div>

        <div className="card-glass">
          <h3 style={{ marginBottom: '0.5rem', color: '#10b981' }}>⚛️ Frontend React JSX</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Interface SPA ultra rápida desenvolvida com React, Vite, React Router e Axios.
          </p>
        </div>

        <div className="card-glass">
          <h3 style={{ marginBottom: '0.5rem', color: '#f59e0b' }}>🐘 PostgreSQL</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Banco de dados relacional robusto configurado como fonte principal de persistência.
          </p>
        </div>
      </div>
    </div>
  );
}
