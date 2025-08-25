
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, UniversityName } from '../types';
import { universityNames } from '../types';
import { COURSE_LIST, UNIVERSITY_DETAILS } from '../constants';
import { ArrowLeftIcon, CameraIcon } from '@heroicons/react/24/solid';

const EditProfile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState<User>(user as User);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === 'university') {
            const university = value as UniversityName;
            const details = UNIVERSITY_DETAILS[university];
            newFormData.campus = details.campuses[0]; // Default to first campus
            newFormData.email = `${newFormData.login}@${details.domain}`;
        }

        if(name === 'login' && newFormData.university) {
            const details = UNIVERSITY_DETAILS[newFormData.university as UniversityName];
            newFormData.email = `${value}@${details.domain}`;
        }
        
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
        if (!user) {
            setError('Usuário não autenticado.');
            return;
        }
        try {
            updateUser(formData, user.login);
            navigate('/profile');
        } catch(err) {
            setError('Falha ao atualizar o perfil. Tente novamente.');
        }
    };

    return (
        <div className="min-h-full flex flex-col bg-gray-50">
            <header className="p-4 flex items-center text-gray-700 bg-white shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Editar Informações</h1>
            </header>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-grow">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}

                <div className="flex flex-col items-center space-y-2">
                     <div className="relative w-28 h-28 mx-auto">
                        <img src={formData.photo || 'https://picsum.photos/200'} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg" />
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
                    <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">RGM</label>
                    <input name="rgm" value={formData.rgm} onChange={handleInputChange} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">E-mail</label>
                    <input name="email" value={formData.email} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100" />
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
                    <input name="validity" value={formData.validity} readOnly className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
                
                <div className="pt-4 sticky bottom-0 bg-gray-50 pb-4">
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700">Atualizar Informações</button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
