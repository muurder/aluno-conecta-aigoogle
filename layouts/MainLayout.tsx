
import React from 'react';
import BottomNav from '../components/BottomNav';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* The main content area now grows and is scrollable. 
          The BottomNav will occupy its own space at the bottom thanks to flexbox. */}
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;