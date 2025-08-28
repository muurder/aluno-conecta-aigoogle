

import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, ChatBubbleOvalLeftEllipsisIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; badgeCount?: number }> = ({ to, icon, label, badgeCount }) => {
  return (
    <NavLink
      to={to}
      // FIX: Use `end` prop for v6 NavLink to replicate v5 `exact` behavior.
      end
      // FIX: Use a function for `className` for v6 NavLink styling, replacing `activeClassName`.
      className={({ isActive }) =>
        "flex flex-col items-center justify-center w-full pt-2 pb-1 " +
        (isActive ? "text-blue-600" : "text-gray-500")
      }
    >
      <div className="relative">
        {icon}
        {badgeCount && badgeCount > 0 && (
          <span className="absolute -top-1 -right-2 block h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center ring-2 ring-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </div>
      <span className="text-xs">{label}</span>
    </NavLink>
  );
};

const BottomNav: React.FC = () => {
  const { unreadChatCount } = useAuth();
  
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 
                 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} // notch iOS
    >
      <div className="mx-auto max-w-sm">
        <ul className="grid grid-cols-4 h-[64px] items-center">
          <li><NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Início" /></li>
          <li><NavItem to="/my-course" icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />} label="Chat" badgeCount={unreadChatCount} /></li>
          <li><NavItem to="/financial" icon={<BanknotesIcon className="w-6 h-6" />} label="Financeiro" /></li>
          <li><NavItem to="/profile" icon={<UserIcon className="w-6 h-6" />} label="Perfil" /></li>
        </ul>
      </div>
    </nav>
  );
};

export default BottomNav;