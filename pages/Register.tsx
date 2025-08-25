
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS } from '../constants';
import { CameraIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [formData, setFormData] = useState<Partial<User>>({
        status: 'pending',
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const generateRGM = useCallback(() => {
        const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
        const digit = Math.floor(Math.random() * 10);
        return `${randomPart}-${digit}`;
    }, []);

    const generateValidity = useCallback(() => {
        const today = new Date();
        const randomDays = Math.floor(150 + Math.random() * 451);
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
        let newFormData = { ...formData, [name]: value };

        const updateEmail = (data: Partial<User>) => {
            if (data.fullName && data.university) {
                const university = data.university as UniversityName;
                const details = UNIVERSITY_DETAILS[university];
                const emailPrefix = data.fullName.trim().toLowerCase().replace(/\s+/g, '.');
                data.email = `${emailPrefix}@${details.domain}`;
            }
            return data;
        };

        if (name === 'university') {
            const university = value as UniversityName;
            const details = UNIVERSITY_DETAILS[university];
            newFormData.campus = details.campuses[0];
        }

        newFormData = updateEmail(newFormData);
        
        setFormData(newFormData);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (!formData.login || !formData.fullName || !formData.university || !formData.course || !formData.campus) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        const fullUser: User = {
            ...formData,
            password: password,
            status: 'pending',
        } as User;

        auth.register(fullUser);
        navigate('/pending');
    };
    
    return (
        <div className="min-h-full flex flex-col justify-center bg-gradient-to-b from-cyan-50 to-blue-100 p-4">
            <div className="w-full max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Criar conta</h1>
                    <p className="text-gray-500 mt-2">Preencha seus dados</p>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Login</label>
                        <input name="login" onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div className="relative">
                        <label className="text-sm font-medium text-gray-700">RGM</label>
                        <input name="rgm" value={formData.rgm || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg pr-10" required />
                        <button type="button" onClick={() => setFormData({...formData, rgm: generateRGM()})} className="absolute right-1 top-7 p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600">
                           <ArrowPathIcon className="h-4 w-4"/>
                        </button>
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
                    <div className="md:col-span-2 relative">
                        <label className="text-sm font-medium text-gray-700">E-mail</label>
                        <input name="email" value={formData.email || ''} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100 pr-10" placeholder="Gerado automaticamente" required />
                        <SparklesIcon className="absolute right-2 top-8 h-5 w-5 text-green-500"/>
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
                    <div>
                        <label className="text-sm font-medium text-gray-700">Campus</label>
                        <select name="campus" value={formData.campus || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required disabled={!formData.university}>
                            {formData.university && UNIVERSITY_DETAILS[formData.university as UniversityName].campuses.map(campus => <option key={campus} value={campus}>{campus}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Validade</label>
                        <input name="validity" value={formData.validity || ''} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Foto do aluno (upload)</label>
                        <label htmlFor="photo-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500">
                            <div className="space-y-1 text-center">
                                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <p className="pl-1">Selecionar imagem</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                            </div>
                        </label>
                        <input id="photo-upload" name="photo" type="file" className="sr-only" onChange={handlePhotoUpload} accept="image/*"/>
                    </div>
                    
                    <button type="submit" className="md:col-span-2 w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700">Criar conta</button>
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
