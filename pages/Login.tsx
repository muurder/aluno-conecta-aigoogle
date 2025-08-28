
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon, CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; show: boolean; onClose: () => void }> = ({ message, type, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => onClose(), 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
    const Icon = isSuccess ? CheckCircleIcon : ExclamationCircleIcon;

    // Responsive classes for positioning
    const positionClasses = `
        fixed z-[100] w-11/12 max-w-sm top-4 left-1/2 -translate-x-1/2
        md:w-auto md:max-w-none md:top-auto md:left-auto md:bottom-5 md:right-5 md:translate-x-0
    `;

    return (
        <div 
            className={`${positionClasses} flex items-center gap-4 p-4 rounded-lg shadow-2xl text-white ${bgColor} animate-toast`}
            role="alert"
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
            </button>
            <style>{`
                @keyframes slide-in-top {
                    from { opacity: 0; transform: translate(-50%, -100%); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-toast {
                    animation: slide-in-top 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
                @media (min-width: 768px) {
                    .animate-toast {
                        animation-name: slide-in-right;
                    }
                }
            `}</style>
        </div>
    );
};


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as 'error' });
  
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (err: any) {
      console.error("Login Error:", err.code);
      let errorMessage = 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'E-mail ou senha inválidos. Por favor, verifique seus dados.';
      }
      setToast({ show: true, message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const inputClasses = `mt-1 w-full p-3 border rounded-lg transition focus:ring-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Entrar</h1>
          <p className="text-gray-500 mt-2">Acesse seu Portal do Aluno</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Seu E-mail Pessoal</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@provedor.com"
              className={inputClasses}
              required
              autoFocus
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:underline">
                Esqueci minha senha
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={inputClasses}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="remember-me-switch" className="text-sm text-gray-700 select-none">
                Salvar o login
            </label>
            <button
                type="button"
                id="remember-me-switch"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${rememberMe ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${rememberMe ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-transform transform hover:scale-105 disabled:bg-blue-400 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
                <ArrowRightOnRectangleIcon className="h-5 w-5"/>
            )}
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não tem conta?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
