

import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Home from './pages/Home';
import Profile from './pages/Profile';
import VirtualIdCard from './pages/VirtualIdCard';
import EditProfile from './pages/EditProfile';
import MainLayout from './layouts/MainLayout';
import MyCourse from './pages/MyCourse';
import Financial from './pages/Financial';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import AdminEditUser from './pages/AdminEditUser';

const isProduction = import.meta.env.PROD;

const sqlScript = `-- 1. Cria a tabela para guardar os perfis dos usuários
CREATE TABLE public.profiles (
  uid uuid NOT NULL PRIMARY KEY,
  institutional_login TEXT,
  rgm TEXT,
  full_name TEXT,
  email TEXT,
  university TEXT,
  course TEXT,
  campus TEXT,
  validity TEXT,
  photo TEXT,
  status TEXT DEFAULT 'pending',
  is_admin BOOLEAN DEFAULT false,
  CONSTRAINT profiles_uid_fkey FOREIGN KEY (uid) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 2. Cria uma função para inserir um perfil completo quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (uid, email, full_name, institutional_login, rgm, university, course, campus, validity, photo, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'institutional_login',
    new.raw_user_meta_data->>'rgm',
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'course',
    new.raw_user_meta_data->>'campus',
    new.raw_user_meta_data->>'validity',
    new.raw_user_meta_data->>'photo',
    'pending' -- Seta o status inicial como pendente
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Cria um gatilho (trigger) que executa a função acima após cada novo registro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ativa a segurança a nível de linha (RLS) na tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Define as políticas de acesso (Policies)
-- A política de INSERT não é mais necessária para os usuários, pois o trigger cuida disso.
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = uid);
CREATE POLICY "Users can read their own profile." ON public.profiles FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Admins can read all profiles." ON public.profiles FOR SELECT USING (exists (select 1 from profiles where profiles.uid = auth.uid() and is_admin = true));
CREATE POLICY "Admins can update any profile." ON public.profiles FOR UPDATE USING (exists (select 1 from profiles where profiles.uid = auth.uid() and is_admin = true));
CREATE POLICY "Admins can delete any profile." ON public.profiles FOR DELETE USING (exists (select 1 from profiles where profiles.uid = auth.uid() and is_admin = true));`;

