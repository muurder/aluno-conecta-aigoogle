import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Função utilitária: converte URL de imagem em base64
  const toBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleDownloadPdf = async () => {
    const cardElement = cardRef.current;
    if (!cardElement || isProcessing) return;

    setIsProcessing(true);
    try {
      // Substitui todas as imagens por base64 antes de gerar o PDF
      const imgElements = cardElement.querySelectorAll("img");
      for (const img of Array.from(imgElements)) {
        if (img.src.startsWith("http")) {
          try {
            const base64 = await toBase64(img.src);
            img.setAttribute("src", base64);
          } catch (err) {
            console.warn("Falha ao converter imagem:", img.src, err);
          }
        }
      }

      const canvas = await html2canvas(cardElement, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`carteirinha-virtual-${user?.rgm}.pdf`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Não foi possível baixar o PDF. Tente novamente.");
    } finally {
      setIsProcessing(false);
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
      const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true });
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

  const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }> = ({ icon, label, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-white/80 rounded-md p-2 w-full transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );

  return (
    <div className="flex-grow flex flex-col bg-gray-50">
      <header className="p-4 flex items-center justify-between text-gray-700">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2">Carteirinha Virtual</h1>
        <button className="text-gray-500">
          <ArrowPathIcon className="w-6 h-6" />
        </button>
      </header>

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
            <ActionButton icon={<ShareIcon className="w-5 h-5" />} label="Compartilhar" onClick={handleShare} disabled={isProcessing} />
          </div>
        </div>
      )}

      <main className="flex-grow flex items-center justify-center p-4">
        {activeTab === 'card' ? (
          <StudentIdCard ref={cardRef} user={user || {}} />
        ) : (
          <div>{/* QRCodeGenerator aqui */}</div>
        )}
      </main>
    </div>
  );
};

export default VirtualIdCard;
