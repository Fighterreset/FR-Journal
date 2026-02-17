import AuthPage from "./components/AuthPage";
import OriginalApp from "./components/OriginalApp";
import { useAuth } from "./lib/auth";

export default function App() {
  const { userId, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] text-white p-6">Betöltés…</div>;
  if (!userId) return <AuthPage />;

  return <OriginalApp userId={userId} />;
}