const SupabaseConfigWarning: React.FC = () => {
    const [copyText, setCopyText] = useState('Copiar SQL');

    const handleCopySql = () => {
        navigator.clipboard.writeText(sqlScript);
        setCopyText('Copiado!');
        setTimeout(() => setCopyText('Copiar SQL'), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full text-left">
                {isProduction ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Erro de Configuração do Servidor</h2>
                        <p className="text-gray-700">O aplicativo não pode se conectar ao banco de dados.</p>
                        <p className="text-gray-600 mt-2">Por favor, entre em contato com o administrador do sistema.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Guia de Configuração do Supabase</h2>
                        <p className="text-gray-600 mb-8">
                            Siga estes passos para configurar o backend do "Portal do Aluno" e rodar o projeto localmente.
                        </p>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 1:</strong> Crie seu Projeto no Supabase</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Acesse <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">supabase.com</a>, crie uma conta (ou faça login) e inicie um novo projeto.
                                </p>
                            </div>

                             <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 2:</strong> Configure suas Variáveis de Ambiente</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    No seu projeto Supabase, navegue até <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">Project Settings &gt; API</code>. Você encontrará sua URL e chave <code className="text-sm font-mono">anon</code>.
                                </p>
                                <p className="text-gray-600 text-sm mb-2">
                                    Crie um arquivo <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">.env.local</code> na raiz do projeto e cole o conteúdo abaixo, substituindo pelos seus dados.
                                </p>
                                <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                                    <pre className="text-sm text-gray-700">
                                        <code>
{`# .env.local
# Cole suas chaves do Supabase aqui
VITE_SUPABASE_URL="SUA_URL_DO_PROJETO_SUPABASE"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE"

# Cole sua chave do Gemini aqui (para o assistente virtual)
VITE_GEMINI_API_KEY="SUA_CHAVE_DE_API_DO_GEMINI"`}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 3:</strong> Configure o Acesso (CORS)</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Para que o app se comunique com o Supabase localmente, você precisa autorizar a URL de desenvolvimento.
                                </p>
                                 <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                                    <li>No painel do Supabase, vá para <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">Project Settings &gt; API</code>.</li>
                                    <li>Na seção <code className="text-sm font-mono">Configuration</code>, encontre <code className="text-sm font-mono">CORS settings</code>.</li>
                                    <li>Adicione a URL <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">http://localhost:5173</code> (ou a porta que você estiver usando) como uma nova origem.</li>
                                    <li>Clique em "Save".</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 4:</strong> Crie a Tabela e as Funções no Banco de Dados</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    No painel do seu projeto Supabase, vá para o <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">SQL Editor</code>, clique em "New query" e cole o script abaixo. Ele irá criar a tabela <code className="text-sm font-mono">profiles</code>, configurar um gatilho para criar perfis automaticamente e definir as permissões de acesso (RLS).
                                </p>
                                <div className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto max-h-60 relative">
                                    <button
                                        onClick={handleCopySql}
                                        className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
                                    >
                                        {copyText}
                                    </button>
                                    <pre className="text-xs">
                                        <code>{sqlScript}</code>
                                    </pre>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 5:</strong> Defina o Primeiro Administrador</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Para acessar o painel de administração, você precisa definir um usuário como administrador manualmente.
                                </p>
                                <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                                    <li>Primeiro, <strong className="text-gray-800">crie uma conta para você</strong> na tela de registro do aplicativo.</li>
                                    <li>No painel do Supabase, vá para o <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">Table Editor</code> e selecione a tabela <code className="text-sm font-mono">profiles</code>.</li>
                                    <li>Encontre a linha correspondente ao seu usuário recém-criado.</li>
                                    <li>Clique duas vezes na célula da coluna <code className="text-sm font-mono">is_admin</code> e mude o valor de <code className="text-sm font-mono">false</code> para <code className="text-sm font-mono">true</code>. Salve a alteração.</li>
                                </ol>
                            </div>

                            <div className="border-t pt-4 text-center">
                                <p className="text-gray-700 font-semibold">Após seguir estes passos, atualize a página.</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.status === 'pending') {
    return (
      <Routes>
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="*" element={<Navigate to="/pending" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={isAuthenticated ? <MainLayout><Home /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/profile" element={isAuthenticated ? <MainLayout><Profile /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/virtual-id" element={isAuthenticated ? <VirtualIdCard /> : <Navigate to="/login" />} />
      <Route path="/edit-profile" element={isAuthenticated ? <EditProfile /> : <Navigate to="/login" />} />
      <Route path="/my-course" element={isAuthenticated ? <MainLayout><MyCourse /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/financial" element={isAuthenticated ? <MainLayout><Financial /></MainLayout> : <Navigate to="/login" />} />
      <Route path="/help" element={isAuthenticated ? <MainLayout><Help /></MainLayout> : <Navigate to="/login" />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={isAuthenticated && user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
      <Route path="/admin/edit-user/:uid" element={isAuthenticated && user?.isAdmin ? <AdminEditUser /> : <Navigate to="/" />} />
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

const App: React.FC = () => {
  // Checks if all the environment variables for Supabase are set.
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== 'SUA_URL_DO_PROJETO_SUPABASE' &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'SUA_CHAVE_ANON_DO_SUPABASE';


  if (!isSupabaseConfigured) {
    return <SupabaseConfigWarning />;
  }
  
  return (
    <AuthProvider>
      <div className="min-h-[100dvh] font-sans bg-slate-100">
        <div className="relative max-w-sm mx-auto min-h-[100dvh] bg-white shadow-lg overflow-hidden">
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;