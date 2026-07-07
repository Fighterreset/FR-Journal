import AuthPage from "./components/AuthPage";
import OriginalApp from "./components/OriginalApp";
import { useAuth } from "./lib/auth";
import { useLanguage } from "./context/LanguageContext";

export default function App() {
  const { userId, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
        {t("loading")}
      </div>
    );
  }

  if (!userId) return <AuthPage />;

  return <OriginalApp userId={userId} />;
}