import React, { useState } from 'react';
import { Page } from '../types';
import { Bars3Icon, XMarkIcon } from './icons';

interface NavbarProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  currentPage: Page;
}

const NavItem: React.FC<{
    page: Page;
    currentPage: Page;
    onClick: (page: Page) => void;
    children: React.ReactNode
}> = ({ page, currentPage, onClick, children }) => {
    const isActive = page === currentPage;
    return (
        <button
            onClick={() => onClick(page)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                ? 'bg-teal-600 text-white' 
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onLogout, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navPages: Page[] = [Page.Dashboard, Page.Learning, Page.Calendar, Page.Study, Page.Profile];

  return (
    <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-white font-bold text-xl">
              Study<span className="text-teal-400">Genius</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navPages.map(page => (
                    <NavItem key={page} page={page} currentPage={currentPage} onClick={onNavigate}>
                        {page.charAt(0).toUpperCase() + page.slice(1).toLowerCase()}
                    </NavItem>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <button
              onClick={onLogout}
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="flex md:hidden">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state. */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             {navPages.map(page => (
                <button
                    key={page}
                    onClick={() => { onNavigate(page); setIsMenuOpen(false); }}
                    className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        currentPage === page ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {page.charAt(0).toUpperCase() + page.slice(1).toLowerCase()}
                </button>
             ))}
             <button
                onClick={() => { onLogout(); setIsMenuOpen(false); }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            >
                Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
