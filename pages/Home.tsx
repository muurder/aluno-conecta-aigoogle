
import React, { useMemo, useState, useEffect } from 'react';
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
    ArrowDownTrayIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { db, auth } from '../firebase';
import { Capacitor } from '@capacitor/core';

const Home: React.FC = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [apkVisibility, setApkVisibility] = useState<'all' | 'android' | 'ios' | 'none'>('all');
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);

    const handleSaveUsername = async () => {
        if (!user) return;
        const cleaned = newUsername.trim().toLowerCase();
        if (cleaned.length < 3) {
            setModalError('O nome de usuário deve ter pelo menos 3 caracteres.');
            return;
        }

        setSavingUsername(true);
        setModalError('');
        try {
            // Check if username is already in use
            const usernameQuery = await db.collection('profiles')
                .where('username', '==', cleaned)
                .limit(1)
                .get();

            if (!usernameQuery.empty) {
                setModalError('Este nome de usuário já está em uso. Escolha outro.');
                setSavingUsername(false);
                return;
            }

            // Update password in Firebase Auth if provided
            if (newPassword.trim() !== '') {
                if (newPassword.length < 6) {
                    setModalError('A senha deve ter pelo menos 6 caracteres.');
                    setSavingUsername(false);
                    return;
                }
                const authUser = auth.currentUser;
                if (authUser) {
                    await authUser.updatePassword(newPassword);
                }
            }

            // Save username to Firestore
            await updateUser(user.uid, { username: cleaned });
            setShowUsernameModal(false);
        } catch (err: any) {
            console.error("Error saving username/password:", err);
            if (err.code === 'auth/requires-recent-login') {
                setModalError('Por segurança, para definir uma senha, você precisa ter feito login recentemente. Faça logout e login novamente para definir.');
            } else {
                setModalError('Erro ao atualizar cadastro. Tente novamente.');
            }
        } finally {
            setSavingUsername(false);
        }
    };

    useEffect(() => {
        const unsub = db.collection('configs').doc('app').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data && typeof data.apkVisibility === 'string') {
                    setApkVisibility(data.apkVisibility as any);
                }
            }
        }, err => {
            console.error("Error loading app config:", err);
        });
        return () => unsub();
    }, []);

    const shouldShowApk = useMemo(() => {
        if (apkVisibility === 'none') return false;
        if (apkVisibility === 'all') return true;

        const isAndroid = Capacitor.getPlatform() === 'android' || /Android/i.test(navigator.userAgent);
        const isIOS = Capacitor.getPlatform() === 'ios' || /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (apkVisibility === 'android') return isAndroid;
        if (apkVisibility === 'ios') return isIOS;
        return true;
    }, [apkVisibility]);

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

            {/* Create Username Banner */}
            {user && !user.username && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-[pulse_3s_infinite]">
                    <div className="flex gap-3 text-left">
                        <div className="bg-yellow-100 p-2.5 rounded-full text-yellow-800 shrink-0 self-start">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-yellow-900 text-sm">Crie seu nome de usuário!</h4>
                            <p className="text-xs text-yellow-800 mt-0.5 font-medium">Defina um nome de usuário (@) para fazer login de forma rápida sem precisar de e-mail.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setNewUsername('');
                            setNewPassword('');
                            setModalError('');
                            setShowUsernameModal(true);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition self-end sm:self-center uppercase tracking-wider shrink-0"
                    >
                        Criar @usuário
                    </button>
                </div>
            )}

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
                {shouldShowApk && (
                    <ActionCard 
                        title="Aplicativo Android" 
                        subtitle="Baixar o app oficial (.APK)" 
                        bgColor="#0f172a" 
                        textColor="#ffffff"
                        icon={<ArrowDownTrayIcon className="w-7 h-7" />}
                        onClick={() => {
                            window.open('https://github.com/muurder/aluno-conecta-aigoogle/releases/download/latest/portal-do-estudante.apk', '_blank');
                        }}
                    />
                )}
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

            {/* Create Username Modal */}
            {showUsernameModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm relative text-left animate-[scaleUp_0.2s_ease-out]">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Escolha seu @usuário</h3>
                        <p className="text-gray-500 text-xs mb-4">Escolha um nome simples e único. Você poderá usar este nome ou seu e-mail para logar no portal.</p>
                        
                        {modalError && (
                            <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                {modalError}
                            </div>
                        )}

                        <div className="relative mb-4">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold">@</span>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => {
                                    setModalError('');
                                    setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                                }}
                                placeholder="nome.sobrenome"
                                className="pl-8 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition text-gray-800"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase text-left">Senha de acesso rápido (opcional)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setModalError('');
                                    setNewPassword(e.target.value);
                                }}
                                placeholder="Defina uma senha (mín. 6 caracteres)"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition text-gray-800"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUsernameModal(false)}
                                className="w-1/2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                                disabled={savingUsername}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUsername}
                                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                                disabled={savingUsername || !newUsername}
                            >
                                {savingUsername ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    'Confirmar'
                                )}
                            </button>
                        </div>
                    </div>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes scaleUp {
                            from { opacity: 0; transform: scale(0.95); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default Home;