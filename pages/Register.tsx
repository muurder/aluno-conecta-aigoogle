
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS, UNIVERSITY_LOGOS } from '../constants';
import { CameraIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [formData, setFormData] = useState<Omit<User, 'uid'>>({
        status: 'pending',
        login: '',
        rgm: '',
        fullName: '',
        email: '',
        university: 'Anhanguera',
        course: '',
        campus: '',
        validity: '',
        photo: null,
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<React.ReactNode>('');
    const [loading, setLoading] = useState(false);
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

    const generateRGM = useCallback(() => {
        const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
        const digit = Math.floor(Math.random() * 10);
        return `${randomPart}-${digit}`;
    }, []);

    const generateValidity = useCallback(() => {
        const today = new Date();
        const randomDays = Math.floor(100 + Math.random() * (600 - 100 + 1));
        today.setDate(today.getDate() + randomDays);
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        return `${month}/${year}`;
    }, []);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            rgm: generateRGM(),
            validity: generateValidity()
        }));
    }, [generateRGM, generateValidity]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prevData => {
            const newFormData = { ...prevData, [name]: value };

            const updateEmail = (data: Omit<User, 'uid'>) => {
                if (data.login && data.university) {
                    const university = data.university as UniversityName;
                    const details = UNIVERSITY_DETAILS[university];
                    // Sanitize login to create a valid email prefix
                    const emailPrefix = data.login.trim().toLowerCase()
                        .replace(/\s+/g, '.')
                        .replace(/[^a-z0-9._-]/g, '');
                    data.email = `${emailPrefix}@${details.domain}`;
                }
                return data;
            };

            if (name === 'university') {
                const university = value as UniversityName;
                setSelectedLogo(university ? UNIVERSITY_LOGOS[university] : null);
                if (university) {
                    const details = UNIVERSITY_DETAILS[university];
                    newFormData.campus = details.campuses[0];
                } else {
                    newFormData.campus = '';
                }
            }
            
            return updateEmail(newFormData);
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData({ ...formData, photo: event.target?.result as string });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (!formData.login || !formData.email || !formData.fullName || !formData.university || !formData.course || !formData.campus) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            await auth.register(formData, password);
            navigate('/pending');
        } catch (err: any) {
            console.error("Registration Error:", err); // Log the full error for debugging
            if (err.code === 'auth/email-already-in-use') {
                 setError('Este e-mail já está em uso. Tente outro login ou faculdade.');
            } else if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (err.code === 'auth/invalid-email') {
                setError('O e-mail gerado é inválido. Verifique se o login contém caracteres válidos (letras, números, pontos, hífens).');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError(
                    <div className="text-left">
                        <p className="font-bold text-center mb-2">Ação Necessária no Firebase</p>
                        <p className="text-sm mb-2">
                            O erro <code className="bg-red-200 text-red-800 text-xs p-1 rounded">auth/operation-not-allowed</code> indica que o método de login com <strong>E-mail/Senha</strong> não está habilitado no seu projeto.
                        </p>
                        <p className="text-sm font-semibold">Para corrigir:</p>
                        <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                            <li>Abra o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Console do Firebase</a>.</li>
                            <li>Vá para a seção <strong>Authentication</strong>.</li>
                            <li>Clique na aba <strong>Sign-in method</strong> (ou Método de login).</li>
                            <li>Encontre <strong>"E-mail/senha"</strong> na lista de provedores e ative-o.</li>
                            <li>Salve as alterações e tente se cadastrar novamente.</li>
                        </ol>
                    </div>
                );
            } else if (err.code === 'permission-denied') {
                setError(
                    <div className="text-left">
                        <p className="font-bold text-center mb-2">Ação Necessária no Firestore</p>
                        <p className="text-sm mb-2">
                            O erro <code className="bg-red-200 text-red-800 text-xs p-1 rounded">permission-denied</code> indica que as <strong>Regras de Segurança do Firestore</strong> estão bloqueando a criação do seu perfil de usuário.
                        </p>
                        <p className="text-sm font-semibold">Para corrigir, permita a criação de novos usuários:</p>
                        <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                            <li>No Console do Firebase, vá para <strong>Firestore Database</strong>.</li>
                            <li>Clique na aba <strong>Regras</strong>.</li>
                            <li>Substitua as regras existentes por estas para permitir o cadastro:</li>
                        </ol>
                        <div className="text-left bg-gray-100 p-2 my-2 rounded-md overflow-x-auto">
                            <pre className="text-xs text-gray-600">
                                <code>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Permite que qualquer um crie um usuário, mas só o
      // próprio usuário possa ler ou modificar seus dados depois.
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if true;
    }
  }
}`}
                                </code>
                            </pre>
                        </div>
                         <p className="text-xs text-gray-500 text-center">Isso permite que novos usuários se cadastrem. Lembre-se de ajustar as regras para suas necessidades de produção.</p>
                    </div>
                );
            } else {
                setError('Ocorreu um erro ao criar a conta. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-full flex flex-col justify-center bg-gradient-to-b from-cyan-50 to-blue-100 p-4">
            <div className="w-full max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    {selectedLogo && (
                        <img src={selectedLogo} alt="Logotipo da Faculdade" className="h-16 mx-auto mb-4 object-contain" />
                    )}
                    <h1 className="text-3xl font-bold text-gray-800">Criar conta</h1>
                    <p className="text-gray-500 mt-2">Preencha seus dados</p>
                </div>

                {error && <div className="text-red-700 bg-red-100 p-4 rounded-lg border border-red-200 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Login</label>
                        <input name="login" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">RGM</label>
                         <div className="relative mt-1">
                            <input name="rgm" value={formData.rgm || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg pr-10" required />
                            <button type="button" onClick={() => setFormData({...formData, rgm: generateRGM()})} className="absolute inset-y-0 right-1 my-auto flex items-center p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 h-fit">
                               <ArrowPathIcon className="h-4 w-4"/>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Senha</label>
                        <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
                        <input name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                        <input name="fullName" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Faculdade</label>
                        <select name="university" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                            <option value="">Selecione</option>
                            {universityNames.map(uni => <option key={uni} value={uni}>{uni}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">Curso</label>
                        <select name="course" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                            <option value="">Selecione</option>
                            {COURSE_LIST.map(course => <option key={course} value={course}>{course}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2 relative">
                        <label className="text-sm font-medium text-gray-700">E-mail</label>
                        <input name="email" value={formData.email || ''} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100 pr-10" placeholder="Gerado automaticamente" required />
                        <SparklesIcon className="absolute right-2 top-8 h-5 w-5 text-green-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Campus</label>
                        <select name="campus" value={formData.campus || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required disabled={!formData.university}>
                            <option value="">Selecione um campus</option>
                            {formData.university && UNIVERSITY_DETAILS[formData.university as UniversityName].campuses.map(campus => <option key={campus} value={campus}>{campus}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Validade</label>
                        <input name="validity" value={formData.validity || ''} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Foto do aluno (upload)</label>
                        <input id="photo-upload" name="photo" type="file" className="sr-only" onChange={handlePhotoUpload} accept="image/*"/>
                        <label htmlFor="photo-upload" className="mt-1 cursor-pointer block">
                            {formData.photo ? (
                                <div className="relative group">
                                    <img src={formData.photo} alt="Preview" className="w-full h-40 object-cover rounded-md border-2 border-green-500"/>
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                        Trocar Imagem
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500">
                                    <div className="space-y-1 text-center">
                                        <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <p className="pl-1">Selecionar imagem</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                                    </div>
                                </div>
                            )}
                        </label>
                    </div>
                    
                    <button type="submit" disabled={loading} className="md:col-span-2 w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                        {loading ? 'Criando conta...' : 'Criar conta'}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Já tem conta?{' '}
                        <button onClick={() => navigate('/login')} className="font-medium text-blue-600 hover:underline">
                            Entrar
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
