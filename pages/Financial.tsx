
import React from 'react';
import { BanknotesIcon } from 'https://esm.sh/@heroicons/react@2.1.3/24/outline?deps=react';

const Financial: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-8">
            <BanknotesIcon className="w-24 h-24 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-700">Financeiro</h1>
            <p className="text-gray-500 mt-2">A área financeira está sendo preparada. Em breve você poderá consultar seus boletos e pagamentos aqui.</p>
        </div>
    );
};

export default Financial;