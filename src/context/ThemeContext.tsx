import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, ThemeName, Theme } from '../themes';

interface ThemeContextType {
  currentTheme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  availableThemes: Array<{ name: ThemeName; label: string }>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: ThemeName }> = ({
  children,
  initialTheme = 'barber',
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Tentar recuperar tema salvo
    const saved = localStorage.getItem('theme_name') as ThemeName | null;
    if (saved && saved in THEMES) {
      return saved;
    }
    return initialTheme;
  });

  const currentTheme = THEMES[themeName];

  useEffect(() => {
    // Salvar tema no localStorage
    localStorage.setItem('theme_name', themeName);
  }, [themeName]);

  const setTheme = (name: ThemeName) => {
    if (name in THEMES) {
      setThemeName(name);
    }
  };

  const availableThemes = Object.entries(THEMES).map(([name, theme]) => ({
    name: name as ThemeName,
    label: theme.label,
  }));

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeName,
        setTheme,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};
