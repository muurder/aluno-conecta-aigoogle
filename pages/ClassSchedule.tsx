import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { schedulesData, Schedule } from '../schedules';
import { ArrowLeftIcon, ClockIcon, UserIcon, MapPinIcon, InformationCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import jsPDF from 'jspdf';

const ClassSchedule: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const scheduleRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const userSchedule = useMemo(() => {
        if (!user) return [];
        return schedulesData.filter(item => item.disciplina === user.course);
    }, [user]);

    const groupedSchedule = useMemo(() => {
        const groups: { [key: string]: Schedule[] } = {
            'Segunda': [], 'Terça': [], 'Quarta': [], 'Quinta': [], 'Sexta': [], 'Sábado': []
        };
        userSchedule.forEach(item => {
            if (groups[item.dia_semana]) {
                groups[item.dia_semana].push(item);
            }
        });
        for (const day in groups) {
            groups[day].sort((a, b) => a.inicio.localeCompare(b.inicio));
        }
        return groups;
    }, [userSchedule]);

    const dayOrder: (keyof typeof groupedSchedule)[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const handleDownloadSchedulePDF = async () => {
        if (!user) return;
        setDownloading(true);
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // Header Banner
            pdf.setFillColor(12, 45, 91); // Primary dark blue color
            pdf.rect(0, 0, pageWidth, 40, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text("PORTAL DO ESTUDANTE", 15, 18);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(180, 200, 230);
            pdf.text("Grade de Horário de Aulas Oficial", 15, 25);

            const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            pdf.setFontSize(8);
            pdf.text(`Emitido em: ${todayStr}`, pageWidth - 65, 25);

            // Student Meta Box
            pdf.setFillColor(245, 247, 250);
            pdf.rect(15, 48, pageWidth - 30, 24, 'F');
            pdf.setDrawColor(220, 225, 230);
            pdf.rect(15, 48, pageWidth - 30, 24, 'S');

            pdf.setTextColor(50, 60, 80);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.text(`Estudante: ${user.fullName?.toUpperCase()}`, 20, 55);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9.5);
            pdf.text(`Curso: ${user.course}`, 20, 61);
            pdf.text(`Campus: ${user.campus} | RGM: ${user.rgm}`, 20, 66);

            let currentY = 82;

            if (userSchedule.length === 0) {
                pdf.setTextColor(120, 120, 120);
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(11);
                pdf.text("Nenhum horário de aulas cadastrado.", pageWidth / 2, currentY + 10, { align: 'center' });
            } else {
                dayOrder.forEach(day => {
                    const dayClasses = groupedSchedule[day] || [];
                    if (dayClasses.length === 0) return;

                    if (currentY > 245) {
                        pdf.addPage();
                        currentY = 20;
                    }

                    // Render Day Header
                    pdf.setFillColor(235, 242, 250);
                    pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
                    pdf.setTextColor(12, 45, 91);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.text(`${day.toUpperCase()}-FEIRA`, 18, currentY + 5.5);

                    currentY += 8;

                    // Table Columns Headers
                    pdf.setTextColor(100, 110, 120);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8);
                    pdf.text("HORÁRIO", 18, currentY + 5);
                    pdf.text("DISCIPLINA", 50, currentY + 5);
                    pdf.text("PROFESSOR", 125, currentY + 5);
                    pdf.text("SALA / BLOCO", 175, currentY + 5);
                    
                    pdf.setDrawColor(200, 205, 210);
                    pdf.line(15, currentY + 7, pageWidth - 15, currentY + 7);

                    currentY += 7;

                    dayClasses.forEach(item => {
                        if (currentY > 260) {
                            pdf.addPage();
                            currentY = 20;
                            
                            pdf.setFillColor(235, 242, 250);
                            pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
                            pdf.setTextColor(12, 45, 91);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setFontSize(10);
                            pdf.text(`${day.toUpperCase()}-FEIRA (Cont.)`, 18, currentY + 5.5);
                            currentY += 12;
                        }

                        pdf.setTextColor(60, 60, 60);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(8.5);
                        
                        pdf.text(`${item.inicio} - ${item.fim}`, 18, currentY + 6);
                        
                        const subjectText = pdf.splitTextToSize(item.observacoes || '', 70);
                        pdf.text(subjectText, 50, currentY + 6);
                        
                        const professorText = pdf.splitTextToSize(item.professor || '', 45);
                        pdf.text(professorText, 125, currentY + 6);
                        
                        pdf.text(`Sala ${item.sala}, Bloco ${item.bloco}`, 175, currentY + 6);

                        const subjectHeight = subjectText.length * 4;
                        const rowHeight = Math.max(8, subjectHeight + 2);

                        pdf.setDrawColor(235, 240, 245);
                        pdf.line(15, currentY + rowHeight, pageWidth - 15, currentY + rowHeight);
                        currentY += rowHeight;
                    });

                    currentY += 6;
                });
            }

            pdf.setFontSize(7.5);
            pdf.setTextColor(160, 160, 160);
            pdf.text("Portal do Estudante Conecta © Documento gerado de forma oficial.", pageWidth / 2, 285, { align: 'center' });

            pdf.save(`horario-${user?.course?.toLowerCase().replace(/\s+/g, '-') || 'aluno'}.pdf`);
        } catch (error) {
            console.error("Error generating schedule PDF:", error);
        } finally {
            setDownloading(false);
        }
    };

    return (
     <div className="flex flex-col bg-gray-100 min-h-[100dvh]">
         <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
             <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                 <ArrowLeftIcon className="w-6 h-6" />
             </button>
             <h1 className="font-bold text-lg">Horário de Aulas</h1>
         </header>

         <main ref={scheduleRef} className="flex-grow p-4 overflow-y-auto space-y-6 pb-24">
             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                 <h2 className="text-xl font-bold text-blue-800">{user?.course}</h2>
                 <p className="text-gray-500">{user?.campus}</p>
             </div>

             {userSchedule.length === 0 ? (
                 <div className="text-center py-10">
                     <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                     <h3 className="font-bold text-gray-700">Nenhum horário encontrado</h3>
                     <p className="text-gray-500 mt-1">Não há horários de aula cadastrados para o seu curso no momento.</p>
                 </div>
             ) : (
                 dayOrder.map(day => (
                     groupedSchedule[day].length > 0 && (
                         <div key={day}>
                             <h3 className="font-bold text-lg text-gray-700 mb-3">{day}-feira</h3>
                             <div className="space-y-4">
                                 {groupedSchedule[day].map((item, index) => (
                                     <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-l-4 border-blue-500">
                                         <div className="flex justify-between items-start mb-2">
                                             <h4 className="font-bold text-base text-gray-800 flex-1">{item.observacoes}</h4>
                                             <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                                 <ClockIcon className="w-4 h-4" />
                                                 <span>{item.inicio} - {item.fim}</span>
                                             </div>
                                         </div>
                                         <div className="space-y-2 text-sm text-gray-600">
                                             <p className="flex items-center gap-2">
                                                 <UserIcon className="w-4 h-4 text-gray-400" />
                                                 {item.professor}
                                             </p>
                                             <p className="flex items-center gap-2">
                                                 <MapPinIcon className="w-4 h-4 text-gray-400" />
                                                 {`Sala ${item.sala}, ${item.bloco}`}
                                             </p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )
                 ))
             )}
         </main>

         <button
             onClick={handleDownloadSchedulePDF}
             disabled={downloading}
             className="fixed bottom-20 left-0 right-0 mx-auto w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
         >
             {downloading ? (
                 <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
             ) : (
                  <ArrowDownTrayIcon className="w-4 h-4" />
             )}
             <span>{downloading ? 'Gerando PDF...' : 'Baixar Horário'}</span>
         </button>
     </div>
  );
};

export default ClassSchedule;
