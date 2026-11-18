import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

type Props = { userId: string };

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,31}$/;

export default function ProfileSettings({ userId }: Props) {
  const { language } = useLanguage();
  const [username, setUsername] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const copy = language === "hu"
    ? {
        title: "Profilbeállítások",
        label: "Felhasználónév",
        help: "Ezzel a névvel tudsz belépni. Kisbetű, szám, pont, kötőjel és aláhúzás használható (maximum 32 karakter).",
        save: "Felhasználónév mentése",
        loading: "Profil betöltése...",
        saved: "A felhasználónév sikeresen módosult.",
        invalid: "A felhasználónév 1–32 karakter lehet, és csak kisbetűt, számot, pontot, kötőjelet vagy aláhúzást tartalmazhat. Betűvel vagy számmal kezdődjön.",
        unavailable: "Nem sikerült betölteni a profilt.",
        duplicate: "Ezt a felhasználónevet már más használja. Válassz másikat.",
        saveError: "Nem sikerült elmenteni a felhasználónevet.",
      }
    : {
        title: "Profile settings",
        label: "Username",
        help: "Use this name to sign in. Lowercase letters, numbers, dots, hyphens and underscores are allowed (maximum 32 characters).",
        save: "Save username",
        loading: "Loading profile...",
        saved: "Username updated successfully.",
        invalid: "Username must be 1–32 characters, use lowercase letters, numbers, dots, hyphens or underscores, and start with a letter or number.",
        unavailable: "Could not load the profile.",
        duplicate: "That username is already in use. Please choose another one.",
        saveError: "Could not save the username.",
      };

  useEffect(() => {
    let active = true;
    (async () => {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      if (!active) return;
      if (error) setMessage({ text: copy.unavailable, type: "error" });
      else setUsername(data?.username ?? "");
      setInitialLoading(false);
    })();
    return () => { active = false; };
  }, [userId]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      setMessage({ text: copy.invalid, type: "error" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: normalized })
        .eq("id", userId);

      if (error) {
        if (error.code === "23505" || error.code === "409") {
          throw new Error(copy.duplicate);
        }
        throw error;
      }
      setUsername(normalized);
      setMessage({ text: copy.saved, type: "success" });
    } catch (error: any) {
      setMessage({ text: error?.message || copy.saveError, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-300 mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-600 rounded-full" />
        {copy.title}
      </h2>
      {initialLoading ? (
        <p className="text-sm text-gray-500">{copy.loading}</p>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="profile-username" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{copy.label}</label>
            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              autoComplete="username"
              maxLength={32}
              required
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">{copy.help}</p>
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${message.type === "error" ? "bg-red-900/20 text-red-400 border border-red-900/50" : "bg-green-900/20 text-green-400 border border-green-900/50"}`}>
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={saving || !username.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? (language === "hu" ? "Mentés..." : "Saving...") : copy.save}
          </button>
        </form>
      )}
    </section>
  );
}
