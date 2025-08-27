import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentIdCard from '../components/StudentIdCard';
import type { User } from '../types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const ValidationToast: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-scale-in">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mb-5" />
                <h2 className="text-2xl font-semibold text-text-dark">Validado</h2>
                <p className="text-base text-text-light mt-2">A carteirinha do estudante foi validada com sucesso.</p>
            </div>
            <style>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
              @keyframes scale-in { 
                0% { opacity: 0; transform: scale(0.9); } 
                100% { opacity: 1; transform: scale(1); } 
              }
              .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
            `}</style>
        </div>
    );
};


const ValidateIdCard: React.FC = () => {
    const { data } = useParams<{ data: string }>();
    const navigate = useNavigate();
    const [validatedUser, setValidatedUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (data) {
            try {
                const decodedData = decodeURIComponent(escape(atob(data)));
                const userObject = JSON.parse(decodedData);
                setValidatedUser(userObject);
                setShowToast(true);
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
                 <button onClick={() => navigate('/')} className="mt-8 px-6 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700">
                    Voltar
                </button>
            </div>
        );
    }

    if (!validatedUser) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col items-center justify-center bg-background p-4 min-h-screen">
            {showToast && <ValidationToast onClose={() => setShowToast(false)} />}
            <StudentIdCard user={validatedUser} />
        </div>
    );
};

export default ValidateIdCard;