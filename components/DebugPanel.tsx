import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type DebugEntry = {
  time: string;
  message: string;
  detail?: string;
};

export const DebugPanel: React.FC = () => {
  const { user, loading, error } = useAuth();
  const [logs, setLogs] = useState<DebugEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const addLog = (message: string, detail?: string) => {
      const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
      setLogs(prev => {
        const next = [...prev, { time, message, detail }];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
    };

    const onError = (event: ErrorEvent) => {
      addLog('ERRO', event.message || 'Erro global');
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      addLog('REJECT', event.reason instanceof Error ? event.reason.message : String(event.reason));
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    addLog('App iniciado');
    addLog('Firebase', typeof window !== 'undefined' ? 'carregado via bundle' : 'N/A');

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.4,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: expanded ? 12 : 6,
        cursor: 'pointer',
        borderTop: '1px solid #333',
        maxHeight: expanded ? '60vh' : 28,
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>DEBUG</span>
        <span>loading: {String(loading)}</span>
        <span>user: {user ? (user as any).uid || 'sim' : 'null'}</span>
        {error && <span style={{ color: '#ef4444' }}>error: {error.message}</span>}
        <span style={{ color: '#94a3b8' }}>logs: {logs.length}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {logs.map((entry, idx) => (
            <div key={idx} style={{ color: entry.message === 'ERRO' || entry.message === 'REJECT' ? '#ef4444' : '#e2e8f0' }}>
              <span style={{ color: '#94a3b8' }}>[{entry.time}]</span>{' '}
              <span style={{ fontWeight: 'bold' }}>{entry.message}</span>
              {entry.detail && <span>: {entry.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
