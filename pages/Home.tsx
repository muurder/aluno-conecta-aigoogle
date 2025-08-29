
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COURSE_ICONS } from '../constants';
import { schedulesData, Schedule } from '../schedules';
import NotificationCarousel from '../components/NotificationCarousel';
import { 
    ArrowRightIcon, 
    MagnifyingGlassIcon, 
    BookOpenIcon, 
    DocumentTextIcon, 
    BanknotesIcon, 
    IdentificationIcon,
    CalendarDaysIcon,
    ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { ambientSubtitle } = useMemo(() => {
        if (!user?.course) return { ambientSubtitle: 'Acessar aulas online' };

        const courseSchedule = schedulesData.filter(item => item.disciplina === user.course);
        if (courseSchedule.length === 0) {
            return { ambientSubtitle: 'Nenhum horário cadastrado' };
        }

        const now = new Date();
        const todayIndex = now.getDay(); // Sunday: 0, Monday: 1, ...
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const dayNameMapping: Record<Schedule['dia_semana'], number> = {
            'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
        };

        const futureClasses = courseSchedule.filter(c => {
             const classDay = dayNameMapping[c.dia_semana];
             const dayDiff = (classDay - todayIndex + 7) % 7;
             if (dayDiff > 0) return true;
             if (dayDiff === 0 && c.inicio > currentTime) return true;
             return false;
        }).sort((a, b) => {
            const dayA = dayNameMapping[a.dia_semana];
            const dayB = dayNameMapping[b.dia_semana];
            const diffA = (dayA - todayIndex + 7) % 7;
            const diffB = (dayB - todayIndex + 7) % 7;
            if (diffA !== diffB) return diffA - diffB;
            return a.inicio.localeCompare(b.inicio);
        });

        if (futureClasses.length > 0) {
            const firstUpcoming = futureClasses[0];
            const isToday = dayNameMapping[firstUpcoming.dia_semana] === todayIndex;
            const prefix = isToday ? 'Próxima aula: Hoje' : `Próxima aula: ${firstUpcoming.dia_semana}`;
            return {
                ambientSubtitle: `${firstUpcoming.observacoes} - ${prefix} às ${firstUpcoming.inicio}`
            };
        }

        return { ambientSubtitle: 'Sem próximas aulas na semana' };
    }, [user]);

    const courseIcon = (user?.course && COURSE_ICONS[user.course]) || COURSE_ICONS["Default"];

    const ActionCard: React.FC<{
        title: string;
        subtitle: string;
        bgColor: string;
        textColor: string;
        icon: React.ReactNode;
        onClick?: () => void;
    }> = ({ title, subtitle, bgColor, textColor, icon, onClick }) => (
        <button 
            onClick={onClick} 
            className={`w-full p-4 rounded-2xl shadow-lg flex items-center justify-between transition-transform transform-gpu hover:scale-[1.02] hover:shadow-xl relative overflow-hidden`}
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full opacity-80 blur-sm"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-full">
                    {icon}
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm opacity-90 max-w-[200px] truncate">{subtitle}</p>
                </div>
            </div>
            <div className="relative z-10">
                <ArrowRightIcon className="w-6 h-6" />
            </div>
        </button>
    );

    const HelpItem: React.FC<{title: string, icon: React.ReactNode, onClick?: () => void}> = ({title, icon, onClick}) => (
        <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 p-3 bg-[var(--surface)] rounded-lg hover:bg-gray-100 transition w-full border border-gray-200">
            {icon}
            <span className="text-xs text-center text-[var(--muted)] font-medium">{title}</span>
        </button>
    );

    return (
        <div className="p-4 space-y-6">
            {/* Notifications Carousel */}
            <NotificationCarousel />

            {/* User Info Card */}
            <div className="bg-[var(--primary)] text-[var(--on-primary)] p-5 rounded-xl shadow-md relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold">{user?.course}</h2>
                    <div className="mt-4 inline-block bg-[var(--accent)] text-[var(--on-primary)] text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Cursando
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-white bg-white/20 rounded-full p-2">
                        {courseIcon}
                    </div>
                </div>
            </div>
            
            {/* Action Cards */}
            <div className="space-y-4">
                <ActionCard 
                    title="Ambiente virtual" 
                    subtitle={ambientSubtitle} 
                    bgColor="var(--secondary)" 
                    textColor="var(--on-secondary)"
                    icon={<ComputerDesktopIcon className="w-7 h-7" />}
                    onClick={() => navigate('/class-schedule')}
                />
                <ActionCard 
                    title="Horários de aulas" 
                    subtitle="Disciplinas, sala e professor" 
                    bgColor="var(--accent)" 
                    textColor="var(--on-primary)"
                    icon={<CalendarDaysIcon className="w-7 h-7" />}
                    onClick={() => navigate('/class-schedule')}
                />
            </div>

            {/* Help Center */}
            <div>
                <h3 className="font-bold text-[var(--muted)] mb-2 uppercase text-sm tracking-wider">Central de Ajuda</h3>
                <div className="relative">
                    <input type="text" placeholder="Procurar no app" className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-[var(--surface)]"/>
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <HelpItem title="Disciplinas e atividades" icon={<BookOpenIcon className="w-8 h-8 text-[var(--secondary)]"/>} onClick={() => navigate('/my-course')}/>
                    <HelpItem title="Emissão de documentos" icon={<DocumentTextIcon className="w-8 h-8 text-[var(--secondary)]"/>}/>
                    <HelpItem title="Carteirinha Virtual" icon={<IdentificationIcon className="w-8 h-8 text-[var(--secondary)]"/>} onClick={() => navigate('/virtual-id')} />
                    <HelpItem title="Financeiro" icon={<BanknotesIcon className="w-8 h-8 text-[var(--secondary)]" />} onClick={() => navigate('/financial')} />
                </div>
            </div>
        </div>
    );
};

export default Home;