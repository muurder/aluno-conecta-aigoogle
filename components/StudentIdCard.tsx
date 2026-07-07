import React, { forwardRef } from 'react';
import type { User } from '../types';
import { UNIVERSITY_LOGOS, COURSE_SUBJECTS } from '../constants';
import { UserCircleIcon, ShieldCheckIcon, AcademicCapIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface StudentIdCardProps {
  user: Partial<User>;
  side?: 'front' | 'back' | 'both';
}

// Crisp, realistic SVG Barcode component
const Barcode: React.FC<{ value: string; color?: string }> = ({ value, color = '#1e293b' }) => {
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
          return <rect key={idx} x={x} y="0" width={bar.width} height="40" fill={color} />;
        }
        return null;
      })}
    </svg>
  );
};

const StudentIdCard = forwardRef<HTMLDivElement, StudentIdCardProps>(({ user, side = 'both' }, ref) => {
  const logo = user.university ? UNIVERSITY_LOGOS[user.university] : "";
  const isNewStyle = user.cardStyle === 'new';

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

  // --- RENDER FRONT SIDE ---
  const renderFront = (elementRef?: React.Ref<HTMLDivElement>) => {
    if (isNewStyle) {
      // NEW STYLE: Premium Light/Silver Layout
      return (
        <div 
          ref={elementRef}
          id="card-front" 
          className="w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-gradient-to-br from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0] text-slate-800 relative overflow-hidden font-sans border border-slate-200/80 min-h-[380px] flex flex-col justify-between"
        >
            {/* Glossy/Holographic Light Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-400/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Security Guilloche Pattern */}
            <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(45deg,#0284c7_25%,transparent_25%),linear-gradient(-45deg,#0284c7_25%,transparent_25%)] bg-[size:20px_20px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col justify-between h-full flex-grow gap-4">
                {/* Header */}
                <header className="flex justify-between items-start h-12">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-teal-600 font-bold">Documento Digital</span>
                      <span className="text-[11px] font-bold text-slate-500 tracking-wider">PORTAL DO ESTUDANTE</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Ativo</span>
                    </div>
                </header>

                {/* EMV Chip & University Logo */}
                <div className="flex justify-between items-center -mt-2">
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
                        <img src={logo} alt={`${user.university} Logo`} className="max-h-10 object-contain opacity-80 max-w-[120px]" />
                    ) : (
                        user.university && <p className="font-extrabold text-sm text-slate-700 tracking-wide">{user.university}</p>
                    )}
                </div>
     
                {/* Profile Photo & Name */}
                <main className="flex gap-4 items-center my-1">
                    <div className="w-20 h-26 rounded-2xl ring-2 ring-slate-200 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center p-0.5 flex-shrink-0 relative">
                        {user.photo ? (
                            <img src={user.photo} alt="Estudante" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <UserCircleIcon className="w-14 h-14 text-slate-400" />
                        )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 text-left">
                        <h1 className="text-base font-extrabold text-slate-800 tracking-wide truncate w-[220px] uppercase">
                          {user.fullName || 'NOME COMPLETO'}
                        </h1>
                        <p className="text-xs font-bold text-teal-650 tracking-wide truncate w-[220px] mt-0.5 flex items-center gap-1">
                          <AcademicCapIcon className="w-3.5 h-3.5 text-teal-600" />
                          {user.course || 'Curso'}
                        </p>
                    </div>
                </main>
     
                {/* Footer credentials */}
                <footer className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200/80 text-left">
                        <div>
                            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">RGM</p>
                            <p className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{user.rgm || '########-#'}</p>
                        </div>
                        <div>
                            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Nascimento</p>
                            <p className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{formatBirthDate(user.birthDate)}</p>
                        </div>
                        <div>
                            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Campus</p>
                            <p className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{user.campus?.toUpperCase() || 'CAMPUS'}</p>
                        </div>
                        <div>
                            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Validade</p>
                            <p className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{user.validity || 'MM/YYYY'}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-bold tracking-wider bg-slate-200/40 border border-slate-300/30 py-1.5 rounded-xl">
                        <ShieldCheckIcon className="w-4 h-4 text-teal-600" />
                        <span>CARTEIRA NACIONAL COMPATÍVEL</span>
                    </div>
                </footer>
            </div>
        </div>
      );
    } else {
      // CLASSIC/OLD STYLE: Light Cyan/Teal Gradient
      return (
        <div 
          ref={elementRef}
          id="card-front" 
          className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-100 text-gray-800 relative overflow-hidden font-sans border border-teal-100 min-h-[380px] flex flex-col justify-between"
        >
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/50 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute -bottom-20 -right-16 w-48 h-48 bg-white/40 rounded-full opacity-50 blur-xl"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full flex-grow text-left">
                <header className="flex justify-start items-center mb-4 h-10">
                    {logo ? (
                        <img src={logo} alt={`${user.university} Logo`} className="max-h-full object-contain opacity-70" />
                    ) : (
                        user.university && <p className="font-semibold text-gray-700">{user.university}</p>
                    )}
                </header>
     
                <main className="flex-grow flex flex-col items-center justify-center text-center mb-4">
                    <div className="w-20 h-20 rounded-full shadow-md overflow-hidden bg-gray-300 flex items-center justify-center mb-3">
                        {user.photo ? (
                            <img src={user.photo} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                           <UserCircleIcon className="w-16 h-16 text-gray-500" />
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 truncate w-full max-w-[280px]">{user.fullName || 'Nome Completo'}</h1>
                    <p className="text-sm text-slate-600 truncate w-full max-w-[280px]">{user.course || 'Curso'}</p>
                </main>
     
                <footer className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                            <p className="font-light text-gray-600 text-[10px]">RGM</p>
                            <p className="font-semibold text-slate-700">{user.rgm || '########-#'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-light text-gray-600 text-[10px]">NASCIMENTO</p>
                            <p className="font-semibold text-slate-700">{formatBirthDate(user.birthDate)}</p>
                        </div>
                        <div>
                            <p className="font-light text-gray-600 text-[10px]">CAMPUS</p>
                            <p className="font-semibold text-slate-700">{user.campus?.toUpperCase() || 'CAMPUS'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-light text-gray-600 text-[10px]">VALIDADE</p>
                            <p className="font-semibold text-slate-700">{user.validity || 'MM/YYYY'}</p>
                        </div>
                    </div>
                     <div className="border-t border-white/85 pt-2.5 mt-3 flex items-center justify-center text-blue-800 font-semibold text-xs">
                        <InformationCircleIcon className="w-4 h-4 mr-1.5" />
                        <span>Validar carteirinha</span>
                    </div>
                </footer>
            </div>
        </div>
      );
    }
  };

  // --- RENDER BACK SIDE ---
  const renderBack = (elementRef?: React.Ref<HTMLDivElement>) => {
    if (isNewStyle) {
      // NEW STYLE: Premium Light/Silver Layout Back
      return (
        <div 
          ref={elementRef}
          id="card-back" 
          className="w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-gradient-to-br from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0] text-slate-800 relative overflow-hidden font-sans border border-slate-200/80 min-h-[380px] flex flex-col justify-between"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-teal-400/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Magnetic Stripe */}
            <div className="absolute top-4 left-0 w-full h-8 bg-slate-800 pointer-events-none opacity-90 border-y border-slate-700/10"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full flex-grow mt-8">
                {/* Disciplinas Recomendadas List */}
                <div className="mt-2 text-left">
                    <header className="border-b border-slate-200 pb-1.5 mb-2.5 flex justify-between items-center">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-teal-650">Disciplinas Recomendadas</h2>
                        <span className="text-[8px] text-slate-400 font-medium">Histórico Recomendado</span>
                    </header>
                    <div className="bg-white/60 border border-slate-200/70 rounded-2xl p-3">
                      <ul className="grid grid-cols-1 gap-1.5 text-[10px] text-slate-650">
                          {subjects.slice(0, 6).map((sub, i) => (
                              <li key={i} className="truncate flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500/80 shadow-sm flex-shrink-0"></span>
                                  <span className="font-semibold">{sub}</span>
                              </li>
                          ))}
                      </ul>
                    </div>
                </div>

                {/* Terms and Credentials */}
                <div className="mt-3">
                    <p className="text-[8px] text-slate-400 leading-relaxed text-center font-bold">
                        Uso pessoal e intransferível. Esta carteirinha digital é válida em todo território nacional como identificação estudantil nos termos da lei.
                    </p>
                    <div className="mt-3.5 flex flex-col items-center">
                        <div className="w-full max-w-[280px]">
                          <Barcode value={user.uid || 'ALUNOCONECTA'} color="#1e293b" />
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono tracking-widest mt-1.5 bg-slate-200/60 px-2 py-0.5 rounded border border-slate-350">
                          CÓDIGO: {user.uid?.substring(0, 10).toUpperCase() || 'XXXXXXXXXX'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      );
    } else {
      // CLASSIC/OLD STYLE: Dark Slate Back, with custom premium disciplines container
      return (
        <div 
          ref={elementRef}
          id="card-back" 
          className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden font-sans border border-slate-700 min-h-[380px] flex flex-col justify-between"
        >
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full flex-grow text-left">
                <div>
                    <header className="border-b border-white/20 pb-2 mb-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">Disciplinas Recomendadas</h2>
                    </header>
                    {/* Updated to premium/cleaner display instead of standard bullet list */}
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

                <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-[9px] text-slate-400 leading-normal text-center">
                        Uso pessoal e intransferível. Esta carteirinha digital é válida em todo território nacional como identificação estudantil.
                    </p>
                    <div className="mt-3 flex flex-col items-center">
                        <div className="w-full h-8 bg-white/95 rounded flex items-center justify-center tracking-[4px] font-mono text-[10px] text-slate-800 py-1 select-none font-bold">
                            ||| || ||| || ||| || ||| || ||| || |||
                        </div>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">CÓDIGO: {user.uid?.substring(0, 10).toUpperCase() || 'XXXXXXXXXX'}</span>
                    </div>
                </div>
            </div>
        </div>
      );
    }
  };

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