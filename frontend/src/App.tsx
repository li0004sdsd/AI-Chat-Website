import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, useAuthStore } from './store';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import PersonasPage from './pages/PersonasPage';
import ModelsPage from './pages/ModelsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { i18n } = useTranslation();
  const { settings, setTheme, setLanguage, fetchSettings } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (settings) {
      if (settings.theme) {
        setTheme(settings.theme);
      }
      if (settings.language) {
        setLanguage(settings.language);
        i18n.changeLanguage(settings.language);
      }
    } else {
      const savedTheme = localStorage.getItem('settings-storage');
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          if (parsed.state?.settings?.theme) {
            setTheme(parsed.state.settings.theme);
          }
          if (parsed.state?.settings?.language) {
            setLanguage(parsed.state.settings.language);
            i18n.changeLanguage(parsed.state.settings.language);
          }
        } catch (e) {
          console.error('Failed to parse settings from localStorage');
        }
      }
    }
  }, [settings]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChatPage />} />
          <Route path="personas" element={<PersonasPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
