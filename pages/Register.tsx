

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Update react-router-dom imports to v6. 'useHistory' is 'useNavigate'.
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS, UNIVERSITY_LOGOS } from '../constants';
import { CameraIcon, ArrowPathIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type FormData = Omit<User, 'uid' | 'email' | 'isAdmin' | 'theme' | 'themeSource'>;

const Register: React.FC = () => {
    // FIX: Use useNavigate() for navigation in react-router-dom v6.
    const navigate = useNavigate();
    const auth = useAuth();
    const { themesRegistry, setCurrentThemeById } = useTheme();

    const [formData, setFormData] = useState<FormData>({
        status: 'pending' as const,
        institutionalLogin: '',
        rgm: '',
        fullName: '',
        university: '' as any, // Start empty, will be validated
        course: '',
        campus: '',
        validity: '',
        photo: null as string | null,
    });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [error, setError] = useState<React.ReactNode>('');
    const [loading, setLoading] = useState(false);
    const [imageProcessing, setImageProcessing] = useState(false);
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState('default');
    const [themeSource, setThemeSource] = useState<'system' | 'auto' | 'user'>('system');

    // Live theme preview
    useEffect(() => {
        setCurrentThemeById(selectedThemeId);
    }, [selectedThemeId, setCurrentThemeById]);
    
    // Auto-select theme based on university
    useEffect(() => {
        if (formData.university) {
            const themeId = Object.values(themesRegistry).find(t => t.name === formData.university)?.id || 'default';
            setSelectedThemeId(themeId);
            setThemeSource('auto');
        } else {
            setSelectedThemeId('default');
            setThemeSource('system');
        }
    }, [formData.university, themesRegistry]);


    const generateRGM = useCallback(() => {
        const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
        const digit = Math.floor(Math.random() * 10);
        return `${randomPart}-${digit}`;
    }, []);

    const handleGenerateValidity = useCallback(() => {
        const today = new Date();
        // Min 3 months (~90 days), max 600 days
        const randomDays = Math.floor(90 + Math.random() * (600 - 90 + 1));
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + randomDays);
        const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
        const year = futureDate.getFullYear();
        setFormData(prev => ({...prev, validity: `${month}/${year}`}));
    }, []);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            rgm: generateRGM(),
        }));
    }, [generateRGM]);

    // Cleanup effect for blob URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (formData.photo && formData.photo.startsWith('blob:')) {
                URL.revokeObjectURL(formData.photo);
            }
        };
    }, [formData.photo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prevData => {
            const newFormData = { ...prevData, [name]: value };

            if (name === 'fullName' && value) {
                const institutionalLogin = value
                    .trim()
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '.');
                newFormData.institutionalLogin = institutionalLogin;
            }

            if (name === 'university') {
                const university = value as UniversityName | '';
                if (university) {
                    setSelectedLogo(UNIVERSITY_LOGOS[university]);
                    const details = UNIVERSITY_DETAILS[university];
                    newFormData.campus = details.campuses[0];
                } else {
                    setSelectedLogo(null);
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
        if (formData.institutionalLogin) {
            institutionalEmail = `${formData.institutionalLogin}@${details.domain}`;
        }
    }

    const compressImage = (file: File, options: { maxWidth: number; maxHeight: number; quality: number }): Promise<{ compressedFile: File; previewUrl: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onerror = reject;
            reader.onload = (e) => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    let { width, height } = img;
    
                    if (width > height) {
                        if (width > options.maxWidth) {
                            height = Math.round((height * options.maxWidth) / width);
                            width = options.maxWidth;
                        }
                    } else {
                        if (height > options.maxHeight) {
                            width = Math.round((width * options.maxHeight) / height);
                            height = options.maxHeight;
                        }
                    }
    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error('Could not get canvas context.'));
                    }
                    ctx.drawImage(img, 0, 0, width, height);
    
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                return reject(new Error('Canvas to Blob conversion failed.'));
                            }
                            const fileName = file.name.split('.').slice(0, -1).join('.') + '.jpeg';
                            const compressedFile = new File([blob], fileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            const previewUrl = URL.createObjectURL(blob);
                            resolve({ compressedFile, previewUrl });
                        },
                        'image/jpeg',
                        options.quality
                    );
                };
                img.src = e.target?.result as string;
            };
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                 setError('Por favor, selecione um arquivo de imagem.');
                 return;
            }

            setImageProcessing(true);
            setError('');
            try {
                const { compressedFile, previewUrl } = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                setPhotoFile(compressedFile);
                setFormData(prev => ({ ...prev, photo: previewUrl }));
            } catch (err) {
                 console.error("Image processing failed:", err);
                 setError('Falha ao processar a imagem. Tente uma imagem diferente.');
            } finally {
                setImageProcessing(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError('As senhas não coincidem.');
        if (!formData.validity) return setError('Por favor, gere uma data de validade para a carteirinha.');
        if (!email || !formData.fullName || !formData.university || !formData.course || !formData.campus) {
             return setError('Por favor, preencha todos os campos obrigatórios.');
        }
        
        setLoading(true);
        setError('');
        try {
            const userData: Omit<User, 'uid' | 'email'> = {
                ...formData,
                university: formData.university as UniversityName,
                theme: selectedThemeId,
                themeSource: themeSource,
            };
            await auth.register(userData, email, password, photoFile ?? undefined);
            setRegistrationSuccess(true);
        } catch (err: any) {
            console.error("Registration Error:", err.code);
            if (err.code === 'auth/email-already-in-use') setError('Este e-mail já está em uso.');
            else if (err.code === 'auth/weak-password') setError('A senha deve ter pelo menos 6 caracteres.');
            else if (err.code === 'auth/invalid-email') setError('O e-mail fornecido é inválido.');
            else setError('Ocorreu um erro ao criar a conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleThemeSelect = (themeId: string) => {
        setSelectedThemeId(themeId);
        setThemeSource('user');
    };

    const themeOptions = Object.values(themesRegistry)
        .sort((a, b) => (a.id === 'default' ? -1 : b.id === 'default' ? 1 : a.name.localeCompare(b.name)));
    
    return (
        <div className="flex-grow flex flex-col justify-center bg-gradient-to-b from-cyan-50 to-blue-100 p-4">
            <div className="w-full max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                {registrationSuccess ? (
                    <div className="text-center p-4">
                        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Conta Criada com Sucesso!</h2>
                        <p className="mt-4 text-gray-700">Sua conta foi criada e agora está aguardando a aprovação de um administrador.</p>
                        <p className="mt-2 text-gray-600">Após a aprovação, você poderá acessar o portal fazendo login com suas credenciais.</p>
                        {/* FIX: Use navigate() for navigation. */}
                        <button onClick={() => navigate('/login')} className="mt-8 w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                            Voltar para o Login
                        </button>
                    </div>
                ) : (
                <>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800">Criar conta</h1>
                        <p className="text-gray-500 mt-2">Preencha seus dados</p>
                    </div>

                    {error && <div className="text-red-700 bg-red-100 p-4 rounded-lg border border-red-200 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                            <input name="fullName" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Email Pessoal (para login)</label>
                            <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" placeholder="seu.email@provedor.com" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Senha</label>
                                <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
                                <input name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Faculdade</label>
                                <select name="university" value={formData.university} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                                    <option value="">Selecione</option>
                                    {universityNames.map(uni => <option key={uni} value={uni}>{uni}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Curso</label>
                                <select name="course" value={formData.course} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                                    <option value="">Selecione</option>
                                    {COURSE_LIST.map(course => <option key={course} value={course}>{course}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {selectedLogo && (
                            <div className="flex justify-center py-2 transition-all duration-300 ease-in-out">
                                <img src={selectedLogo} alt="Logotipo da Faculdade" className="max-h-12 object-contain opacity-80" />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-gray-700">Campus</label>
                            <select name="campus" value={formData.campus || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required disabled={!formData.university}>
                                {formData.university && UNIVERSITY_DETAILS[formData.university as UniversityName].campuses.map(campus => <option key={campus} value={campus}>{campus}</option>)}
                            </select>
                        </div>
                        
                        <div className="relative">
                            <label className="text-sm font-medium text-gray-700">Email Institucional (gerado)</label>
                            <input name="institutionalEmailDisplay" value={institutionalEmail || ''} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100 pr-10" placeholder="Gerado a partir do nome completo" />
                            <SparklesIcon className="absolute right-2 top-8 h-5 w-5 text-green-500"/>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700">RGM</label>
                            <div className="relative mt-1">
                                <input name="rgm" value={formData.rgm || ''} readOnly className="w-full p-2 border border-gray-300 rounded-lg pr-10 bg-gray-100" />
                                <button type="button" onClick={() => setFormData({...formData, rgm: generateRGM()})} className="absolute inset-y-0 right-1 my-auto flex items-center p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 h-fit">
                                    <ArrowPathIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                        
                        {/* FIX: Complete the truncated file with the remaining form fields. This fixes the syntax error. */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">Validade da Carteirinha</label>
                            <div className="relative mt-1">
                                <input name="validity" value={formData.validity || ''} readOnly className="w-full p-2 border border-gray-300 rounded-lg pr-10 bg-gray-100" />
                                <button type="button" onClick={handleGenerateValidity} className="absolute inset-y-0 right-1 my-auto flex items-center p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 h-fit">
                                    <ArrowPathIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="photo-upload-input" className="text-sm font-medium text-gray-700">Sua Foto</label>
                            <input
                                id="photo-upload-input"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handlePhotoUpload}
                            />
                            <label
                                htmlFor="photo-upload-input"
                                className={`mt-1 w-full h-32 flex flex-col items-center justify-center rounded-xl border-2 bg-cover bg-center cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                                    formData.photo 
                                    ? 'border-solid border-blue-300' 
                                    : 'border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-500 hover:text-blue-500'
                                }`}
                                style={formData.photo ? { backgroundImage: `url(${formData.photo})` } : {}}
                            >
                                {imageProcessing ? (
                                    <div className="flex flex-col items-center text-gray-600">
                                        <ArrowPathIcon className="w-6 h-6 animate-spin" />
                                        <span className="font-medium text-sm mt-2">Processando...</span>
                                    </div>
                                ) : formData.photo ? (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <CameraIcon className="w-8 h-8" />
                                        <span className="font-medium text-sm mt-1">Alterar Foto</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <CameraIcon className="w-8 h-8" />
                                        <span className="font-medium text-sm mt-2">Adicionar Foto</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700">Tema do App</label>
                             <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {themeOptions.map(theme => (
                                    <div key={theme.id} onClick={() => handleThemeSelect(theme.id)} className="cursor-pointer">
                                        <div className={`w-full h-16 rounded-lg border-2 flex items-center justify-center transition-all ${selectedThemeId === theme.id ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-2' : 'border-gray-300'}`} style={{ backgroundColor: theme.tokens.surface }}>
                                            <div className="flex items-center gap-1">
                                                <div className="w-4 h-8 rounded" style={{ backgroundColor: theme.tokens.primary }}></div>
                                                <div className="w-4 h-8 rounded" style={{ backgroundColor: theme.tokens.accent }}></div>
                                                <div className="w-4 h-8 rounded" style={{ backgroundColor: theme.tokens.secondary }}></div>
                                            </div>
                                        </div>
                                        <p className={`text-center text-xs mt-1 font-medium ${selectedThemeId === theme.id ? 'text-[var(--primary)]' : 'text-gray-600'}`}>
                                            {theme.name.replace('Universidade ', '').replace(' (Default)','')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || imageProcessing}
                            className="w-full bg-[var(--primary)] text-[var(--on-primary)] font-bold p-3 rounded-lg hover:opacity-90 disabled:opacity-70 mt-4"
                        >
                            {loading ? 'Criando...' : 'Criar Conta'}
                        </button>
                    </form>
                </>
            )}
            </div>
        </div>
    );
};

// FIX: Add missing default export
export default Register;