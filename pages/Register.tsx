


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS, UNIVERSITY_LOGOS } from '../constants';
import { CameraIcon, ArrowPathIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type FormData = Omit<User, 'uid' | 'email'>;

const Register: React.FC = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [formData, setFormData] = useState<FormData>({
        status: 'pending',
        institutionalLogin: '',
        rgm: '',
        fullName: '',
        university: 'Anhanguera',
        course: '',
        campus: '',
        validity: '',
        photo: null,
    });
    const [email, setEmail] = useState('');
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

            if (name === 'fullName') {
                // Generate institutional login from full name
                const institutionalLogin = value
                    .trim()
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9\s]/g, '') // Remove special chars but keep spaces
                    .replace(/\s+/g, '.'); // Replace spaces with dots
                newFormData.institutionalLogin = institutionalLogin;
            }

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
            
            return newFormData;
        });
    };
    
    let institutionalEmail = '';
    if (formData.institutionalLogin && formData.university) {
        const university = formData.university as UniversityName;
        const details = UNIVERSITY_DETAILS[university];
        // The prefix is already formatted and stored in institutionalLogin
        const emailPrefix = formData.institutionalLogin;
        if (emailPrefix) {
            institutionalEmail = `${emailPrefix}@${details.domain}`;
        }
    }


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
        if (!email || !formData.fullName || !formData.university || !formData.course || !formData.campus || !formData.institutionalLogin) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const newUser = await auth.register(formData, email, password);
            if (newUser.status === 'approved') {
                navigate('/');
            } else {
                navigate('/pending');
            }
        } catch (err: any) {
            console.error("Registration Error:", err); // Log the full error for debugging
            if (err.message.includes('User already registered')) {
                 setError('Este e-mail já está em uso. Por favor, utilize outro.');
            } else if (err.message.includes('password should be at least 6 characters')) {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (err.message.includes('valid email')) {
                setError('O e-mail fornecido é inválido.');
            } else if (err.message.includes('violates row-level security policy')) {
                setError(
                     <div className="text-left p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
                        <h3 className="text-lg font-bold mb-3">Ação Necessária no Supabase</h3>
                        <p>O erro indica que as <strong>Regras de Segurança (RLS)</strong> estão bloqueando a criação do seu perfil de usuário. Verifique se o script SQL foi executado corretamente no seu projeto Supabase, conforme as instruções da tela inicial.</p>
                    </div>
                );
            }
            else {
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

                {error && (
                    typeof error === 'string' 
                        ? <div className="text-red-700 bg-red-100 p-4 rounded-lg border border-red-200 text-sm">{error}</div> 
                        : error
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                        <input name="fullName" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Email Pessoal (para login)</label>
                        <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" placeholder="seu.email@provedor.com" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Senha</label>
                        <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
                        <input name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Faculdade</label>
                        <select name="university" value={formData.university} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
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
                        <label className="text-sm font-medium text-gray-700">Email Institucional (gerado)</label>
                        <input name="institutionalEmailDisplay" value={institutionalEmail || ''} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100 pr-10" placeholder="Gerado a partir do nome completo" />
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
                        <label className="text-sm font-medium text-gray-700">RGM</label>
                         <div className="relative mt-1">
                            <input name="rgm" value={formData.rgm || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg pr-10" required />
                            <button type="button" onClick={() => setFormData({...formData, rgm: generateRGM()})} className="absolute inset-y-0 right-1 my-auto flex items-center p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 h-fit">
                               <ArrowPathIcon className="h-4 w-4"/>
                            </button>
                        </div>
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