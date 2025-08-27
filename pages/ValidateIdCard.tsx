import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import StudentIdCard from '../components/StudentIdCard';
import type { User } from '../types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const Toast: React.FC<{ message: string; userName: string; show: boolean }> = ({ message, userName, show }) => {
    if (!show) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
            aria-labelledby="toast-title"
            role="alertdialog"
        >
            <div className="bg-white rounded-2xl p-8 text-center flex flex-col items-center shadow-2xl w-full max-w-xs animate-scale-up">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
                <h2 id="toast-title" className="text-2xl font-bold text-gray-800">{message}</h2>
                <p className="mt-2 text-gray-600">
                    A carteirinha de <span className="font-semibold">{userName}</span> foi validada com sucesso.
                </p>
            </div>
             <style>{`
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
              @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              .animate-fade-out { animation: fade-out 0.5s ease-out forwards; }

              @keyframes scale-up {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </div>
    );
};


const ValidateIdCard: React.FC = () => {
    const { data } = useParams<{ data: string }>();
    const history = useHistory();
    const [validatedUser, setValidatedUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const validationTimer = setTimeout(() => {
            if (data) {
                try {
                    const decodedData = decodeURIComponent(escape(atob(data)));
                    const userObject = JSON.parse(decodedData);
                    setValidatedUser(userObject);
                    setShowToast(true);
                    setIsValidating(false);

                    const timer = setTimeout(() => {
                        const toastElement = document.querySelector('.animate-fade-in');
                        if (toastElement) {
                            toastElement.classList.add('animate-fade-out');
                        }
                        setTimeout(() => setShowToast(false), 500);
                    }, 3000);

                    return () => clearTimeout(timer);

                } catch (e) {
                    console.error("Failed to decode user data:", e);
                    setError("O código QR é inválido ou os dados estão corrompidos.");
                    setIsValidating(false);
                }
            } else {
                setError("Nenhum dado de validação fornecido.");
                setIsValidating(false);
            }
        }, 4000); // 4-second loading period

        return () => clearTimeout(validationTimer);
    }, [data]);

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Validando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-4">
                <XCircleIcon className="w-16 h-16 text-red-400 mb-4" />
                <h1 className="text-xl font-bold text-red-800">Erro de Validação</h1>
                <p className="text-red-600 mt-2 text-center">{error}</p>
                 <button onClick={() => history.push('/')} className="mt-8 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
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
            <Toast 
                show={showToast}
                message="Validado" 
                userName={validatedUser.fullName}
            />
            <StudentIdCard user={validatedUser} />
            <p className="mt-6 text-sm text-gray-500">Carteirinha validada com sucesso.</p>
        </div>
    );
};

export default ValidateIdCard;
