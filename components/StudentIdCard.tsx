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
    <div className="w-full max-w-sm mx-auto rounded-2xl p-6 shadow-lg bg-gradient-to-br from-green-200/80 to-cyan-200/80 text-gray-800 relative overflow-hidden font-sans">
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-white/20 rounded-full opacity-50"></div>
        <div className="absolute -bottom-24 -right-10 w-48 h-48 bg-white/10 rounded-full opacity-50"></div>
        
        <div className="relative z-10 flex flex-col h-full">
            <header className="mb-4">
                {logo && <img src={logo} alt={`${user.university} Logo`} className="h-8 object-contain" />}
            </header>

            <main className="flex-grow flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-white/80 shadow-md overflow-hidden bg-gray-200 flex items-center justify-center mb-4">
                    {user.photo ? (
                        <img src={user.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-20 h-20 text-gray-400" />
                    )}
                </div>
                <h1 className="text-xl font-bold truncate">{user.fullName || 'Nome Completo'}</h1>
                <p className="text-md text-gray-700">{user.course || 'Curso'}</p>
            </main>

            <footer className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                    <div>
                        <p className="font-light text-gray-600">RGM</p>
                        <p className="font-semibold">{user.rgm || '########-#'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-light text-gray-600">VAL:</p>
                        <p className="font-semibold">{user.validity || 'MM/YYYY'}</p>
                    </div>
                </div>
                <div>
                    <p className="font-light text-gray-600">CAMPUS</p>
                    <p className="font-semibold">{user.campus?.toUpperCase() || 'CAMPUS'}</p>
                </div>
                 <div className="border-t border-white/50 pt-3 mt-3 flex items-center justify-center text-blue-800 font-semibold">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    <span>Validar carteirinha</span>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default StudentIdCard;