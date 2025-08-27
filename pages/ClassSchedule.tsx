
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { schedulesData, Schedule } from '../schedules';
import { ArrowLeftIcon, ClockIcon, UserIcon, MapPinIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const ClassSchedule: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const userSchedule = useMemo(() => {
        if (!user) return [];
        // The provided data maps the course name to the 'disciplina' field.
        return schedulesData.filter(item => item.disciplina === user.course);
    }, [user]);

    const groupedSchedule = useMemo(() => {
        const groups: { [key: string]: Schedule[] } = {
            'Segunda': [], 'Terça': [], 'Quarta': [], 'Quinta': [], 'Sexta': [], 'Sábado': []
        };
        userSchedule.forEach(item => {
            if (groups[item.dia_semana]) {
                groups[item.dia_semana].push(item);
            }
        });
        // Sort classes within each day by start time
        for (const day in groups) {
            groups[day].sort((a, b) => a.inicio.localeCompare(b.inicio));
        }
        return groups;
    }, [userSchedule]);

    const dayOrder: (keyof typeof groupedSchedule)[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Horário de Aulas</h1>
            </header>

            <main className="flex-grow p-4 overflow-y-auto space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-blue-800">{user?.course}</h2>
                    <p className="text-gray-500">{user?.campus}</p>
                </div>

                {userSchedule.length === 0 ? (
                    <div className="text-center py-10">
                        <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-700">Nenhum horário encontrado</h3>
                        <p className="text-gray-500 mt-1">Não há horários de aula cadastrados para o seu curso no momento.</p>
                    </div>
                ) : (
                    dayOrder.map(day => (
                        groupedSchedule[day].length > 0 && (
                            <div key={day}>
                                <h3 className="font-bold text-lg text-gray-700 mb-3">{day}-feira</h3>
                                <div className="space-y-4">
                                    {groupedSchedule[day].map((item, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-l-4 border-blue-500">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-base text-gray-800 flex-1">{item.observacoes}</h4>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                                    <ClockIcon className="w-4 h-4" />
                                                    <span>{item.inicio} - {item.fim}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <p className="flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                    {item.professor}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                                                    {`Sala ${item.sala}, ${item.bloco}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                )}
            </main>
        </div>
    );
};

export default ClassSchedule;
