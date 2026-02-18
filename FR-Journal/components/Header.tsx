import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  // State a kép betöltési hiba kezelésére (az innerHTML helyett ez a React-os megoldás)
  const [logoError, setLogoError] = useState(false);

  return (
    // Sticky header sötét háttérrel, blur effekttel és finom alsó kerettel
    <header className="sticky top-0 z-50 w-full bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/5">
      
      {/* Opcionális: Felső vékony piros fénycsík a kerethez */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-900/50 to-transparent"></div>

      <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-7xl">
        
        {/* --- LOGO SZEKCIÓ --- */}
        <Link 
          to="/" 
          className="group relative flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="relative h-12 sm:h-14 flex items-center">
            {!logoError ? (
              <img 
                src="https://fighterreset.hu/wp-content/uploads/2025/10/fighterreset-logo.png" 
                alt="Fighter Reset" 
                className="h-full w-auto object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                onError={() => setLogoError(true)}
              />
            ) : (
              // Fallback UI (ha a kép nem tölt be) - React komponensként
              <div className="flex items-center gap-3 animate-in fade-in">
                <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20 border border-red-500/20">
                  <span className="font-black text-white italic text-lg leading-none pt-1 pr-1">FR</span>
                </div>
                <div className="hidden sm:flex flex-col justify-center">
                  <span className="text-white font-black tracking-tighter leading-none uppercase text-lg">
                    Fighter Reset
                  </span>
                  <span className="text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase opacity-80">
                    Journal
                  </span>
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* --- NAVIGÁCIÓ --- */}
        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`relative px-3 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-300 group ${
              isHome 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Főoldal
            
            {/* Animált aláhúzás */}
            <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-red-600 rounded-full transform transition-transform duration-300 origin-left ${
              isHome ? 'scale-x-100 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'scale-x-0 group-hover:scale-x-50'
            }`}></span>
          </Link>
          
          {/*.*/}
        </nav>
      </div>
    </header>
  );
};

export default Header;
