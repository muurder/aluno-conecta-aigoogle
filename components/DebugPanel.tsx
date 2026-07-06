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
  const [expanded, setExpanded] = useState(true);
  const [env, setEnv] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const addLog = (message: string, detail?: string) => {
      const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
      setLogs(prev => {
        const next = [...prev, { time, message, detail }];
        return next.length > 80 ? next.slice(next.length - 80) : next;
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

    const info: Record<string, unknown> = {};
    try {
      info.ios = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      info.iosVersion = (navigator as any).userAgent.match(/OS (\d+)_/)?.[1] || null;
      info.safari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
      info.lang = navigator.language;
      info.online = navigator.onLine;
      info.indexedDB = typeof indexedDB !== 'undefined';
      info.localStorage = (function() {
        try { localStorage.setItem('__dbg__', '1'); localStorage.removeItem('__dbg__'); return true; } catch { return false; }
      })();
      info.firebaseApps = typeof (window as any).firebase !== 'undefined' ? (window as any).firebase.apps?.length : 'global-undef';
    } catch {
      // ignore environment detection errors
    }

    setEnv(info);
    addLog('App iniciado');
    addLog('iOS?', String(info.ios));
    addLog('IndexedDB?', String(info.indexedDB));
    addLog('localStorage?', String(info.localStorage));
    addLog('Firebase global', String(info.firebaseApps));
    if (error) addLog('Auth ERROR', error.message);
  }, [error]);

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
        fontSize: 11,
        lineHeight: 1.4,
        background: '#000000dd',
        color: '#f9fafb',
        padding: expanded ? 10 : 6,
        cursor: 'pointer',
        borderTop: '1px solid #333',
        maxHeight: expanded ? '65vh' : 26,
        overflow: 'auto',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 13 }}>DEBUG</span>
        <span style={{ color: '#9ca3af' }}>loading:{String(loading)}</span>
        <span style={{ color: '#9ca3af' }}>user:{user ? 'sim' : 'null'}</span>
        {error && <span style={{ color: '#ef4444' }}>error:{error.message}</span>}
        <span style={{ color: '#4b5563' }}>logs:{logs.length}</span>
        <span style={{ color: '#4b5563', marginLeft: 'auto' }}>iOS:{String(env.ios)}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ color: '#6b7280', borderBottom: '1px solid #222', paddingBottom: 4, marginBottom: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span>iOS:{String(env.ios)}{env.iosVersion ? '(' + env.iosVersion + ')' : ''}</span>
            <span>Safari:{String(env.safari)}</span>
            <span>IDB:{String(env.indexedDB)}</span>
            <span>LS:{String(env.localStorage)}</span>
            <span>Net:{String(env.online)}</span>
            <span>FB:{String(env.firebaseApps)}</span>
          </div>
          {logs.map((entry, idx) => (
            <div key={idx} style={{ color: entry.message === 'ERRO' || entry.message === 'REJECT' ? '#ef4444' : '#e5e7eb' }}>
              <span style={{ color: '#4b5563' }}>[{entry.time}]</span>{' '}
              <span style={{ fontWeight: 'bold' }}>{escHtml(entry.message)}</span>
              {entry.detail && <span>: {escHtml(entry.detail)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function escHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
