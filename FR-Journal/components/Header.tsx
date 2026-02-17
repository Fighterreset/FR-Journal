
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-red-900/30 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4 max-w-7xl">
        <Link to="/" className="flex items-center group transition-transform hover:scale-[1.02] active:scale-[0.98]">
          {/* Logo container - A logó most már a teljes márkajelzést tartalmazza */}
          <div className="relative h-14 sm:h-16 flex items-center">
             <img 
               src="logo.png" 
               alt="Fighter Reset" 
               className="h-full w-auto object-contain"
               onError={(e) => {
                 // Fallback ha a logo.png nem található - egy letisztultabb ikonra váltunk
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = `
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center font-black text-xl italic text-white shadow-lg shadow-red-900/50">FR</div>
                    <div class="flex flex-col">
                      <span class="text-white font-black tracking-tighter leading-none uppercase">Fighter Reset</span>
                      <span class="text-[10px] text-red-600 font-bold tracking-widest uppercase">8 HETES PROGRAM</span>
                    </div>
                  </div>
                 `;
               }}
             />
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-xs sm:text-sm font-black uppercase tracking-[0.2em] italic transition-all ${
              isHome 
                ? 'text-red-500 border-b-2 border-red-600 pb-1' 
                : 'text-gray-500 hover:text-white pb-1 border-b-2 border-transparent hover:border-red-900/50'
            }`}
          >
            Főoldal
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
