import { useState } from "react";
import { supabase } from "../lib/supabase";

// Ikonok komponensként (hogy ne kelljen külső libet telepíteni)
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false); // Új state a töltés jelzéséhez

  const login = async (e) => {
    e.preventDefault(); // Form submit esetén fontos
    setMsg("");
    setLoading(true); // Töltés indítása
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    setLoading(false); // Töltés vége
    setMsg(error ? error.message : "Sikeres belépés!");
  };

  return (
    // Háttér: Finom gradiens a sima fekete helyett, hogy mélysége legyen
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a0505] flex items-center justify-center px-4 font-sans">
      
      {/* Kártya: Backdrop blur effekt és finom keret */}
      <div className="w-full max-w-md bg-[#161616]/90 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Dekoratív elem: Felső piros fény (glow) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] rounded-b-full"></div>

        {/* --- Fejléc --- */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
             {/* Logo enyhe lebegéssel hoverkor */}
            <img 
              src="https://fighterreset.hu/wp-content/uploads/2025/10/fighterreset-logo.png" 
              alt="Fighter Reset Logo"
              className="h-14 w-auto mb-4 drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-white tracking-wide text-center">
            Fighter Reset <span className="text-red-600">Journal</span>
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1 tracking-wide uppercase text-[10px] letter-spacing-[2px]">
            Önellenőrzési napló
          </p>
        </div>

        {/* --- Form --- */}
        <form onSubmit={login} className="space-y-5">
          
          {/* Email Mező */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <MailIcon />
            </div>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 
              focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
              placeholder="Email cím"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              type="email"
            />
          </div>

          {/* Jelszó Mező */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-red-500 transition-colors">
              <LockIcon />
            </div>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] text-gray-100 placeholder-gray-600 
              focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200"
              placeholder="Jelszó"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {/* Hibaüzenet (dinamikus megjelenés) */}
          {msg && (
            <div className={`text-center text-xs p-2 rounded border ${msg === "Sikeres belépés!" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              {msg}
            </div>
          )}

          {/* Gomb: Piros gradiens, hover effektek */}
          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-white font-bold text-sm tracking-wide shadow-lg 
            hover:shadow-red-600/20 hover:from-red-600 hover:to-red-500 active:scale-[0.98] transition-all duration-200 
            disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 border border-red-500/30"
            type="submit"
          >
            {loading ? (
               // Egyszerű spinner
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
              "BELÉPÉS"
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-[11px] text-gray-500">
              Nincs fiókod? Kérj hozzáférést az edződtől.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
