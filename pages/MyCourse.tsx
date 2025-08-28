

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

const MyCourse: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Cursos</h1>
            </header>
            
            <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <AcademicCapIcon className="w-20 h-20 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Página em Construção</h2>
                <p className="text-gray-500 mt-2">A funcionalidade de cursos estará disponível em breve.</p>
            </main>
        </div>
    );
};

export default MyCourse;