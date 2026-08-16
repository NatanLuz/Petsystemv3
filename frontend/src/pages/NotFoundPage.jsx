import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--accent-danger)', marginBottom: '1rem' }}>404</h1>
      <h2>Página Não Encontrada</h2>
      <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
        A rota solicitada não existe no React Router.
      </p>
      <Link to="/" className="btn btn-primary">
        Voltar para o Início
      </Link>
    </div>
  );
}
