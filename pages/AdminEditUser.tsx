
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS } from '../constants';
import { ArrowLeftIcon, CameraIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

const AdminEditUser: React.FC = () => {
    const { login } = useParams<{ login: string }>();
    const { getAllUsers, updateUser } = useAuth();
    const history = useHistory();
    
    const [formData, setFormData] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        const userToEdit = getAllUsers().find(u => u.login === login);
        if (userToEdit) {
            setFormData(userToEdit);
        } else {
            setError('Usuário não encontrado.');
        }
    }, [login, getAllUsers]);

    const generateRGM = useCallback(() => {
        const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
        const digit = Math.floor(Math.random() * 10);
        return `${randomPart}-${digit}`;
    }, []);

    const generateValidity = useCallback(() => {
        const today = new Date();
        const randomDays = Math.floor(150 + Math.random() * (600 - 150 + 1));
        today.setDate(today.getDate() + randomDays);
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        return `${month}/${year}`;
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        const updateEmail = (data: User) => {
            if (data.login && data.university) {
                const university = data.university as UniversityName;
                const details = UNIVERSITY_DETAILS[university];
                const emailPrefix = data.login.trim().toLowerCase().replace(/\s+/g, '.');
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
        if (!formData) return;
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormData({ ...formData, photo: event.target.result as string });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !login) return;
        try {
            const dataToUpdate = { ...formData };
            if (newPassword.trim()) {
                dataToUpdate.password = newPassword.trim();
            }
            updateUser(dataToUpdate, login);
            history.push('/admin/dashboard');
        } catch(err) {
            setError('Falha ao atualizar o perfil. Tente novamente.');
        }
    };

    if (!formData) {
        return (
            <div className="p-4 flex items-center justify-center h-full">
                <p className="text-gray-600">{error || 'Carregando...'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col bg-gray-50">
            <header className="p-4 flex items-center text-gray-700 bg-white shadow-sm sticky top-0 z-10">
                <button onClick={() => history.goBack()} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Editar Usuário: {login}</h1>
            </header>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-grow overflow-y-auto">
                 {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}
                
                 <div className="flex flex-col items-center space-y-2">
                     <div className="relative w-28 h-28 mx-auto">
                        <img src={formData.photo || 'https://i.imgur.com/V4RclNb.png'} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg" />
                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-md cursor-pointer">
                            <CameraIcon className="w-5 h-5" />
                        </label>
                        <input id="photo-upload" name="photo" type="file" className="sr-only" onChange={handlePhotoUpload} accept="image/*"/>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">Login</label>
                    <input name="login" value={formData.login} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Nova Senha (Opcional)</label>
                    <input name="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" placeholder="Deixe em branco para não alterar" />
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">RGM</label>
                    <div className="relative mt-1">
                        <input name="rgm" value={formData.rgm} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg pr-10" required />
                        <button type="button" onClick={() => setFormData({...formData, rgm: generateRGM()})} className="absolute inset-y-0 right-1 my-auto flex items-center p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 h-fit">
                           <ArrowPathIcon className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <label className="text-sm font-medium text-gray-700">E-mail</label>
                    <input name="email" value={formData.email} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100 pr-10" />
                    <SparklesIcon className="absolute right-2 top-8 h-5 w-5 text-green-500"/>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Faculdade</label>
                    <select name="university" value={formData.university} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                        {universityNames.map(uni => <option key={uni} value={uni}>{uni}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Curso</label>
                    <select name="course" value={formData.course} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                        {COURSE_LIST.map(course => <option key={course} value={course}>{course}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Campus</label>
                    <select name="campus" value={formData.campus} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required>
                        {UNIVERSITY_DETAILS[formData.university].campuses.map(campus => <option key={campus} value={campus}>{campus}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Validade</label>
                     <div className="relative mt-1">
                        <input name="validity" value={formData.validity} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg pr-10" />
                        <button type="button" onClick={() => setFormData({...formData, validity: generateValidity()})} className="absolute inset-y-0 right-1 my-auto flex items-center p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 h-fit">
                           <ArrowPathIcon className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <div className="pt-4 sticky bottom-0 bg-gray-50 pb-4">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700">Salvar Alterações</button>
                </div>
            </form>
        </div>
    );
};

export default AdminEditUser;