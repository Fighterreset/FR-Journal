import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const login = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "Belépés OK");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#252525] rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold  text-red-500">Fighter Reset - Journal </h1>
        <p className="text-gray-400 text-sm mt-1">
          Jelentkezz be a tőlem kapott adatokkal.
        </p>

        <div className="mt-5 space-y-3">
          <input
            className="w-full px-3 py-2 rounded-lg bg-[#0f0f0f] border border-[#333] text-white"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <input
            className="w-full px-3 py-2 rounded-lg bg-[#0f0f0f] border border-[#333] text-white"
            placeholder="Jelszó"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            className="w-full px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#333] text-white text-sm font-bold border border-[#333]"
            onClick={login}
          >
            Belépés
          </button>

          {msg && <p className="text-xs text-gray-300">{msg}</p>}

          <p className="text-[11px] text-gray-500">
            Ha nincs hozzáférésed, kérj belépési adatokat tőlem.
          </p>
        </div>
      </div>
    </div>
  );
}
