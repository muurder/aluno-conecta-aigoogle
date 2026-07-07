import React, { forwardRef } from 'react';
import type { User } from '../types';
import { UNIVERSITY_LOGOS, COURSE_SUBJECTS } from '../constants';
import { UserCircleIcon, ShieldCheckIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

interface StudentIdCardProps {
  user: Partial<User>;
  side?: 'front' | 'back' | 'both';
}

// Crisp, realistic SVG Barcode component
const Barcode: React.FC<{ value: string }> = ({ value }) => {
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bars: { isBar: boolean; width: number }[] = [];
  
  // Quiet zone
  bars.push({ isBar: false, width: 4 });
  // Start guard pattern
  bars.push({ isBar: true, width: 1.5 }, { isBar: false, width: 1 }, { isBar: true, width: 1 });
  
  for (let i = 0; i < 20; i++) {
    const seed = Math.sin(hash + i) * 10000;
    const isBar = i % 2 === 0;
    const width = Math.floor((seed - Math.floor(seed)) * 3) + 1; // 1, 2, or 3px
    bars.push({ isBar, width });
  }
  
  // Stop guard pattern
  bars.push({ isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1.5 });
  // Quiet zone
  bars.push({ isBar: false, width: 4 });

  let totalWidth = 0;
  bars.forEach(b => { totalWidth += b.width; });

  let currentX = 0;
  return (
    <svg viewBox={`0 0 ${totalWidth} 40`} className="w-full h-10 bg-white p-1 rounded" preserveAspectRatio="none">
      {bars.map((bar, idx) => {
        const x = currentX;
        currentX += bar.width;
        if (bar.isBar) {
          return <rect key={idx} x={x} y="0" width={bar.width} height="40" fill="#1e293b" />;
        }
        return null;
      })}
    </svg>
  );
};

const StudentIdCard = forwardRef<HTMLDivElement, StudentIdCardProps>(({ user, side = 'both' }, ref) => {
  const logo = user.university ? UNIVERSITY_LOGOS[user.university] : "";
  
  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return 'DD/MM/AAAA';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getSubjects = () => {
    if (!user.course) return COURSE_SUBJECTS['Default'];
    
    // Case-insensitive lookup
    const courseKey = Object.keys(COURSE_SUBJECTS).find(
      key => key.toLowerCase() === user.course?.toLowerCase()
    );
    return courseKey ? COURSE_SUBJECTS[courseKey] : COURSE_SUBJECTS['Default'];
  };

  const subjects = getSubjects();

  const renderFront = (elementRef?: React.Ref<HTMLDivElement>) => (
    <div 
      ref={elementRef}
      id="card-front" 
      className="w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-gradient-to-br from-[#0c1325] via-[#152544] to-[#0c1325] text-white relative overflow-hidden font-sans border border-slate-700/60 min-h-[380px] flex flex-col justify-between"
    >
        {/* Holographic Security Overlay Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Subtle Security Line Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(45deg,#38bdf8_25%,transparent_25%),linear-gradient(-45deg,#38bdf8_25%,transparent_25%)] bg-[size:20px_20px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between h-full flex-grow gap-4">
            {/* Header: University Logo & Digital Status */}
            <header className="flex justify-between items-start h-12">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-teal-400 font-bold">Documento Digital</span>
                  <span className="text-[11px] font-semibold text-slate-300 tracking-wider">PORTAL DO ESTUDANTE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Ativo</span>
                  </div>
                </div>
            </header>

            {/* Smartcard Chip & Institution Logo */}
            <div className="flex justify-between items-center -mt-2">
                {/* Simulated EMV Smart Chip */}
                <div className="w-10 h-8 rounded-lg bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 border border-amber-600 relative overflow-hidden flex flex-col justify-between p-1 shadow-inner opacity-90">
                  <div className="absolute inset-0 grid grid-cols-3 gap-[1px] opacity-35">
                    <div className="border-r border-b border-amber-950"></div>
                    <div className="border-r border-b border-amber-950"></div>
                    <div className="border-b border-amber-950"></div>
                    <div className="border-r border-amber-950"></div>
                    <div className="border-r border-amber-950"></div>
                    <div className="border-amber-950"></div>
                  </div>
                  <div className="absolute top-[28%] left-[28%] w-[44%] h-[44%] bg-amber-400/80 rounded-sm border border-amber-600/30"></div>
                </div>
                
                {logo ? (
                    <img src={logo} alt={`${user.university} Logo`} className="max-h-10 object-contain brightness-0 invert opacity-90 max-w-[120px]" />
                ) : (
                    user.university && <p className="font-bold text-sm text-slate-200 tracking-wide">{user.university}</p>
                )}
            </div>
 
            {/* Student Info Section */}
            <main className="flex gap-4 items-center my-1">
                {/* Glow Photo Container */}
                <div className="w-20 h-26 rounded-2xl ring-2 ring-white/10 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center p-0.5 flex-shrink-0 relative">
                    {user.photo ? (
                        <img src={user.photo} alt="Estudante" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <UserCircleIcon className="w-14 h-14 text-slate-500" />
                    )}
                </div>
                <div className="flex flex-col justify-center min-w-0">
                    <h1 className="text-base font-extrabold text-white tracking-wide truncate w-[220px] uppercase">
                      {user.fullName || 'NOME COMPLETO'}
                    </h1>
                    <p className="text-xs font-semibold text-teal-400 tracking-wide truncate w-[220px] mt-0.5 flex items-center gap-1">
                      <AcademicCapIcon className="w-3.5 h-3.5" />
                      {user.course || 'Curso'}
                    </p>
                </div>
            </main>
 
            {/* Footer with Grid Credentials */}
            <footer className="space-y-4">
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-700/60 text-left">
                    <div>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">RGM</p>
                        <p className="text-[10px] font-bold text-slate-100 mt-0.5 truncate">{user.rgm || '########-#'}</p>
                    </div>
                    <div>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Nascimento</p>
                        <p className="text-[10px] font-bold text-slate-100 mt-0.5 truncate">{formatBirthDate(user.birthDate)}</p>
                    </div>
                    <div>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Campus</p>
                        <p className="text-[10px] font-bold text-slate-100 mt-0.5 truncate">{user.campus?.toUpperCase() || 'CAMPUS'}</p>
                    </div>
                    <div>
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Validade</p>
                        <p className="text-[10px] font-bold text-slate-100 mt-0.5 truncate">{user.validity || 'MM/YYYY'}</p>
                    </div>
                </div>
                
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-semibold tracking-wider bg-slate-950/20 border border-slate-800/40 py-1.5 rounded-xl">
                    <ShieldCheckIcon className="w-4 h-4 text-teal-400" />
                    <span>CARTEIRA NACIONAL COMPATÍVEL</span>
                </div>
            </footer>
        </div>
    </div>
  );

  const renderBack = (elementRef?: React.Ref<HTMLDivElement>) => (
    <div 
      ref={elementRef}
      id="card-back" 
      className="w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-gradient-to-br from-[#0c1325] via-[#152544] to-[#0c1325] text-white relative overflow-hidden font-sans border border-slate-700/60 min-h-[380px] flex flex-col justify-between"
    >
        {/* Holographic Security Overlay Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Magnetic Stripe Mockup */}
        <div className="absolute top-4 left-0 w-full h-8 bg-slate-950 pointer-events-none opacity-90 border-y border-slate-850"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full flex-grow mt-8">
            {/* Disciplinas Recomendadas List */}
            <div className="mt-2">
                <header className="border-b border-slate-700 pb-1.5 mb-2.5 flex justify-between items-center">
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Disciplinas Recomendadas</h2>
                    <span className="text-[8px] text-slate-400 font-medium">Histórico Recomendado</span>
                </header>
                <div className="bg-slate-950/25 border border-slate-800/60 rounded-2xl p-3">
                  <ul className="grid grid-cols-1 gap-1.5 text-[10px] text-slate-300">
                      {subjects.slice(0, 6).map((sub, i) => (
                          <li key={i} className="truncate flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500/80 shadow-sm flex-shrink-0"></span>
                              <span className="font-medium">{sub}</span>
                          </li>
                      ))}
                  </ul>
                </div>
            </div>

            {/* Terms and Credentials */}
            <div className="mt-3">
                <p className="text-[8px] text-slate-400 leading-relaxed text-center font-medium">
                    Uso pessoal e intransferível. Esta carteirinha digital é válida em todo território nacional como identificação estudantil nos termos da lei.
                </p>
                <div className="mt-3.5 flex flex-col items-center">
                    {/* Realistic Barcode */}
                    <div className="w-full max-w-[280px]">
                      <Barcode value={user.uid || 'ALUNOCONECTA'} />
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono tracking-widest mt-1.5 bg-slate-950/30 px-2 py-0.5 rounded border border-slate-800/50">
                      CÓDIGO: {user.uid?.substring(0, 10).toUpperCase() || 'XXXXXXXXXX'}
                    </span>
                </div>
            </div>
        </div>
    </div>
  );

  if (side === 'front') {
    return renderFront(ref);
  }
  
  if (side === 'back') {
    return renderBack(ref);
  }

  return (
    <div ref={ref} className="flex flex-col md:flex-row gap-6 w-full items-center justify-center">
      {renderFront()}
      {renderBack()}
    </div>
  );
});

export default StudentIdCard;