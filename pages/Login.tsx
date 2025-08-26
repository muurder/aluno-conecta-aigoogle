



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, profileError } = useAuth();

  useEffect(() => {
    if (profileError === 'cors') {
        const origin = window.location.origin;
        setError(
             <div className="text-left text-sm">
                <p className="font-bold text-base mb-2">Falha de Conexão (Erro de CORS)</p>
                <p className="mb-3">O aplicativo não conseguiu buscar seus dados. Isso geralmente ocorre porque o domínio do aplicativo (<code className="bg-red-200 text-red-900 rounded p-1 font-mono text-xs">{origin}</code>) não está autorizado no seu projeto Supabase.</p>
                <p className="font-semibold">Para corrigir:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1.5 text-gray-700">
                    <li>Acesse seu painel do Supabase e clique no ícone de engrenagem (<strong className="font-semibold text-gray-800">Settings</strong>) no menu.</li>
                    <li>Na nova tela, no menu lateral, encontre e clique em <strong className="font-semibold text-gray-800">API</strong>.</li>
                    <li>Role a página para baixo até a seção <strong className="font-semibold text-gray-800">URL Configuration</strong>.</li>
                    <li>Em <strong className="font-semibold text-gray-800">CORS settings</strong>, adicione a URL exata <code className="bg-gray-200 text-gray-900 rounded p-1 font-mono text-xs">{origin}</code> e salve.</li>
                </ol>
             </div>
        );
    } else if (profileError === 'no_profile') {
        setError('Login autorizado, mas não encontramos seu perfil de usuário. O gatilho do banco de dados pode não ter sido executado corretamente. Verifique o guia de configuração.');
    } else if (profileError === 'generic') {
        setError('Ocorreu um erro inesperado ao carregar seu perfil. Tente novamente.');
    }
  }, [profileError]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // A navegação agora é controlada pelo componente AppRoutes com base
      // no estado de autenticação, tornando o fluxo mais robusto.
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha inválidos. Por favor, verifique seus dados.');
      } else {
        setError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = (hasError: boolean) => 
    `mt-1 w-full p-3 border rounded-lg transition focus:ring-2 ${
      hasError 
        ? 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Entrar</h1>
          <p className="text-gray-500 mt-2">Acesse seu Portal do Aluno</p>
        </div>
        
        {error && <div className="text-red-700 bg-red-100 p-4 rounded-lg border border-red-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Seu E-mail Pessoal</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@provedor.com"
              className={inputClasses(!!error)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={inputClasses(!!error)}
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-transform transform hover:scale-105 disabled:bg-blue-400 disabled:scale-100"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <ArrowRightOnRectangleIcon className="h-5 w-5"/>}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não tem conta?{' '}
            <button onClick={() => navigate('/register')} className="font-medium text-blue-600 hover:underline">
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;