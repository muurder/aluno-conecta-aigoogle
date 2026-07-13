import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase';
import { getStorage, ref as storageRef, getBlob } from 'firebase/storage';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { jsPDF } from 'jspdf';
import { COURSE_SUBJECTS } from '../constants';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Helper to fetch and convert image URL to base64 with a 2.5s timeout
  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const fetchPromise = async (): Promise<string> => {
      // 1. If it's a Firebase Storage URL (most common case), use the modular Firebase Storage SDK getBlob
      if (url.startsWith('gs://') || url.includes('firebasestorage.googleapis.com')) {
        try {
          const storageInstance = getStorage();
          const imageRef = storageRef(storageInstance, url);
          const blob = await getBlob(imageRef);
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn("Storage SDK photo fetch failed, trying direct fetch:", err);
        }
      }

      // 2. Direct fetch for non-Storage URLs (e.g. Google avatar) or if SDK fails
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fallbackErr) {
        console.warn("Direct fetch failed:", fallbackErr);
      }

      throw new Error("All photo download methods failed.");
    };

    // Race the fetch operation against a 2.5 second timeout
    return Promise.race([
      fetchPromise(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de 2.5s excedido ao carregar a foto.")), 2500)
      )
    ]);
  };

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return 'DD/MM/AAAA';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getSubjects = () => {
    if (!user?.course) return COURSE_SUBJECTS['Default'];
    const courseKey = Object.keys(COURSE_SUBJECTS).find(
      key => key.toLowerCase() === user.course?.toLowerCase()
    );
    return courseKey ? COURSE_SUBJECTS[courseKey] : COURSE_SUBJECTS['Default'];
  };

  const handleDownloadPDF = async () => {
    if (!user) return;
    
    setDownloading(true);
    try {
      // 1. Fetch student photo base64 in background
      let photoBase64 = '';
      if (user.photo) {
        try {
          photoBase64 = await getBase64ImageFromUrl(user.photo);
        } catch (err) {
          console.error("Could not load user photo as base64:", err);
        }
      }

      // 2. Initialize Portrait A4 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const isNewStyle = user.cardStyle === 'new';
      
      // 3. Draw Document Header Banner
      pdf.setFillColor(12, 45, 91); // Primary deep navy blue
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text("PORTAL DO ESTUDANTE", 15, 18);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(180, 200, 230);
      pdf.text("Carteirinha de Estudante Digital Oficial", 15, 25);
      
      const todayStr = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
      pdf.setFontSize(8);
      pdf.text(`Exportado em: ${todayStr}`, pageWidth - 65, 25);
      
      // 4. Student Metadata Block
      pdf.setTextColor(50, 60, 80);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Estudante: ${user.fullName?.toUpperCase()}`, 15, 52);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Curso: ${user.course} | RGM: ${user.rgm}`, 15, 58);
      
      // Horizontal separator line
      pdf.setDrawColor(220, 225, 230);
      pdf.line(15, 62, pageWidth - 15, 62);
      
      // CR-80 Card Size: 85.6mm x 54.0mm
      const cardWidth = 85.6;
      const cardHeight = 54.0;
      const x = (pageWidth - cardWidth) / 2; // Centered Card X
      
      // ==========================================
      // --- FRONT CARD (Y = 70) ---
      // ==========================================
      const yFront = 70;
      
      // Dotted cutting line around card
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x - 0.5, yFront - 0.5, cardWidth + 1, cardHeight + 1, 'S');
      pdf.setLineDashPattern([], 0); // Reset dash

      if (isNewStyle) {
        // --- NEW STYLE FRONT (LIGHT METALLIC) ---
        // Background rounded rectangle
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, yFront, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, yFront, cardWidth, cardHeight, 3, 3, 'S');

        // Gold chip mockup
        pdf.setFillColor(250, 204, 21);
        pdf.roundedRect(x + 6, yFront + 15, 8, 6.5, 1, 1, 'F');
        pdf.setDrawColor(202, 138, 4);
        pdf.roundedRect(x + 6, yFront + 15, 8, 6.5, 1, 1, 'S');
        pdf.setDrawColor(180, 100, 10);
        pdf.line(x + 8.6, yFront + 15, x + 8.6, yFront + 21.5);
        pdf.line(x + 11.3, yFront + 15, x + 11.3, yFront + 21.5);
        pdf.line(x + 6, yFront + 17.2, x + 14, yFront + 17.2);
        pdf.line(x + 6, yFront + 19.3, x + 14, yFront + 19.3);

        // Header text
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.text("PORTAL DO ESTUDANTE", x + 6, yFront + 8);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.5);
        pdf.text("DOCUMENTO DIGITAL", x + 6, yFront + 11);

        // Active status badge
        pdf.setFillColor(209, 250, 229);
        pdf.roundedRect(x + cardWidth - 16, yFront + 5, 10, 3.5, 1, 1, 'F');
        pdf.setTextColor(5, 150, 105);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5);
        pdf.text("ATIVO", x + cardWidth - 11, yFront + 7.5, { align: 'center' });

        // University Name
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(user.university || "UNIVERSIDADE", x + cardWidth - 6, yFront + 19, { align: 'right' });
      } else {
        // --- CLASSIC STYLE FRONT (LIGHT TEAL GRADIENT) ---
        pdf.setFillColor(240, 253, 250); // Teal-50
        pdf.roundedRect(x, yFront, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setDrawColor(204, 251, 241); // Teal-100
        pdf.roundedRect(x, yFront, cardWidth, cardHeight, 3, 3, 'S');

        // Header university name
        pdf.setTextColor(51, 65, 85);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(user.university || "UNIVERSIDADE", x + 6, yFront + 11);
      }

      // --- Student Photo Container (Both styles) ---
      const photoX = x + 6;
      const photoY = isNewStyle ? yFront + 23 : yFront + 14;
      const photoW = 14;
      const photoH = 15;
      
      pdf.setFillColor(226, 232, 240);
      pdf.roundedRect(photoX, photoY, photoW, photoH, 1, 1, 'F');
      
      if (photoBase64) {
        try {
          const imageFormat = photoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(photoBase64, imageFormat, photoX, photoY, photoW, photoH);
        } catch (err) {
          console.error("Error inserting image in PDF:", err);
          // Fallback user initials
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(148, 163, 184);
          const initials = user.fullName 
            ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() 
            : 'ST';
          pdf.text(initials, photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
        }
      } else {
        // Fallback user initials
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const initials = user.fullName 
          ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() 
          : 'ST';
        pdf.text(initials, photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
      }

      // --- Student Name and Course (Both styles) ---
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(user.fullName || "NOME COMPLETO", x + 23, photoY + 6);
      
      pdf.setTextColor(13, 148, 136); // teal-600
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(user.course || "Curso", x + 23, photoY + 11);

      // Dividing line
      pdf.setDrawColor(226, 232, 240);
      pdf.line(x + 6, yFront + 42, x + cardWidth - 6, yFront + 42);

      // Bottom Row Credentials
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5);
      pdf.text("RGM", x + 6, yFront + 46);
      pdf.text("NASCIMENTO", x + 28, yFront + 46);
      pdf.text("CAMPUS", x + 49, yFront + 46);
      pdf.text("VALIDADE", x + 72, yFront + 46);

      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(6);
      pdf.text(user.rgm || "#####", x + 6, yFront + 50);
      pdf.text(formatBirthDate(user.birthDate), x + 28, yFront + 50);
      
      const campusText = user.campus?.toUpperCase() || "CAMPUS";
      const displayCampus = campusText.length > 12 ? campusText.substring(0, 10) + "..." : campusText;
      pdf.text(displayCampus, x + 49, yFront + 50);
      
      const validityText = user.validity?.toUpperCase() || "MM/YYYY";
      const displayValidity = validityText.length > 9 ? validityText.substring(0, 7) + "..." : validityText;
      pdf.text(displayValidity, x + 72, yFront + 50);

      // Label below card
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("FRENTE DA CARTEIRINHA", pageWidth / 2, yFront + cardHeight + 5, { align: 'center' });

      // ==========================================
      // --- BACK CARD (Y = 150) ---
      // ==========================================
      const yBack = 150;
      
      // Dotted cutting line around card
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x - 0.5, yBack - 0.5, cardWidth + 1, cardHeight + 1, 'S');
      pdf.setLineDashPattern([], 0); // Reset dash

      if (isNewStyle) {
        // --- NEW STYLE BACK (LIGHT METALLIC) ---
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, yBack, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, yBack, cardWidth, cardHeight, 3, 3, 'S');

        // Magnetic stripe mockup
        pdf.setFillColor(30, 41, 59);
        pdf.rect(x, yBack + 3, cardWidth, 6, 'F');

        // Disciplinas box
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(x + 6, yBack + 15, cardWidth - 12, 17, 2, 2, 'F');
      } else {
        // --- CLASSIC STYLE BACK (DARK SLATE) ---
        pdf.setFillColor(30, 41, 59); // slate-800
        pdf.roundedRect(x, yBack, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setDrawColor(71, 85, 105);
        pdf.roundedRect(x, yBack, cardWidth, cardHeight, 3, 3, 'S');

        // Disciplinas box
        pdf.setFillColor(15, 23, 42, 0.4);
        pdf.roundedRect(x + 6, yBack + 15, cardWidth - 12, 17, 2, 2, 'F');
      }

      // Title header
      pdf.setTextColor(20, 184, 166); // teal-500
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text("DISCIPLINAS RECOMENDADAS", x + 6, yBack + 13);

      // Render recommended subjects in 2 columns inside the box
      const subjects = getSubjects();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(isNewStyle ? 50 : 220, isNewStyle ? 60 : 230, isNewStyle ? 70 : 240);
      
      const col1X = x + 9;
      const col2X = x + 44;
      const rowYBase = yBack + 19;
      
      subjects.slice(0, 6).forEach((sub, i) => {
        const colX = i % 2 === 0 ? col1X : col2X;
        const rowMultiplier = Math.floor(i / 2);
        const rowY = rowYBase + rowMultiplier * 4.2;
        
        // Bullet
        pdf.setFillColor(20, 184, 166);
        pdf.circle(colX - 2, rowY - 1.2, 0.5, 'F');
        // Text
        const textLimit = pdf.splitTextToSize(sub, 30);
        pdf.text(textLimit[0], colX, rowY);
      });

      // Warning text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(4.5);
      pdf.setTextColor(isNewStyle ? 100 : 160, isNewStyle ? 110 : 170, isNewStyle ? 120 : 180);
      pdf.text("Uso pessoal e intransferível. Esta carteirinha digital é válida em todo", x + cardWidth / 2, yBack + 35, { align: 'center' });
      pdf.text("território nacional como identificação estudantil nos termos da lei.", x + cardWidth / 2, yBack + 37.5, { align: 'center' });

      // Barcode Area
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x + 15, yBack + 40, cardWidth - 30, 8, 'F');
      
      // Draw realistic vector barcode inside the rect
      const barcodeVal = user.uid || 'ALUNOCONECTA';
      const hash = barcodeVal.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      let startX = x + 17;
      const totalBarWidth = cardWidth - 34;
      const barWidthUnit = totalBarWidth / 35; // 35 slots
      
      pdf.setFillColor(0, 0, 0);
      for (let i = 0; i < 35; i++) {
        const isBar = i % 2 === 0;
        const seed = Math.sin(hash + i) * 10000;
        const widthMultiplier = Math.floor((seed - Math.floor(seed)) * 2) + 1; // 1 or 2 units wide
        const barW = barWidthUnit * widthMultiplier;
        
        if (isBar && startX + barW < x + cardWidth - 17) {
          pdf.rect(startX, yBack + 41, barW, 6, 'F');
        }
        startX += barW + barWidthUnit * 0.5;
      }

      // Code text below barcode
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(isNewStyle ? 80 : 180, isNewStyle ? 90 : 190, isNewStyle ? 100 : 200);
      pdf.text(`CÓDIGO: ${user.uid?.substring(0, 10).toUpperCase() || 'XXXXXXXXXX'}`, x + cardWidth / 2, yBack + 50, { align: 'center' });

      // Label below card
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("VERSO DA CARTEIRINHA", pageWidth / 2, yBack + cardHeight + 5, { align: 'center' });

      // ==========================================
      // --- INSTRUCTIONS FOOTER ---
      // ==========================================
      pdf.setDrawColor(220, 225, 230);
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
            <p className="mt-5 text-gray-500 text-center text-sm font-medium">Apresente este código QR para validação digital da carteirinha.</p>
        </div>
    );
  };
  
  return (
    <div className="flex-grow flex flex-col bg-gray-100 text-gray-800 min-h-[100dvh] relative overflow-hidden">
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <header className="p-4 flex items-center justify-between text-gray-700 relative z-20 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition">
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-lg absolute left-1/2 -translate-x-1/2 text-gray-800">Carteirinha Virtual</h1>
          <button className="text-gray-500 p-2 rounded-full hover:bg-gray-200 transition">
              <ArrowPathIcon className="w-6 h-6 text-gray-600" />
          </button>
      </header>

      <div className="p-4 relative z-10">
          <div className="flex justify-center bg-gray-200/80 border border-gray-300/50 rounded-full p-1.5 max-w-sm mx-auto backdrop-blur">
              <button
                  onClick={() => setActiveTab('card')}
                  className={`w-1/2 py-2 rounded-full font-bold transition text-xs uppercase tracking-wider ${activeTab === 'card' ? 'bg-white shadow text-blue-800 border border-gray-200' : 'text-gray-600 hover:text-gray-805'}`}
              >
                  Carteirinha
              </button>
              <button
                  onClick={() => setActiveTab('qr')}
                  className={`w-1/2 py-2 rounded-full font-bold transition text-xs uppercase tracking-wider ${activeTab === 'qr' ? 'bg-white shadow text-blue-800 border border-gray-200' : 'text-gray-600 hover:text-gray-805'}`}
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
               <div className="text-center text-sm text-gray-500 font-medium">
                  Apresente esta carteirinha para identificação.
               </div>
          ) : (
               <button className="w-full max-w-sm bg-gray-200 border border-gray-300 text-gray-800 font-bold p-4 rounded-2xl hover:bg-gray-300 shadow-md transition">
                  Solicitar carteirinha física
              </button>
          )}
      </footer>
    </div>
  );
};

export default VirtualIdCard;
