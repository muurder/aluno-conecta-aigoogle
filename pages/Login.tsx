
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as 'error' });
  
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      let errorMessage = 'Ocorreu um erro ao fazer login com o Google. Tente novamente.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'A janela de login com o Google foi fechada antes de completar a autenticação.';
      }
      setToast({ show: true, message: errorMessage, type: 'error' });
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const inputClasses = `mt-1 w-full p-3 border rounded-lg transition focus:ring-2 border-gray-300 focus:ring-[var(--accent)] focus:border-[var(--accent)]`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      <div className="w-full max-w-md bg-[var(--surface)] p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--text)]">Entrar</h1>
          <p className="text-[var(--muted)] mt-2">Acesse seu Portal do Aluno</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--muted)]">Seu E-mail Pessoal</label>
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
              <label className="text-sm font-medium text-[var(--muted)]">Senha</label>
              <a href="#" className="text-sm font-medium text-[var(--accent)] hover:underline">
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
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--muted)]"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="remember-me-switch" className="text-sm text-[var(--muted)] select-none">
                Salvar o login
            </label>
            <button
                type="button"
                id="remember-me-switch"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] ${rememberMe ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${rememberMe ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-[var(--primary)] text-[var(--on-primary)] font-bold p-3 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] flex items-center justify-center gap-2 transition-transform transform hover:scale-105 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
                <ArrowRightOnRectangleIcon className="h-5 w-5"/>
            )}
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative px-3 bg-[var(--surface)] text-sm text-[var(--muted)]">
            ou
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full bg-white text-gray-700 border border-gray-300 font-semibold p-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center gap-3 transition-transform transform hover:scale-105 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>{googleLoading ? 'Conectando...' : 'Entrar com o Google'}</span>
        </button>

        <div className="text-center">
          <p className="text-sm text-[var(--muted)]">
            Não tem conta?{' '}
            <Link to="/register" className="font-medium text-[var(--accent)] hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;