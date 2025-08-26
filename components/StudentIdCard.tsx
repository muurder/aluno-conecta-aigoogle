import React from 'react';
import type { User } from '../types';
import { UNIVERSITY_LOGOS } from '../constants';
import { UserCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface StudentIdCardProps {
  user: Partial<User>;
}

const StudentIdCard: React.FC<StudentIdCardProps> = ({ user }) => {
  const logo = user.university ? UNIVERSITY_LOGOS[user.university] : "";
  
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl p-6 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-100 text-gray-800 relative overflow-hidden font-sans">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-white/50 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute -bottom-20 -right-16 w-48 h-48 bg-white/40 rounded-full opacity-50 blur-xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
            <header className="flex justify-start items-center mb-6 h-10">
                {logo ? (
                    <img src={logo} alt={`${user.university} Logo`} className="max-h-full object-contain opacity-70" />
                ) : (
                    user.university && <p className="font-semibold text-gray-700">{user.university}</p>
                )}
            </header>

            <main className="flex-grow flex flex-col items-center justify-center text-center mb-6">
                <div className="w-20 h-20 rounded-full shadow-md overflow-hidden bg-gray-300 flex items-center justify-center mb-3">
                    {user.photo ? (
                        <img src={user.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                       <UserCircleIcon className="w-16 h-16 text-gray-500" />
                    )}
                </div>
                <h1 className="text-xl font-bold text-slate-800 truncate">{user.fullName || 'Nome Completo'}</h1>
                <p className="text-md text-slate-600">{user.course || 'Curso'}</p>
            </main>

            <footer className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <p className="font-light text-gray-600">RGM</p>
                        <p className="font-semibold text-slate-700">{user.rgm || '########-#'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-light text-gray-600">VAL:</p>
                        <p className="font-semibold text-slate-700">{user.validity || 'MM/YYYY'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="font-light text-gray-600">CAMPUS</p>
                        <p className="font-semibold text-slate-700">{user.campus?.toUpperCase() || 'CAMPUS'}</p>
                    </div>
                </div>
                 <div className="border-t border-white/80 pt-3 mt-4 flex items-center justify-center text-blue-800 font-semibold">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    <span>Validar carteirinha</span>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default StudentIdCard;