
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRightIcon, MagnifyingGlassIcon, BookOpenIcon, DocumentTextIcon, BanknotesIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const ActionCard: React.FC<{title: string, subtitle: string, icon: React.ReactNode, bgColor: string, onClick?: () => void}> = ({ title, subtitle, icon, bgColor, onClick }) => (
        <button onClick={onClick} className={`w-full p-4 rounded-xl text-white shadow-lg flex items-center justify-between ${bgColor} transition-transform transform hover:scale-105`}>
            <div className="flex items-center">
                <div className="mr-4">{icon}</div>
                <div className="text-left">
                    <p className="text-sm">{subtitle}</p>
                    <h3 className="font-bold text-lg">{title}</h3>
                </div>
            </div>
            <ArrowRightIcon className="w-6 h-6" />
        </button>
    );

    const HelpItem: React.FC<{title: string, icon: React.ReactNode}> = ({title, icon}) => (
        <button className="flex flex-col items-center justify-center space-y-2 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition w-full">
            {icon}
            <span className="text-xs text-center text-gray-700">{title}</span>
        </button>
    );

    return (
        <div className="bg-gray-50 min-h-full p-4 space-y-6">
            <div className="bg-blue-800 text-white p-5 rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-700/50 rounded-full"></div>
                <h2 className="text-lg font-semibold">{user?.course}</h2>
                <p className="text-sm">RGM {user?.rgm}</p>
                <div className="mt-4 inline-block bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">
                    CURSANDO
                </div>
                <button className="absolute bottom-4 right-4 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                </button>
            </div>
            
            <div className="space-y-4">
                <ActionCard title="Ambiente virtual" subtitle="Acessar aulas online" icon={<ArrowTopRightOnSquareIcon className="w-8 h-8"/>} bgColor="bg-blue-600"/>
                <ActionCard title="Horários de aulas" subtitle="Disciplinas, sala e professor" icon={<ClockIcon className="w-8 h-8"/>} bgColor="bg-gradient-to-r from-green-400 to-teal-500"/>
            </div>

            <div>
                <h3 className="font-bold text-gray-700 mb-2">CENTRAL DE AJUDA</h3>
                <div className="relative">
                    <input type="text" placeholder="Procurar no app" className="w-full p-3 pl-10 border border-gray-300 rounded-lg"/>
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <HelpItem title="Disciplinas e atividades" icon={<BookOpenIcon className="w-8 h-8 text-teal-600"/>}/>
                    <HelpItem title="Emissão de documentos" icon={<DocumentTextIcon className="w-8 h-8 text-teal-600"/>}/>
                    <HelpItem title="Financeiro" icon={<BanknotesIcon className="w-8 h-8 text-teal-600" />} />
                    <HelpItem title="Financiamentos e bolsas" icon={<GlobeAltIcon className="w-8 h-8 text-teal-600" />} />
                </div>
            </div>
        </div>
    );
};

export default Home;
