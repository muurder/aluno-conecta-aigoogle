
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentIdCard from '../components/StudentIdCard';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const VirtualIdCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');

  const QRCodePlaceholder: React.FC = () => (
    <div className="w-full max-w-sm mx-auto p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(user))}`} alt="QR Code" />
        </div>
        <p className="mt-4 text-gray-600 text-center">Apresente este código QR para identificação.</p>
    </div>
  );
  
  return (
    <div className="min-h-full flex flex-col bg-gray-50">
        <header className="p-4 flex items-center justify-between text-gray-700">
            <button onClick={() => navigate(-1)} className="mr-4">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2">Carteirinha Virtual</h1>
            <button className="text-gray-500">
                <ArrowPathIcon className="w-6 h-6" />
            </button>
        </header>

        <div className="p-4">
            <div className="flex justify-center bg-gray-200/70 rounded-full p-1">
                <button
                    onClick={() => setActiveTab('card')}
                    className={`w-1/2 py-2 rounded-full font-semibold transition text-sm ${activeTab === 'card' ? 'bg-white shadow text-blue-800' : 'text-gray-600'}`}
                >
                    Carteirinha
                </button>
                <button
                    onClick={() => setActiveTab('qr')}
                    className={`w-1/2 py-2 rounded-full font-semibold transition text-sm ${activeTab === 'qr' ? 'bg-white shadow text-blue-800' : 'text-gray-600'}`}
                >
                    Código QR
                </button>
            </div>
        </div>

        <main className="flex-grow flex items-center justify-center p-4">
            {activeTab === 'card' ? (
                <StudentIdCard user={user || {}} />
            ) : (
                <QRCodePlaceholder />
            )}
        </main>
        
        <footer className="p-6">
            <button className="w-full bg-blue-900 text-white font-bold p-4 rounded-lg hover:bg-blue-800 shadow-lg">
                Solicitar carteirinha física
            </button>
        </footer>
    </div>
  );
};

export default VirtualIdCard;