
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid';

// --- Data Generation ---
// This section simulates fetching financial data.
// In a real app, this would come from an API.

type Status = 'Pago' | 'Em aberto' | 'Vencido';

interface Boleto {
  id: string;
  month: string;
  year: number;
  dueDate: string;
  amount: string;
  status: Status;
}

// A simple seeded random number generator for consistent daily data
const seededRandom = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
};

// Generate financial data based on the current date
const generateFinancialData = (): Boleto[] => {
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const data: Boleto[] = [];

  for (let i = 0; i < 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 15);
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const randomFactor = seededRandom(daySeed + i);
    
    let status: Status;
    if (i === 0) { // Current month
      status = randomFactor > 0.6 ? 'Pago' : 'Em aberto';
    } else if (i === 1) { // Last month
      status = randomFactor > 0.3 ? 'Pago' : 'Vencido';
    } else { // Older months
      status = 'Pago';
    }

    const amount = (750 + randomFactor * 100).toFixed(2).replace('.', ',');

    data.push({
      id: `boleto-${year}-${month}`,
      month,
      year,
      dueDate: `10/${(date.getMonth() + 1).toString().padStart(2, '0')}/${year}`,
      amount: `R$ ${amount}`,
      status,
    });
  }
  return data.reverse(); // Show oldest first
};

const financialData = generateFinancialData();
const currentBoleto = financialData.find(b => b.year === new Date().getFullYear() && b.month === new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())) || financialData[financialData.length - 1];

// --- Components ---

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
    const styles: Record<Status, string> = {
        'Pago': 'bg-green-100 text-green-800',
        'Em aberto': 'bg-blue-100 text-blue-800',
        'Vencido': 'bg-red-100 text-red-800',
    };
    return <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status}</span>;
};

const CurrentBillCard: React.FC<{ boleto: Boleto }> = ({ boleto }) => {
    const statusInfo: Record<Status, { icon: React.ReactNode; text: string; color: string }> = {
        'Pago': { icon: <CheckCircleIcon className="w-8 h-8"/>, text: 'Sua mensalidade está em dia!', color: 'text-green-500' },
        'Em aberto': { icon: <ClockIcon className="w-8 h-8"/>, text: 'Aguardando pagamento', color: 'text-blue-500' },
        'Vencido': { icon: <ExclamationCircleIcon className="w-8 h-8"/>, text: 'Mensalidade vencida', color: 'text-red-500' },
    };
    const info = statusInfo[boleto.status];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${info.color} bg-opacity-10 ${info.color.replace('text', 'bg').replace('-500', '-100')}`}>
                {info.icon}
            </div>
            <p className="text-gray-500 mt-4">Mensalidade de {boleto.month}</p>
            <p className="text-4xl font-bold text-gray-800 my-1">{boleto.amount}</p>
            <p className={`font-semibold ${info.color}`}>{info.text}</p>
            <p className="text-sm text-gray-500 mt-2">Vencimento em {boleto.dueDate}</p>
            {boleto.status !== 'Pago' && (
                <button className="mt-6 w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <DocumentDuplicateIcon className="w-5 h-5"/>
                    Copiar código de barras
                </button>
            )}
        </div>
    );
};

const HistoryItem: React.FC<{ boleto: Boleto }> = ({ boleto }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
        <div>
            <p className="font-semibold text-gray-800">Mensalidade - {boleto.month}</p>
            <p className="text-sm text-gray-500">Venceu em {boleto.dueDate}</p>
        </div>
        <div className="text-right">
             <p className="font-bold text-gray-800">{boleto.amount}</p>
             <StatusBadge status={boleto.status} />
        </div>
    </div>
);


const Financial: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen bg-gray-50">
             <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Financeiro</h1>
            </header>

            <main className="flex-grow p-4 overflow-y-auto space-y-6">
                {currentBoleto && <CurrentBillCard boleto={currentBoleto} />}
                
                <div>
                    <h2 className="text-lg font-bold text-gray-700 mb-3">Histórico de Pagamentos</h2>
                    <div className="space-y-3">
                        {financialData
                            .filter(b => b.id !== currentBoleto?.id)
                            .map(boleto => <HistoryItem key={boleto.id} boleto={boleto} />)
                        }
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Financial;