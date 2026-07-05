
import React, { useState, useRef } from 'react';
// FIX: Update react-router-dom imports to v6. 'useHistory' is 'useNavigate'.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { User } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  // FIX: Use useNavigate() for navigation in react-router-dom v6.
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!cardRef.current || !user) return;
    
    setDownloading(true);
    try {
      // Ensure images are fully loaded
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const frontElement = cardRef.current.querySelector('#card-front') as HTMLElement;
      const backElement = cardRef.current.querySelector('#card-back') as HTMLElement;
      
      if (!frontElement || !backElement) {
        throw new Error("Could not find front or back card elements.");
      }
      
      const canvasFront = await html2canvas(frontElement, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: null
      });
      
      const canvasBack = await html2canvas(backElement, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: null
      });
      
      const imgFront = canvasFront.toDataURL('image/png');
      const imgBack = canvasBack.toDataURL('image/png');
      
      const cardWidth = 85;
      const cardHeight = 54; // Standard ID card size (landscape ratio)
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [cardWidth, cardHeight]
      });
      
      // Page 1: Front
      pdf.addImage(imgFront, 'PNG', 0, 0, cardWidth, cardHeight);
      
      // Page 2: Back
      pdf.addPage([cardWidth, cardHeight], 'landscape');
      pdf.addImage(imgBack, 'PNG', 0, 0, cardWidth, cardHeight);
      
      pdf.save(`carteirinha-${user.fullName?.toLowerCase().replace(/\s+/g, '-') || 'estudante'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const QRCodeGenerator: React.FC = () => {
    if (!user) return null;
    
    // Encode only the user's UID (decreases data size and improves QR code density/readability)
    const encodedUid = btoa(user.uid);
    const validationUrl = `${window.location.origin}${window.location.pathname}#/validate-id/${encodedUid}`;

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
     <div className="flex-grow flex flex-col bg-gray-50 min-h-[100dvh]">
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
        
        <main className="flex-grow flex items-center justify-center p-4">
            {activeTab === 'card' ? (
                <div className="flex flex-col items-center w-full">
                    <StudentIdCard ref={cardRef} user={user || {}} />
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed text-sm"
                    >
                        {downloading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                        )}
                        <span>{downloading ? 'Gerando PDF...' : 'Baixar PDF'}</span>
                    </button>
                </div>
            ) : (
                <QRCodeGenerator />
            )}
        </main>
        
        <footer className="p-6 h-24 flex items-center justify-center">
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
