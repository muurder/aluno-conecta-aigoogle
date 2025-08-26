





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

const sqlScript = `-- ================================================================================================
--  SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS PARA O PORTAL DO ALUNO
--  Versão: 4.0 - Adicionado Mural do Curso (Posts, Comentários, Reações)
--  Descrição: Este script limpa configurações antigas e cria a estrutura necessária.
--  É seguro executar este script múltiplas vezes.
-- ================================================================================================

-- PASSO 1: Limpeza de objetos antigos para garantir uma instalação limpa.
-- Remove as políticas RLS antigas, se existirem.
DROP POLICY IF EXISTS "Allow authenticated users to read posts." ON public.posts;
DROP POLICY IF EXISTS "Allow admins to create posts." ON public.posts;
DROP POLICY IF EXISTS "Allow admins to delete their own posts." ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated users to read comments." ON public.comments;
DROP POLICY IF EXISTS "Allow authenticated users to insert comments." ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments, admins can delete any." ON public.comments;
DROP POLICY IF EXISTS "Allow authenticated users to read reactions." ON public.reactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert reactions." ON public.reactions;
DROP POLICY IF EXISTS "Allow users to delete their own reactions." ON public.reactions;
DROP POLICY IF EXISTS "Users can read their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;

-- Remove as tabelas antigas. A opção CASCADE remove objetos dependentes como policies.
DROP TABLE IF EXISTS public.reactions;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.posts;
DROP TABLE IF EXISTS public.profiles;

-- Remove as funções antigas. A opção CASCADE remove automaticamente objetos dependentes.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_admin();


-- PASSO 2: Criação da nova estrutura do banco de dados.

-- 2.1. Tabela de Perfis de Usuários
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
  status TEXT DEFAULT 'pending' NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT profiles_uid_fkey FOREIGN KEY (uid) REFERENCES auth.users (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Armazena informações de perfil público para cada usuário.';

-- 2.2. Tabela de Posts do Mural
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_uid uuid NOT NULL REFERENCES public.profiles(uid) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.posts IS 'Armazena os posts do mural criados por administradores.';

-- 2.3. Tabela de Comentários
CREATE TABLE public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_uid uuid NOT NULL REFERENCES public.profiles(uid) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.comments IS 'Armazena os comentários dos usuários em cada post.';

-- 2.4. Tabela de Reações
CREATE TABLE public.reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_uid uuid NOT NULL REFERENCES public.profiles(uid) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  UNIQUE(post_id, user_uid) -- Garante que um usuário só pode ter uma reação por post.
);
COMMENT ON TABLE public.reactions IS 'Armazena as reações (emojis) dos usuários nos posts.';


-- PASSO 3: Gatilhos e Funções do Banco de Dados.

-- 3.1. Função para criar um perfil ao registrar um novo usuário.
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
    'pending' -- Seta o status inicial como 'pendente'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria um perfil para um novo usuário na tabela public.profiles.';

-- 3.2. Gatilho (trigger) que executa a função acima após cada novo registro.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.3. Função auxiliar para checar se o usuário é admin (evita recursão em RLS).
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN (SELECT is_admin FROM public.profiles WHERE uid = auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION public.is_user_admin() IS 'Verifica se o usuário logado é um administrador, de forma segura para RLS.';


-- PASSO 4: Configuração da Segurança a Nível de Linha (RLS).

-- 4.1. Ativa RLS em todas as tabelas relevantes.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- 4.2. Políticas para a tabela de Perfis (profiles).
CREATE POLICY "Users can read their own profile." ON public.profiles FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (public.is_user_admin() = true);

-- 4.3. Políticas para a tabela de Posts (posts).
CREATE POLICY "Allow authenticated users to read posts." ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to create posts." ON public.posts FOR INSERT TO authenticated WITH CHECK (public.is_user_admin() = true);
CREATE POLICY "Allow admins to delete their own posts." ON public.posts FOR DELETE TO authenticated USING (public.is_user_admin() = true AND auth.uid() = author_uid);

-- 4.4. Políticas para a tabela de Comentários (comments).
CREATE POLICY "Allow authenticated users to read comments." ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert comments." ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() is not null);
CREATE POLICY "Users can delete their own comments, admins can delete any." ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_uid OR public.is_user_admin() = true);

-- 4.5. Políticas para a tabela de Reações (reactions).
CREATE POLICY "Allow authenticated users to read reactions." ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert reactions." ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_uid);
CREATE POLICY "Allow users to delete their own reactions." ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_uid);`;

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
                                    Para que seu aplicativo possa se comunicar com o Supabase, você precisa autorizar as URLs de onde ele será acessado.
                                </p>
                                 <ol className="list-decimal list-inside text-gray-600 text-sm space-y-2">
                                    <li>No painel do Supabase, vá para <strong className="text-gray-800">Project Settings &gt; API</strong>.</li>
                                    <li>Role a página até a seção <strong className="text-gray-800">URL Configuration</strong>.</li>
                                    <li>
                                        Em <strong className="text-gray-800">CORS settings</strong>, você precisa adicionar as URLs do seu ambiente de desenvolvimento e produção:
                                        <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                                            <li>
                                                <strong>Desenvolvimento:</strong> Adicione <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">http://localhost:5173</code> (ou a porta que você estiver usando).
                                            </li>
                                            <li>
                                                <strong>Produção (Vercel):</strong> Após fazer o deploy, adicione a URL do seu site, como <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">https://seu-projeto.vercel.app</code>.
                                            </li>
                                        </ul>
                                    </li>
                                </ol>
                                <div className="mt-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-sm rounded-r-lg">
                                    <p><strong className="font-bold">Importante:</strong> O erro de CORS que você está vendo acontece porque a URL onde seu app está rodando (seja no Vercel ou localmente) não está na lista de permissões do Supabase.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 4:</strong> Execute o Script do Banco de Dados</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    No painel do seu projeto Supabase, vá para o <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">SQL Editor</code>, clique em "New query" e cole o script abaixo. Ele irá limpar qualquer configuração anterior e criar a estrutura correta.
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
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 5:</strong> Configure o Armazenamento de Imagens</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Para que os administradores possam postar imagens no mural, você precisa criar um "Bucket" no Supabase Storage.
                                </p>
                                 <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1.5">
                                    <li>No menu esquerdo do Supabase, clique no ícone de <strong className="text-gray-800">Storage</strong>.</li>
                                    <li>Clique em <strong className="text-gray-800">New Bucket</strong>.</li>
                                     <li>Nomeie o bucket como <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">post_images</code> e marque a opção <strong className="text-gray-800">Public bucket</strong>.</li>
                                    <li>Clique em <strong className="text-gray-800">Create bucket</strong>.</li>
                                    <li>Após criar, clique nos três pontos (...) ao lado do bucket e selecione <strong className="text-gray-800">Policies</strong>.</li>
                                    <li>Clique em <strong className="text-gray-800">New Policy</strong> e use o template <strong className="text-gray-800">"Give users access to their own files"</strong>. Na política de INSERT, modifique a condição para <code className="bg-gray-200 text-gray-800 font-mono p-1 rounded-md text-sm">(bucket_id = 'post_images') AND (storage.foldername(name))[1] = (SELECT (is_admin)::text FROM public.profiles WHERE (profiles.uid = auth.uid()))</code>. Isso permitirá que apenas administradores façam upload.</li>
                                </ol>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl text-gray-800 mb-3"><strong className="text-blue-600">Passo 6:</strong> Defina o Primeiro Administrador</h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    Para acessar o painel de administração e postar no mural, você precisa definir um usuário como administrador manualmente.
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
        <div className="relative max-w-sm mx-auto min-h-[100dvh] bg-white shadow-lg overflow-hidden flex flex-col">
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;