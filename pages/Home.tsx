import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRightIcon, MagnifyingGlassIcon, BookOpenIcon, DocumentTextIcon, BanknotesIcon, GlobeAltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const ActionCard: React.FC<{title: string, subtitle: string, bgColor: string, onClick?: () => void}> = ({ title, subtitle, bgColor, onClick }) => (
        <button onClick={onClick} className={`w-full p-4 rounded-xl text-white shadow-lg flex items-center justify-between ${bgColor} transition-transform transform hover:scale-105`}>
            <div className="flex items-center">
                <div className="text-left">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm opacity-90">{subtitle}</p>
                </div>
            </div>
            <ArrowRightIcon className="w-6 h-6" />
        </button>
    );

    const HelpItem: React.FC<{title: string, icon: React.ReactNode}> = ({title, icon}) => (
        <button className="flex flex-col items-center justify-center space-y-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition w-full shadow-sm border border-gray-200">
            {icon}
            <span className="text-xs text-center text-gray-700 font-medium">{title}</span>
        </button>
    );

    return (
        <div className="bg-gray-50 min-h-full p-4 space-y-6">
            <div className="bg-blue-900 text-white p-5 rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-800/50 rounded-full"></div>
                <div className="relative z-10">
                    <h2 className="text-lg font-semibold">{user?.course}</h2>
                    <p className="text-sm opacity-80">RGM {user?.rgm}</p>
                    <div className="mt-4 inline-block bg-cyan-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Cursando
                    </div>
                    <button className="absolute bottom-0 right-0 text-white hover:text-cyan-300">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            <div className="space-y-4">
                <ActionCard title="Ambiente virtual" subtitle="Acessar aulas online" bgColor="bg-blue-800"/>
                <ActionCard title="Horários de aulas" subtitle="Disciplinas, sala e professor" bgColor="bg-gradient-to-r from-green-500 to-teal-600"/>
            </div>

            <div>
                <h3 className="font-bold text-gray-700 mb-2 uppercase text-sm">Central de Ajuda</h3>
                <div className="relative">
                    <input type="text" placeholder="Procurar no app" className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white shadow-sm"/>
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
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