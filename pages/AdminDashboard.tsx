
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { getAllUsers, deleteUser, updateUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="min-h-full flex flex-col bg-gray-50">
            <header className="p-4 flex items-center text-gray-700 bg-white shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate('/profile')} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Admin Dashboard</h1>
            </header>

            <main className="flex-grow p-4 space-y-3">
                {loading ? (
                    <p className="text-center text-gray-500 mt-8">Carregando usuários...</p>
                ) : users.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8">Nenhum usuário para gerenciar.</p>
                ) : (
                    users.map(user => (
                        <div key={user.uid} className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                            <div>
                                <h2 className="font-bold text-gray-800">{user.fullName}</h2>
                                <p className="text-sm text-gray-500">{user.institutionalLogin} ({user.email})</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <StatusBadge status={user.status} />
                                <div className="flex items-center space-x-1">
                                    {user.status === 'pending' && (
                                        <button onClick={() => handleApprove(user)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Aprovar">
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                    <button onClick={() => navigate(`/admin/edit-user/${user.uid}`)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="Editar">
                                        <PencilIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => handleReprove(user)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Reprovar/Excluir">
                                        <TrashIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;