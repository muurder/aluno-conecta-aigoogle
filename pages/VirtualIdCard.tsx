import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!cardRef.current || !user) return;

    setDownloading(true);
    try {
      const frontTarget = cardRef.current.querySelector('#card-front') as HTMLElement | null;
      const backTarget = cardRef.current.querySelector('#card-back') as HTMLElement | null;

      if (!frontTarget || !backTarget) {
        throw new Error("Could not find card elements.");
      }

      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(frontTarget, { useCORS: true, allowTaint: false, scale: 3, backgroundColor: null }),
        html2canvas(backTarget, { useCORS: true, allowTaint: false, scale: 3, backgroundColor: null }),
      ]);

      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85, 54],
      });

      pdf.addImage(frontImg, 'PNG', 0, 0, 85, 54);
      pdf.addPage([85, 54], 'landscape');
      pdf.addImage(backImg, 'PNG', 0, 0, 85, 54);

      pdf.save(`carteirinha-${user.fullName?.toLowerCase().replace(/\s+/g, '-') || 'estudante'}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const QRCodeGenerator: React.FC = () => {
    if (!user) return null;

    const encodedUid = btoa(unescape(encodeURIComponent(user.uid)));
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
