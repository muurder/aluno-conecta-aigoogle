import React, { useState, useEffect } from 'react';

// A versão atual do aplicativo empacotado neste APK.
// Quando você for gerar um novo APK, você pode subir esse número.
const CURRENT_VERSION = '1.0.1';

interface UpdateInfo {
  version: string;
  url: string;
  releaseNotes?: string;
}

const isNewerVersion = (current: string, latest: string): boolean => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentVal = currentParts[i] || 0;
    const latestVal = latestParts[i] || 0;
    if (latestVal > currentVal) return true;
    if (latestVal < currentVal) return false;
  }
  return false;
};

const UpdateChecker: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Apenas rodamos a verificação se estiver rodando dentro do Capacitor (APK/App Nativo)
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
    if (!isCapacitor) return;

    const checkUpdates = async () => {
      try {
        // Busca o arquivo JSON de versão com um timestamp para evitar o cache do navegador/webview
        const response = await fetch(`https://alunoconecta.vercel.app/version.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data: UpdateInfo = await response.json();
        
        if (data.version && isNewerVersion(CURRENT_VERSION, data.version)) {
          setUpdateInfo(data);
          setShowModal(true);
        }
      } catch (error) {
        console.error('[UpdateChecker] Falha ao verificar atualizações:', error);
      }
    };

    // Pequeno delay para não competir com a animação de carregamento inicial
    const timer = setTimeout(checkUpdates, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    if (!updateInfo) return;
    try {
      // Abre o navegador padrão do sistema para iniciar o download do APK
      window.open(updateInfo.url, '_system');
    } catch (err) {
      window.location.href = updateInfo.url;
    }
    setShowModal(false);
  };

  if (!showModal || !updateInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Ícone de download com animação sutil */}
        <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mb-4 animate-bounce-slow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Atualização Disponível!
        </h3>
        
        <p className="text-sm text-[var(--muted)] mb-4">
          Uma nova versão do <strong>Portal do Aluno</strong> está pronta (versão {updateInfo.version}). Atualize para obter as correções e novidades mais recentes.
        </p>

        {updateInfo.releaseNotes && (
          <div className="w-full max-h-32 overflow-y-auto mb-6 p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-left text-xs">
            <p className="font-semibold text-[var(--foreground)] mb-1">Novidades desta versão:</p>
            <p className="text-[var(--muted)] whitespace-pre-line leading-relaxed">
              {updateInfo.releaseNotes}
            </p>
          </div>
        )}

        <div className="flex flex-col w-full gap-2">
          <button
            onClick={handleUpdate}
            className="w-full py-3 bg-[var(--primary)] text-white hover:opacity-90 active:scale-98 transition-all font-semibold rounded-xl text-sm shadow-md shadow-[var(--primary)]/20"
          >
            Baixar e Instalar
          </button>
          
          <button
            onClick={() => setShowModal(false)}
            className="w-full py-2.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-xl transition-all font-medium"
          >
            Lembrar mais tarde
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateChecker;
