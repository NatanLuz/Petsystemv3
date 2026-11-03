import React, { useCallback, useEffect, useRef, useState } from 'react';

export function Toast({ message, tone = 'success' }) {
  if (!message) return null;
  const role = tone === 'error' ? 'alert' : 'status';
  return <div className={`feedback-toast feedback-toast-${tone}`} role={role}>{message}</div>;
}

export function LoadingSkeleton({ label = 'Carregando conteúdo...', rows = 3 }) {
  return (
    <div className="feedback-skeleton" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="feedback-empty">
      <strong>{message}</strong>
      {actionLabel && onAction && <button type="button" className="btn btn-primary" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="feedback-error" role="alert">
      <span>{message}</span>
      {onRetry && <button type="button" className="btn btn-secondary" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', tone = 'danger', onConfirm, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-message">{message}</p>
      <div className="confirm-dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Voltar</button>
        <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}

export function useConfirmDialog() {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);
  const confirm = useCallback((options) => new Promise((resolve) => {
    resolveRef.current = resolve;
    setRequest(options);
  }), []);
  const settle = useCallback((answer) => {
    resolveRef.current?.(answer);
    resolveRef.current = null;
    setRequest(null);
  }, []);
  const dialog = <ConfirmDialog
    open={Boolean(request)}
    title={request?.title || ''}
    message={request?.message || ''}
    confirmLabel={request?.confirmLabel || 'Confirmar'}
    tone={request?.tone || 'danger'}
    onConfirm={() => settle(true)}
    onCancel={() => settle(false)}
  />;

  return { confirm, dialog };
}
