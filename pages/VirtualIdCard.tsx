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
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const frontElement = cardRef.current.querySelector('#card-front') as HTMLElement;
      const backElement = cardRef.current.querySelector('#card-back') as HTMLElement;
      
      if (!frontElement || !backElement) {
        throw new Error("Could not find front or back card elements.");
      }
      
      const canvasFront = await html2canvas(frontElement, {
        useCORS: true,
        allowTaint: false,
        scale: 4,
        backgroundColor: '#0c1325'
      });
      
      const canvasBack = await html2canvas(backElement, {
        useCORS: true,
        allowTaint: false,
        scale: 4,
        backgroundColor: '#0c1325'
      });
      
      const imgFront = canvasFront.toDataURL('image/png');
      const imgBack = canvasBack.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      
      // 1. Draw elegant document background and header
      pdf.setFillColor(12, 21, 41); // Deep slate banner
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text("PORTAL DO ESTUDANTE", 15, 18);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(150, 180, 200);
      pdf.text("Carteirinha de Estudante Digital Oficial", 15, 25);
      
      // Draw date/time of export
      const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      pdf.setFontSize(8);
      pdf.text(`Exportado em: ${todayStr}`, pageWidth - 65, 25);
      
      // Reset color
      pdf.setTextColor(50, 50, 50);
      
      // 2. Center student metadata
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Estudante: ${user.fullName?.toUpperCase()}`, 15, 52);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Curso: ${user.course} | RGM: ${user.rgm}`, 15, 58);
      
      // Horizontal separator line
      pdf.setDrawColor(220, 225, 230);
      pdf.line(15, 62, pageWidth - 15, 62);
      
      // CR-80 dimensions: 85.6mm x 54.0mm
      const cardWidth = 85.6;
      const cardHeight = 54.0;
      const x = (pageWidth - cardWidth) / 2; // Centered
      
      // --- FRONT CARD (Y = 70) ---
      const yFront = 70;
      // Draw cutting guidelines
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x - 0.5, yFront - 0.5, cardWidth + 1, cardHeight + 1, 'S');
      
      // Add front image
      pdf.addImage(imgFront, 'PNG', x, yFront, cardWidth, cardHeight);
      
      // Label
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("FRENTE DA CARTEIRINHA", pageWidth / 2, yFront + cardHeight + 5, { align: 'center' });
      
      // --- BACK CARD (Y = 150) ---
      const yBack = 150;
      // Draw cutting guidelines
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x - 0.5, yBack - 0.5, cardWidth + 1, cardHeight + 1, 'S');
      
      // Add back image
      pdf.addImage(imgBack, 'PNG', x, yBack, cardWidth, cardHeight);
      
      // Label
      pdf.text("VERSO DA CARTEIRINHA", pageWidth / 2, yBack + cardHeight + 5, { align: 'center' });
      
      // 3. Instructions footer
      pdf.setDrawColor(220, 225, 230);
      pdf.setLineDashPattern([], 0); // Reset dash
      pdf.line(15, 235, pageWidth - 15, 235);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(50, 60, 70);
      pdf.text("INSTRUÇÕES PARA IMPRESSÃO:", 15, 245);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(80, 90, 100);
      pdf.text("1. Imprima este documento em tamanho real (100% ou sem escala) em papel A4.", 15, 252);
      pdf.text("2. Recomendamos o uso de papel de alta gramatura (ex: 180g/m² ou superior) para melhor firmeza.", 15, 258);
      pdf.text("3. Recorte nas linhas tracejadas externas e dobre o documento ao meio para unir frente e verso.", 15, 264);
      pdf.text("4. Se desejar, plastifique o documento para maior durabilidade.", 15, 270);
      
      // Footer copyright
      pdf.setFontSize(7.5);
      pdf.setTextColor(160, 160, 160);
      pdf.text("Portal do Aluno Conecta © Todos os direitos reservados.", pageWidth / 2, 285, { align: 'center' });
      
      pdf.save(`carteirinha-${user.fullName?.toLowerCase().replace(/\s+/g, '-') || 'estudante'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const QRCodeGenerator: React.FC = () => {
    if (!user) return null;
    
    const encodedUid = btoa(unescape(encodeURIComponent(user.uid)));
    const validationUrl = `${window.location.origin}${window.location.pathname}#/validate-id/${encodedUid}`;

    return (
        <div className="w-full max-w-sm mx-auto p-6 flex flex-col items-center justify-center relative z-10">
            <div className="bg-white p-4 rounded-3xl shadow-2xl">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validationUrl)}`} alt="QR Code" className="rounded-xl" />
            </div>
            <p className="mt-5 text-slate-400 text-center text-sm font-medium">Apresente este código QR para validação digital da carteirinha.</p>
        </div>
    );
  };
  
  return (
    <div className="flex-grow flex flex-col bg-slate-950 text-white min-h-[100dvh] relative overflow-hidden">
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <header className="p-4 flex items-center justify-between text-slate-200 relative z-20 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-slate-900 transition">
              <ArrowLeftIcon className="w-6 h-6 text-white" />
          </button>
          <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2 text-white">Carteirinha Virtual</h1>
          <button className="text-slate-400 p-2 rounded-full hover:bg-slate-900 transition">
              <ArrowPathIcon className="w-6 h-6 text-slate-300" />
          </button>
      </header>

      <div className="p-4 relative z-10">
          <div className="flex justify-center bg-slate-900/60 border border-slate-800/80 rounded-full p-1.5 max-w-sm mx-auto backdrop-blur">
              <button
                  onClick={() => setActiveTab('card')}
                  className={`w-1/2 py-2 rounded-full font-bold transition text-xs uppercase tracking-wider ${activeTab === 'card' ? 'bg-slate-800 shadow text-white border border-slate-700/40' : 'text-slate-400 hover:text-slate-300'}`}
              >
                  Carteirinha
              </button>
              <button
                  onClick={() => setActiveTab('qr')}
                  className={`w-1/2 py-2 rounded-full font-bold transition text-xs uppercase tracking-wider ${activeTab === 'qr' ? 'bg-slate-800 shadow text-white border border-slate-700/40' : 'text-slate-400 hover:text-slate-300'}`}
              >
                  Código QR
              </button>
          </div>
      </div>
      
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
          {activeTab === 'card' ? (
              <div className="flex flex-col items-center w-full">
                  <StudentIdCard ref={cardRef} user={user || {}} />
                  <button
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                      className="mt-8 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
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
      
      <footer className="p-6 h-24 flex items-center justify-center relative z-10">
          {activeTab === 'card' ? (
               <div className="text-center text-sm text-slate-400 font-medium">
                  Apresente esta carteirinha para identificação.
               </div>
          ) : (
               <button className="w-full max-w-sm bg-slate-900 border border-slate-800 text-white font-bold p-4 rounded-2xl hover:bg-slate-850 shadow-lg transition">
                  Solicitar carteirinha física
              </button>
          )}
      </footer>
    </div>
  );
};

export default VirtualIdCard;
