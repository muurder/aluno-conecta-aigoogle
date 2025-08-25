
import React from 'react';
import type { User } from '../types';
import { UNIVERSITY_LOGOS } from '../constants';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface StudentIdCardProps {
  user: Partial<User>;
}

const StudentIdCard: React.FC<StudentIdCardProps> = ({ user }) => {
  const logo = user.university ? UNIVERSITY_LOGOS[user.university] : "https://picsum.photos/150/50";
  
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl p-6 shadow-lg bg-gradient-to-br from-teal-100 to-cyan-200 text-gray-800 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full"></div>
        <div className="absolute top-20 -left-16 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
            <header className="flex justify-between items-start mb-6">
                <img src={logo} alt={`${user.university} Logo`} className="h-10 object-contain" />
                <div className="w-24 h-24 rounded-full border-4 border-white/80 shadow-md overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user.photo ? (
                        <img src={user.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-20 h-20 text-gray-400" />
                    )}
                </div>
            </header>

            <main className="text-center">
                <h1 className="text-xl font-bold truncate">{user.fullName || 'Nome Completo'}</h1>
                <p className="text-md text-gray-700">{user.course || 'Curso'}</p>
            </main>

            <footer className="mt-6 border-t-2 border-white/50 pt-4">
                <div className="flex justify-between text-sm mb-2">
                    <div className="text-left">
                        <p className="font-light text-gray-600">RGM</p>
                        <p className="font-semibold">{user.rgm || '########-#'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-light text-gray-600">VAL:</p>
                        <p className="font-semibold">{user.validity || 'MM/YYYY'}</p>
                    </div>
                </div>
                <div>
                    <p className="font-light text-gray-600 text-sm">CAMPUS</p>
                    <p className="font-semibold text-sm">{user.campus || 'Campus'}</p>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default StudentIdCard;
