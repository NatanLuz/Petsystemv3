import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function HealthPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);
    setHealthData(null);
    try {
      const response = await api.get('/health/ready');
      setHealthData(response.data);
    } catch (err) {
      setError(err.message || 'Falha ao conectar com a API Laravel REST');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card-glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2>Status da API REST (Backend)</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Verificação em tempo real de comunicação React &rarr; Axios &rarr; Laravel API.
            </p>
          </div>
          <button onClick={fetchHealthStatus} className="btn btn-secondary">
            🔄 Recarregar Status
          </button>
        </div>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Conectando ao servidor Laravel...
          </div>
        )}

        {error && (
          <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>⚠️ Erro de Comunicação</h4>
            <p>{error}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              Certifique-se de que o backend Laravel está rodando (`php artisan serve`).
            </p>
          </div>
        )}

        {healthData && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${healthData.status === 'ok' ? 'badge-success' : 'badge-danger'}`}>
                ● Status: {healthData.status.toUpperCase()}
              </span>
              <span className={`badge ${healthData.database === 'up' ? 'badge-success' : 'badge-danger'}`}>
                Banco de dados: {healthData.database?.toUpperCase()}
              </span>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1.25rem', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <pre>{JSON.stringify(healthData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
