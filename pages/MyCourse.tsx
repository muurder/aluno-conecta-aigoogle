
import React from 'react';
import { AcademicCapIcon } from 'https://esm.sh/@heroicons/react@2.1.3/24/outline?deps=react';

const MyCourse: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
            <AcademicCapIcon className="w-24 h-24 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-700">Meu Curso</h1>
            <p className="text-gray-500 mt-2">Esta seção está em desenvolvimento. Volte em breve para ver suas disciplinas, notas e mais!</p>
        </div>
    );
};

export default MyCourse;