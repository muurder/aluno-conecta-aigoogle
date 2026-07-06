import React, { forwardRef } from 'react';
import type { User } from '../types';
import { UNIVERSITY_LOGOS, COURSE_SUBJECTS } from '../constants';
import { UserCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface StudentIdCardProps {
  user: Partial<User>;
  side?: 'front' | 'back' | 'both';
}

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
      className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-100 text-gray-800 relative overflow-hidden font-sans border border-teal-100 min-h-[380px] flex flex-col justify-between"
    >
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/50 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute -bottom-20 -right-16 w-48 h-48 bg-white/40 rounded-full opacity-50 blur-xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full flex-grow">
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

  const renderBack = (elementRef?: React.Ref<HTMLDivElement>) => (
    <div 
      ref={elementRef}
      id="card-back" 
      className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden font-sans border border-slate-700 min-h-[380px] flex flex-col justify-between"
    >
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full flex-grow">
            <header className="border-b border-white/20 pb-2 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">Disciplinas Recomendadas</h2>
            </header>
            <ul className="space-y-1.5 text-xs text-slate-300">
                {subjects.map((sub, i) => (
                    <li key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"></span>
                        <span className="truncate">{sub}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] text-slate-300 leading-relaxed text-center">
                    Uso pessoal e intransferível. Esta carteirinha digital é válida em todo território nacional como identificação estudantil.
                </p>
                <div className="mt-3 flex flex-col items-center">
                    <div className="w-full h-10 bg-white rounded-md flex items-center justify-center overflow-hidden">
                        <div className="flex items-center gap-[2px]">
                            {Array.from({ length: 64 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-[3px] bg-slate-900"
                                    style={{ height: `${Math.random() > 0.5 ? '32px' : '16px'}` }}
                                />
                            ))}
                        </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-1.5 tracking-widest">
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
