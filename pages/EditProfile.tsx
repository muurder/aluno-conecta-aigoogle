import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS } from '../constants';
import { ArrowLeftIcon, CameraIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const EditProfile: React.FC = () => {
    const { user, updateUser, changePassword } = useAuth();
    const navigate = useNavigate();
    
    if (!user) {
        navigate('/login');
        return null;
    }
    
    const [formData, setFormData] = useState<User>(user);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prevData => {
            if (!prevData) return prevData;
            const newFormData = { ...prevData, [name]: value };

            if (name === 'university') {
                const university = value as UniversityName;
                const details = UNIVERSITY_DETAILS[university];
                newFormData.campus = details.campuses[0]; 
            }

            return newFormData;
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                 setFormData(prevData => {
                    if (!prevData) return prevData;
                    return { ...prevData, photo: event.target?.result as string };
                 });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await updateUser(formData);
            navigate('/profile');
        } catch(err) {
            setError('Falha ao atualizar o perfil. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 6) {
            setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem.');
            return;
        }

        setPasswordLoading(true);
        try {
            await changePassword(newPassword);
            setPasswordSuccess('Senha alterada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error(err);
             if (err.code === 'auth/requires-recent-login') {
                setPasswordError('Esta operação é sensível e requer autenticação recente. Por favor, faça login novamente e tente de novo.');
            } else {
                setPasswordError('Falha ao alterar a senha. Tente novamente.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const inputClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow";
    const selectClasses = `${inputClasses} appearance-none bg-white`;
    const labelClasses = "block text-sm font-medium text-gray-600 mb-1";

    return (
        <div className="flex-grow flex flex-col bg-gray-100">
            <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Editar Informações</h1>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-6">
                {/* Profile Info Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-lg shadow-md">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Dados Pessoais</h2>
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}

                    <div className="flex justify-center -mt-2 mb-6">
                        <div className="relative w-32 h-32">
                            <img 
                                src={formData.photo || 'https://i.imgur.com/V4RclNb.png'} 
                                alt="Profile" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" 
                            />
                            <label 
                                htmlFor="photo-upload" 
                                className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-2 shadow-md cursor-pointer hover:bg-blue-700 transition"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </label>
                            <input id="photo-upload" name="photo" type="file" className="sr-only" onChange={handlePhotoUpload} accept="image/*"/>
                        </div>
                    </div>
                    
                    <div>
                        <label className={labelClasses}>Login Institucional</label>
                        <input name="institutionalLogin" value={formData.institutionalLogin} onChange={handleInputChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className={labelClasses}>Nome Completo</label>
                        <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className={labelClasses}>RGM</label>
                        <input name="rgm" value={formData.rgm} onChange={handleInputChange} className={`${inputClasses}`} required />
                    </div>
                    <div>
                        <label className={labelClasses}>Seu Email (para login)</label>
                        <input name="email" value={formData.email} readOnly className={`${inputClasses} bg-gray-100`} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2 pt-4">Dados Acadêmicos</h2>
                     <div>
                        <label className={labelClasses}>Faculdade</label>
                        <div className="relative">
                            <select name="university" value={formData.university} onChange={handleInputChange} className={selectClasses} required>
                                {universityNames.map(uni => <option key={uni} value={uni}>{uni}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Curso</label>
                        <div className="relative">
                            <select name="course" value={formData.course} onChange={handleInputChange} className={selectClasses} required>
                                {COURSE_LIST.map(course => <option key={course} value={course}>{course}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                     <div>
                        <label className={labelClasses}>Campus</label>
                        <div className="relative">
                            <select name="campus" value={formData.campus} onChange={handleInputChange} className={selectClasses} required>
                                {UNIVERSITY_DETAILS[formData.university]?.campuses.map(campus => <option key={campus} value={campus}>{campus}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Validade</label>
                        <input name="validity" value={formData.validity} onChange={handleInputChange} className={`${inputClasses}`} required />
                    </div>
                    
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400">
                            {loading ? 'Atualizando...' : 'Salvar Informações'}
                        </button>
                    </div>
                </form>

                {/* Password Change Form */}
                <form onSubmit={handlePasswordChange} className="p-6 space-y-4 bg-white rounded-lg shadow-md">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Segurança</h2>
                    {passwordError && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 text-sm text-center bg-green-100 p-3 rounded-lg">{passwordSuccess}</p>}
                    
                    <div>
                        <label className={labelClasses}>Nova Senha</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div>
                        <label className={labelClasses}>Confirmar Nova Senha</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} />
                    </div>
                    <div className="pt-4">
                         <button type="submit" disabled={passwordLoading} className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400">
                            {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default EditProfile;
