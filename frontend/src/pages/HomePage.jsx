import React from 'react';

const metrics = [
  {
    label: 'Total de Clientes',
    value: '—',
    helper: 'Aguardando integração',
    tone: 'blue',
  },
  {
    label: 'Pets Cadastrados',
    value: '—',
    helper: 'Aguardando integração',
    tone: 'green',
  },
  {
    label: 'Atendimentos Hoje',
    value: '—',
    helper: 'Aguardando integração',
    tone: 'yellow',
  },
  {
    label: 'Faturamento do Mês',
    value: '—',
    helper: 'Aguardando integração',
    tone: 'cyan',
  },
];

export default function HomePage() {
  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Visão geral da operação do PetSystem.</p>
        </div>
      </header>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`metric-card metric-card-${metric.tone}`}
          >
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-helper">{metric.helper}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-panels">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Atendimentos</h3>
            <span>Em breve</span>
          </div>
          <div className="empty-state">
            <strong>Dados ainda não disponíveis</strong>
            <p>
              Os atendimentos serão exibidos aqui quando o módulo estiver
              disponível.
            </p>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3>Faturamento</h3>
            <span>Em breve</span>
          </div>
          <div className="empty-state">
            <strong>Dados ainda não disponíveis</strong>
            <p>
              O resumo financeiro será exibido aqui quando o módulo estiver
              disponível.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
