import React from 'react';
import { NavLink } from 'https://esm.sh/react-router-dom@6.23.1?deps=react';
import { HomeIcon, AcademicCapIcon, BanknotesIcon, UserIcon } from 'https://esm.sh/@heroicons/react@2.1.3/24/solid?deps=react';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to} 
      end
      className={({ isActive }) => 
        `flex flex-col items-center justify-center w-full pt-2 pb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`
      }
    >
      {icon}
      <span className="text-xs">{label}</span>
    </NavLink>
  );
};

const BottomNav: React.FC = () => {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 
                 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} // notch iOS
    >
      <div className="mx-auto max-w-sm">
        <ul className="grid grid-cols-4 h-[64px] items-center">
          <li><NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Início" /></li>
          <li><NavItem to="/my-course" icon={<AcademicCapIcon className="w-6 h-6" />} label="Meu Curso" /></li>
          <li><NavItem to="/financial" icon={<BanknotesIcon className="w-6 h-6" />} label="Financeiro" /></li>
          <li><NavItem to="/profile" icon={<UserIcon className="w-6 h-6" />} label="Perfil" /></li>
        </ul>
      </div>
    </nav>
  );
};

export default BottomNav;