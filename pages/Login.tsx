
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.login(login, password)) {
      navigate('/');
    } else {
      setError('Login ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-cyan-50 to-blue-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Entrar</h1>
          <p className="text-gray-500 mt-2">Acesse seu Portal do Aluno</p>
        </div>
        
        {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="ex.: indexjg"
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
            className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-transform transform hover:scale-105"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5"/>
            Entrar
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
