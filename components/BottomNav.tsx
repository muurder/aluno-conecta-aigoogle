
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, AcademicCapIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/solid';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-500";
  
  return (
    <NavLink to={to} className={({ isActive }) => `${isActive ? activeClass : inactiveClass} flex flex-col items-center justify-center w-full pt-2 pb-1`}>
      {icon}
      <span className="text-xs">{label}</span>
    </NavLink>
  );
};

const BottomNav: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 shadow-md">
      <nav className="flex justify-around items-center h-16">
        <NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Início" />
        <NavItem to="/my-course" icon={<AcademicCapIcon className="w-6 h-6" />} label="Meu Curso" />
        <NavItem to="/financial" icon={<BanknotesIcon className="w-6 h-6" />} label="Financeiro" />
        <NavItem to="/profile" icon={<UserIcon className="w-6 h-6" />} label="Perfil" />
      </nav>
    </footer>
  );
};

export default BottomNav;
