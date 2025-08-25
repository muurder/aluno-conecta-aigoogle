
import React from 'react';
import { QuestionMarkCircleIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

const Help: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-full flex flex-col bg-gray-50">
            <header className="p-4 flex items-center text-gray-700 bg-white shadow-sm">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Ajuda</h1>
            </header>
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <QuestionMarkCircleIcon className="w-24 h-24 text-blue-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-700">Precisa de Ajuda?</h1>
                <p className="text-gray-500 mt-2 mb-6">Entre em contato conosco através dos canais abaixo.</p>
                
                <div className="space-y-4 w-full max-w-xs">
                    <a href="mailto:juannicolas1@gmail.com" className="flex items-center p-4 bg-white rounded-lg shadow-sm border hover:bg-gray-100">
                        <EnvelopeIcon className="w-6 h-6 text-blue-500 mr-3"/>
                        <span className="text-gray-700">juannicolas1@gmail.com</span>
                    </a>
                     <a href="https://wa.me/5511987697684" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-white rounded-lg shadow-sm border hover:bg-gray-100">
                        <PhoneIcon className="w-6 h-6 text-green-500 mr-3"/>
                        <span className="text-gray-700">(11) 98769-7684</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Help;
