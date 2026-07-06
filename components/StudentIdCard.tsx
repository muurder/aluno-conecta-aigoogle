import React, { forwardRef } from 'react';
import type { User } from '../types';
import { UNIVERSITY_LOGOS, COURSE_SUBJECTS } from '../constants';
import {
  UserCircleIcon,
  QrCodeIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  CheckBadgeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

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

  const CardBase: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`w-[358px] rounded-[16px] border border-slate-700/80 bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-2xl overflow-hidden relative ${className || ''}`}>
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );

  const renderFront = (elementRef?: React.Ref<HTMLDivElement>) => (
    <CardBase ref={elementRef} id="card-front" className="text-white">
      <div className="p-5 pb-3">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <CheckBadgeIcon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-none mb-1">Identidade Estudantil</p>
              <h1 className="text-sm font-bold text-white leading-tight">{user.university || 'Universidade'}</h1>
            </div>
          </div>
          {logo ? (
            <img src={logo} alt={`${user.university} Logo`} className="h-8 object-contain opacity-90" />
          ) : null}
        </header>

        <main className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-br from-amber-400 to-amber-600">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-700 border-2 border-slate-800">
                {user.photo ? (
                  <img src={user.photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircleIcon className="w-10 h-10 text-slate-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-800 flex items-center justify-center">
              <CheckCircleIcon className="w-3 h-3 text-white" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide truncate w-full mb-1">{user.fullName || 'NOME COMPLETO'}</h2>
          <p className="text-xs text-slate-300 font-medium truncate w-full">{user.course || 'Curso'}</p>
        </main>

        <footer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">RGM</p>
              <p className="text-xs font-bold text-white font-mono tracking-wider">{user.rgm || '########-#'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Nascimento</p>
              <p className="text-xs font-bold text-white font-mono tracking-wider">{formatBirthDate(user.birthDate)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Campus</p>
              <p className="text-xs font-bold text-white truncate">{user.campus?.toUpperCase() || 'CAMPUS'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Validade</p>
              <p className="text-xs font-bold text-white font-mono tracking-wider">{user.validity || 'MM/YYYY'}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg py-2">
            <QrCodeIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-200 uppercase tracking-wide">Validar carteirinha</span>
          </div>
        </footer>
      </div>
    </CardBase>
  );

  const renderBack = (elementRef?: React.Ref<HTMLDivElement>) => (
    <CardBase ref={elementRef} id="card-back" className="text-white">
      <div className="p-5 pb-3">
        <header className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <CheckCircleIcon className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">Conteúdo Acadêmico</p>
            <h2 className="text-sm font-bold text-white">Disciplinas Recomendadas</h2>
          </div>
        </header>

        <ul className="space-y-1.5 mb-4">
          {subjects.map((sub, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 rounded-md px-2.5 py-1.5 border border-white/5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">{sub}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-white/10">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
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
    </CardBase>
  );

  if (side === 'front') {
    return renderFront(ref);
  }

  if (side === 'back') {
    return renderBack(ref);
  }

  return (
    <div ref={ref} className="flex flex-col md:flex-row gap-5 w-full items-center justify-center">
      {renderFront()}
      {renderBack()}
    </div>
  );
});

export default StudentIdCard;
