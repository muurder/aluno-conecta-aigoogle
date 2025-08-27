import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CheckCircleIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import BottomNav from '../components/BottomNav';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { getAllUsers, deleteUser, updateUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers.filter(u => !u.isAdmin));
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [getAllUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return users;
        }
        return users.filter(user =>
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.institutionalLogin.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleApprove = async (user: User) => {
        await updateUser({ ...user, status: 'approved' });
        fetchUsers();
    };

    const handleReprove = async (user: User) => {
        if (window.confirm(`Tem certeza que deseja reprovar (excluir) o usuário ${user.institutionalLogin}? Esta ação não pode ser desfeita.`)) {
            await deleteUser(user.uid);
            fetchUsers();
        }
    };

    const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
        const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
        if (status === 'approved') {
            return <span className={`${baseClasses} bg-green-100 text-green-800`}>Aprovado</span>;
        }
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pendente</span>;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="p-4 bg-white shadow-sm sticky top-0 z-10 border-b">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => navigate('/profile')} className="mr-4 p-1 rounded-full hover:bg-gray-100">
                            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 className="font-semibold text-lg text-gray-800">Admin Dashboard</h1>
                    </div>
                    <button onClick={fetchUsers} disabled={loading} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-wait">
                        <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                 <div className="relative mt-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome, email, login..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </header>

            <main className="flex-grow p-4 overflow-y-auto pb-24">
                {loading ? (
                    <p className="text-center text-gray-500 mt-8">Carregando usuários...</p>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8">
                        {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário para gerenciar.'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredUsers.map(user => (
                            <div key={user.uid} className="bg-white p-4 rounded-lg shadow-md border flex flex-col">
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
                                        alt={user.fullName} 
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold text-gray-800 truncate">{user.fullName}</h2>
                                        <p className="text-sm text-gray-500 truncate">{user.institutionalLogin}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        <div className="mt-2">
                                            <StatusBadge status={user.status} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-gray-100">
                                    {user.status === 'pending' && (
                                        <button onClick={() => handleApprove(user)} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Aprovar">
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                    <button onClick={() => navigate(`/admin/edit-user/${user.uid}`)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Editar">
                                        <PencilIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => handleReprove(user)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Reprovar/Excluir">
                                        <TrashIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default AdminDashboard;