import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import { getTheme } from './theme';
import 'chart.js/auto';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return null; // or a loading spinner
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
    const { settings } = useSettings();
    
    // Memoize the theme to prevent unnecessary re-renders
    const theme = useMemo(() => 
        getTheme(settings.darkMode ? 'dark' : 'light', settings.themeStyle),
        [settings.darkMode, settings.themeStyle]
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
      <Dashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </ThemeProvider>
  );
}

export default App;