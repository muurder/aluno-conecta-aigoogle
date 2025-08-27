import React, { useState, useRef } from 'react';
// FIX: Update react-router-dom imports to v6. 'useHistory' is 'useNavigate'.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, ShareIcon } from '@heroicons/react/24/outline';
import { User } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  // FIX: Use useNavigate() for navigation in react-router-dom v6.
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
      const cardElement = cardRef.current;
      if (!cardElement || isProcessing) return;

      setIsProcessing(true);
      try {
          const canvas = await html2canvas(cardElement, { scale: 3 }); // Higher scale for better quality
          const imgData = canvas.toDataURL('image/png');

          const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
          });
          
          const cardWidth = 85.6;
          const cardHeight = 53.98;
          const x = (210 - cardWidth) / 2;
          const y = (297 - cardHeight) / 2;

          pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
          pdf.save(`carteirinha-virtual-${user?.rgm}.pdf`);
      } catch (error) {
          console.error("Error downloading PDF:", error);
          alert("Não foi possível baixar o PDF. Tente novamente.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleOpenInNewTab = () => {
      const cardElement = cardRef.current;
      if (!cardElement || isProcessing) return;

      const newWindow = window.open('', '_blank');
      if (newWindow) {
          newWindow.document.write(`
              <html>
                  <head>
                      <title>Carteirinha Virtual - ${user?.fullName}</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                  </head>
                  <body class="bg-gray-200 flex items-center justify-center min-h-screen p-4">
                      ${cardElement.outerHTML}
                  </body>
              </html>
          `);
          newWindow.document.close();
      }
  };

  const handleShare = async () => {
      const cardElement = cardRef.current;
      if (!cardElement || isProcessing) return;

      if (!navigator.share) {
          alert('A função de compartilhar não é suportada neste navegador.');
          return;
      }

      setIsProcessing(true);
      try {
          const canvas = await html2canvas(cardElement, { scale: 2 });
          canvas.toBlob(async (blob) => {
              if (blob) {
                  const file = new File([blob], `carteirinha-${user?.rgm}.png`, { type: 'image/png' });
                  await navigator.share({
                      title: 'Carteirinha Virtual',
                      text: `Veja a carteirinha de ${user?.fullName}.`,
                      files: [file],
                  });
              }
          }, 'image/png');
      } catch (error) {
          console.error('Erro ao compartilhar:', error);
          if ((error as DOMException).name !== 'AbortError') {
            alert('Não foi possível compartilhar a carteirinha.');
          }
      } finally {
          setIsProcessing(false);
      }
  };

  const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; }> = ({ icon, label, onClick, disabled }) => (
      <button
          onClick={onClick}
          disabled={disabled}
          className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-white/80 rounded-md p-2 w-full transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
          {icon}
          <span className="mt-1">{label}</span>
      </button>
  );

  const QRCodeGenerator: React.FC = () => {
    if (!user) return null;
    
    const studentDataForQr = { ...user };
    delete (studentDataForQr as Partial<User>).isAdmin;

    const userJsonString = JSON.stringify(studentDataForQr);
    const encodedUserData = btoa(unescape(encodeURIComponent(userJsonString)));
    const validationUrl = `${window.location.origin}${window.location.pathname}#/validate-id/${encodedUserData}`;

    return (
        <div className="w-full max-w-sm mx-auto p-6 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}`} alt="QR Code" />
            </div>
            <p className="mt-4 text-gray-600 text-center">Apresente este código QR para identificação.</p>
        </div>
    );
  };
  
  return (
    <div className="flex-grow flex flex-col bg-gray-50">
        <header className="p-4 flex items-center justify-between text-gray-700">
            {/* FIX: Use navigate(-1) for back navigation in v6. */}
            <button onClick={() => navigate(-1)} className="mr-4">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2">Carteirinha Virtual</h1>
            <button className="text-gray-500">
                <ArrowPathIcon className="w-6 h-6" />
            </button>
        </header>

        <div className="p-4">
            <div className="flex justify-center bg-gray-200/70 rounded-full p-1">
                <button
                    onClick={() => setActiveTab('card')}
                    className={`w-1/2 py-2 rounded-full font-semibold transition text-sm ${activeTab === 'card' ? 'bg-white shadow text-blue-800' : 'text-gray-600'}`}
                >
                    Carteirinha
                </button>
                <button
                    onClick={() => setActiveTab('qr')}
                    className={`w-1/2 py-2 rounded-full font-semibold transition text-sm ${activeTab === 'qr' ? 'bg-white shadow text-blue-800' : 'text-gray-600'}`}
                >
                    Código QR
                </button>
            </div>
        </div>
        
        {activeTab === 'card' && (
            <div className="px-4 pb-2">
                <div className="relative flex justify-center items-center gap-2 p-1 bg-gray-200/70 rounded-lg">
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm font-semibold text-gray-700">Processando...</span>
                        </div>
                    )}
                    <ActionButton icon={<ArrowDownTrayIcon className="w-5 h-5" />} label="Baixar" onClick={handleDownloadPdf} disabled={isProcessing} />
                    <ActionButton icon={<ArrowTopRightOnSquareIcon className="w-5 h-5" />} label="Visualizar" onClick={handleOpenInNewTab} disabled={isProcessing} />
                    <ActionButton icon={<ShareIcon className="w-5 h-5" />} label="Compartilhar" onClick={handleShare} disabled={isProcessing} />
                </div>
            </div>
        )}

        <main className="flex-grow flex items-center justify-center p-4">
            {activeTab === 'card' ? (
                <StudentIdCard ref={cardRef} user={user || {}} />
            ) : (
                <QRCodeGenerator />
            )}
        </main>
        
        <footer className="p-6 h-[96px] flex items-center justify-center">
            {activeTab === 'card' ? (
                 <div className="text-center text-sm text-gray-500">
                    Apresente esta carteirinha para identificação.
                 </div>
            ) : (
                 <button className="w-full bg-gray-700 text-white font-bold p-4 rounded-lg hover:bg-gray-600 shadow-lg">
                    Solicitar carteirinha física
                </button>
            )}
        </footer>
    </div>
  );
};

export default VirtualIdCard;