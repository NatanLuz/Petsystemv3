import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="clients-panel not-found-page" aria-labelledby="not-found-title">
      <h1>404</h1>
      <h2 id="not-found-title">Página não encontrada</h2>
      <p>O endereço não está disponível. Você pode voltar ao painel inicial.</p>
      <Link to="/" className="btn btn-primary">
        Ir para o início
      </Link>
    </section>
  );
}
