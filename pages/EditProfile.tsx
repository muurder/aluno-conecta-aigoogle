
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS } from '../constants';
import { ArrowLeftIcon, CameraIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const EditProfile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    
    if (!user) {
        navigate('/login');
        return null;
    }
    
    const [formData, setFormData] = useState<User>(user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            if ((name === 'login' || name === 'university') && newFormData.login && newFormData.university) {
                const universityDetails = UNIVERSITY_DETAILS[newFormData.university as UniversityName];
                // Note: Changing the email requires re-authentication or a backend function in production
                // For this app, we'll allow it, but it won't update the Firebase Auth email.
                newFormData.email = `${newFormData.login.toLowerCase().replace(/\s/g, '')}@${universityDetails.domain}`;
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

    const inputClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow";
    const selectClasses = `${inputClasses} appearance-none bg-white`;
    const labelClasses = "block text-sm font-medium text-gray-600 mb-1";

    return (
        <div className="min-h-full flex flex-col bg-white">
            <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Editar Informações</h1>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-grow overflow-y-auto">
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
                    <label className={labelClasses}>Login</label>
                    <input name="login" value={formData.login} onChange={handleInputChange} className={inputClasses} required />
                </div>
                 <div>
                    <label className={labelClasses}>Nome Completo</label>
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={inputClasses} required />
                </div>
                <div>
                    <label className={labelClasses}>RGM</label>
                     <div className="relative">
                        <input name="rgm" value={formData.rgm} onChange={handleInputChange} className={`${inputClasses} pr-10`} required />
                        <button type="button" onClick={() => {}} className="absolute inset-y-0 right-2 my-auto flex items-center text-gray-500 hover:text-blue-600">
                           <ArrowPathIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
                <div>
                    <label className={labelClasses}>E-mail</label>
                    <input name="email" value={formData.email} readOnly className={`${inputClasses} bg-gray-100`} />
                </div>
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
                            {UNIVERSITY_DETAILS[formData.university].campuses.map(campus => <option key={campus} value={campus}>{campus}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                <div>
                    <label className={labelClasses}>Validade</label>
                    <div className="relative">
                        <input name="validity" value={formData.validity} onChange={handleInputChange} className={`${inputClasses} pr-10`} required />
                        <button type="button" onClick={() => {}} className="absolute inset-y-0 right-2 my-auto flex items-center text-gray-500 hover:text-blue-600">
                           <ArrowPathIcon className="h-5 w-5"/>
                        </button>
                    </div>
                </div>
                
                <div className="pt-4 sticky bottom-0 bg-white pb-2">
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400">
                        {loading ? 'Atualizando...' : 'Atualizar Informações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;