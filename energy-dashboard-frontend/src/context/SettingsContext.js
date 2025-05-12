import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('dashboardSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            darkMode: false,
            notifications: true,
            themeStyle: 'default',
            refreshRate: 5,
            showVoltage: true,
            showCurrent: true,
            showPower: true,
            showCost: true,
            kwhRate: 0.12
        };
    });

    useEffect(() => {
        // Save settings to localStorage whenever they change
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            ...newSettings
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}; 