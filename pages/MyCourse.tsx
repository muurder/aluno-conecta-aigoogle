

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { COURSE_LIST, COURSE_ICONS } from '../constants';

const MyCourse: React.FC = () => {
    const navigate = useNavigate();

    const handleCourseClick = (courseName: string) => {
        navigate(`/course/${encodeURIComponent(courseName)}`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Cursos Disponíveis</h1>
            </header>
            
            <main className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-3">
                    {COURSE_LIST.map((course) => {
                        const icon = COURSE_ICONS[course] || COURSE_ICONS["Default"];
                        return (
                            <button
                                key={course}
                                onClick={() => handleCourseClick(course)}
                                className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-blue-500 bg-blue-100 p-3 rounded-full">
                                        {/* FIX: Cast icon to a ReactElement that accepts a className prop to resolve TypeScript error. */}
                                        {React.cloneElement(icon as React.ReactElement<{ className: string }>, { className: "w-6 h-6" })}
                                    </div>
                                    <span className="font-semibold text-gray-800 text-left">{course}</span>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default MyCourse;
