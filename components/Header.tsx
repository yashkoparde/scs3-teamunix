
import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardNavIcon, AdminNavIcon } from './index';

const Header: React.FC = () => {
  const linkStyle = "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-200 text-sm font-medium";
  const activeLinkStyle = "bg-teal-500 text-white";
  const inactiveLinkStyle = "text-slate-300 hover:bg-slate-700";

  return (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white tracking-tight"><b>AURA</b></h1>
          </div>
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg">
            <NavLink 
              to="/" 
              className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
            >
              <DashboardNavIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
            >
               <AdminNavIcon className="w-5 h-5" />
              <span>Admin</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;