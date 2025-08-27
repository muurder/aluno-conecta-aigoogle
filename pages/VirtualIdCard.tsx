import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { User } from '../types';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
      if (!cardRef.current || isDownloading) return;
      
      setIsDownloading(true);
      try {
        const canvas = await html2canvas(cardRef.current, { 
            scale: 3, // Aumenta a resolução da captura para melhor qualidade
            useCORS: true, // Permite carregar imagens de outras origens
            backgroundColor: null // Fundo transparente
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Define as dimensões do PDF com base na imagem capturada para evitar margens indesejadas
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`carteirinha-virtual-${user?.fullName?.replace(/\s/g, '_')}.pdf`);

      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Não foi possível gerar o PDF. Tente novamente.");
      } finally {
        setIsDownloading(false);
      }
  };

  const QRCodeGenerator: React.FC = () => {
    if (!user) return null;
    
    // Create a copy of the user object and remove the isAdmin property if it exists.
    // This ensures all student data is included without exposing admin status.
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

        <main className="flex-grow flex items-center justify-center p-4">
            {activeTab === 'card' ? (
                <StudentIdCard ref={cardRef} user={user || {}} />
            ) : (
                <QRCodeGenerator />
            )}
        </main>
        
        <footer className="p-6">
            {activeTab === 'card' && (
                 <button 
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="w-full bg-blue-900 text-white font-bold p-4 rounded-lg hover:bg-blue-800 shadow-lg flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                    <DocumentArrowDownIcon className="w-6 h-6"/>
                    {isDownloading ? 'Baixando...' : 'Baixar PDF'}
                </button>
            )}
            {activeTab === 'qr' && (
                 <button className="w-full bg-gray-700 text-white font-bold p-4 rounded-lg hover:bg-gray-600 shadow-lg">
                    Solicitar carteirinha física
                </button>
            )}
        </footer>
    </div>
  );
};

export default VirtualIdCard;
