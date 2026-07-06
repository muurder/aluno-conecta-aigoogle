import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StudentIdCard from '../components/StudentIdCard';
import type { User } from '../types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { db, auth } from '@/firebase';

type ToastProps = {
  message: string;
  userName: string;
  show: boolean;
  onClose: () => void;
};

const Toast: React.FC<ToastProps> = ({ message, userName, show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
      aria-labelledby="toast-title"
      role="alertdialog"
    >
      <div className="bg-white rounded-3xl p-8 text-center flex flex-col items-center shadow-2xl w-full max-w-sm animate-scale-up">
        <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
        <h2 id="toast-title" className="text-2xl font-bold text-gray-800">{message}</h2>
        <p className="mt-2 text-gray-600">
          A carteirinha de <span className="font-semibold">{userName}</span> foi validada com sucesso.
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          Fechar
        </button>
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
  const navigate = useNavigate();
  const location = useLocation();
  const [validatedUser, setValidatedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [rawUid, setRawUid] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const validationTimer = setTimeout(async () => {
      let localDecoded = '';
      let localUid = '';

      try {
        if (!data) {
          if (isMounted) {
            setError('Nenhum dado de validação fornecido.');
            setIsValidating(false);
          }
          return;
        }

        try {
          localDecoded = decodeURIComponent(escape(atob(data)));
        } catch (e) {
          localDecoded = data;
        }

        let userObject: User | null = null;
        if (localDecoded.trim().startsWith('{')) {
          try {
            userObject = JSON.parse(localDecoded) as User;
          } catch (e) {
            console.error("[ValidateIdCard] JSON parse failed", e);
          }
        } else {
          localUid = localDecoded;
        }

        if (isMounted) {
          setRawUid(localUid || userObject?.uid || null);
        }

        if (userObject) {
          if (isMounted) {
            setValidatedUser(userObject);
            setShowToast(true);
            setIsValidating(false);
          }
          return;
        }

        if (!localUid) {
          if (isMounted) {
            setError('O código QR é inválido ou os dados estão corrompidos.');
            setRawError('UID vazio após decode');
            setIsValidating(false);
          }
          return;
        }

        if (!db) {
          if (isMounted) {
            setError('Configuração do Firebase indisponível para validação.');
            setRawError('db is null');
            setIsValidating(false);
          }
          return;
        }

        let doc = null;
        try {
          doc = await db.collection('profiles').doc(localUid).get();
        } catch (firestoreError) {
          console.error("[ValidateIdCard] Firestore error:", firestoreError);
          if (isMounted) {
            setError('Falha ao consultar o banco na validação.');
            setRawError(String(firestoreError));
            setIsValidating(false);
          }
          return;
        }

        if (doc && doc.exists) {
          if (isMounted) {
            setValidatedUser({ uid: doc.id, ...doc.data() } as User);
            setShowToast(true);
            setIsValidating(false);
          }
        } else {
          if (isMounted) {
            setError("Estudante não encontrado no banco de dados.");
            setRawError(`doc.exists=false for uid=${localUid}`);
            setIsValidating(false);
          }
        }
      } catch (e) {
        console.error("[ValidateIdCard] Validation failed:", e);
        if (isMounted) {
          setError("O código QR é inválido ou os dados estão corrompidos.");
          setRawError(String(e));
          setIsValidating(false);
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(validationTimer);
    };
  }, [data]);

  useEffect(() => {
    if (!isValidating) return;
    const timer = setTimeout(() => {
      if (!validatedUser && !error) {
        setError('A validação demorou mais do que o esperado.');
        setRawError('timeout');
        setIsValidating(false);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isValidating, validatedUser, error]);

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Validando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-red-50 p-4">
        <XCircleIcon className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-red-800">Erro de Validação</h1>
        <p className="text-red-600 mt-2 text-center">{error}</p>
        <p className="text-xs text-gray-500 mt-2 break-all">UID buscado: {rawUid || '-'}</p>
        <p className="text-[10px] text-gray-400 mt-1 break-all">Detalhe: {rawError || '-'}</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
             Voltar
        </button>
      </div>
    );
  }

  if (!validatedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 mt-4">Carregando carteirinha...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-gray-100 p-4">
      <Toast
        show={showToast}
        message="Validado"
        userName={validatedUser.fullName}
        onClose={() => setShowToast(false)}
      />
      <StudentIdCard user={validatedUser} />
      <p className="mt-6 text-sm text-gray-500">Carteirinha validada com sucesso.</p>
    </div>
  );
};

export default ValidateIdCard;
