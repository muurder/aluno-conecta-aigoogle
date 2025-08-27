import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentIdCard from '../components/StudentIdCard';
import type { User } from '../types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div className="p-4 bg-green-500 text-white rounded-lg shadow-2xl flex items-center justify-between animate-fade-in-down">
            <div className="flex items-center">
                <CheckCircleIcon className="w-6 h-6 mr-3" />
                <span className="font-semibold">{message}</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
                <XCircleIcon className="w-5 h-5" />
            </button>
        </div>
        <style>{`
          @keyframes fade-in-down {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
          }
          .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
        `}</style>
    </div>
);

const ValidateIdCard: React.FC = () => {
    const { data } = useParams<{ data: string }>();
    const navigate = useNavigate();
    const [validatedUser, setValidatedUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (data) {
            try {
                // Decodifica a string Base64 e converte de volta para um objeto JSON
                const decodedData = decodeURIComponent(escape(atob(data)));
                const userObject = JSON.parse(decodedData);
                setValidatedUser(userObject);
                setShowToast(true);

                const timer = setTimeout(() => setShowToast(false), 4000);
                return () => clearTimeout(timer);

            } catch (e) {
                console.error("Failed to decode user data:", e);
                setError("O código QR é inválido ou os dados estão corrompidos.");
            }
        } else {
            setError("Nenhum dado de validação fornecido.");
        }
    }, [data]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-4">
                <XCircleIcon className="w-16 h-16 text-red-400 mb-4" />
                <h1 className="text-xl font-bold text-red-800">Erro de Validação</h1>
                <p className="text-red-600 mt-2 text-center">{error}</p>
                 <button onClick={() => navigate('/')} className="mt-8 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                    Voltar
                </button>
            </div>
        );
    }

    if (!validatedUser) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col items-center justify-center bg-gray-100 p-4 min-h-screen">
            {showToast && <Toast message="Validado" onClose={() => setShowToast(false)} />}
            <StudentIdCard user={validatedUser} />
            <p className="mt-6 text-sm text-gray-500">Carteirinha validada com sucesso.</p>
        </div>
    );
};

export default ValidateIdCard;
