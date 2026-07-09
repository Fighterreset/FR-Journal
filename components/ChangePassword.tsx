import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext"; // Ha be akarod kötni a fordítást

const ChangePassword = () => {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // 1. Alapvető ellenőrzések
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Az új jelszavak nem egyeznek!", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: "Az új jelszónak legalább 6 karakternek kell lennie!", type: "error" });
      return;
    }

    setLoading(true);

    try {
      // 2. Szerezzük meg a jelenlegi felhasználó email címét
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("Nem található bejelentkezett felhasználó.");
      }

      // 3. TRÜKK: Ellenőrizzük a régi jelszót egy teszt bejelentkezéssel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("A jelenlegi jelszó helytelen!");
      }

      // 4. Ha a régi jelszó jó, frissítjük az újra
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error("Hiba történt a jelszó frissítésekor.");
      }

      // SIKER!
      setMessage({ text: "A jelszó sikeresen megváltozott!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-300 mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-600 rounded-full"></span>
        Jelszó megváltoztatása
      </h2>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Jelenlegi jelszó</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Új jelszó</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Új jelszó megerősítése</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            required
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-900/20 text-red-500 border border-red-900/50' : 'bg-green-900/20 text-green-500 border border-green-900/50'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? "Feldolgozás..." : "Jelszó módosítása"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;