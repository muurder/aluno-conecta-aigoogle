
import React from 'react';
import BottomNav from '../components/BottomNav';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* The main content area now grows and is scrollable. 
          Padding bottom (pb-20) is added to ensure content at the bottom isn't hidden by the BottomNav. */}
      <main className="flex-grow overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
