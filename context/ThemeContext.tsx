import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

interface ThemeTokens {
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  tokens: ThemeTokens;
  logo?: string;
  source: 'snapshot' | 'predefined';
  createdAt: string;
}

type ThemeRegistry = Record<string, ThemeTemplate>;

interface ThemeContextType {
  themesRegistry: ThemeRegistry;
  currentTheme: ThemeTemplate | null;
  setCurrentThemeById: (themeId: string) => void;
  getThemeById: (themeId: string) => ThemeTemplate | undefined;
  resetToDefaultTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const predefinedThemes: Omit<ThemeTemplate, 'source' | 'createdAt'>[] = [
    { id: 'unicsul', name: "Universidade Cruzeiro do Sul", logo: "unicsul.svg", tokens: { primary: "#0C2D5B", onPrimary: "#FFFFFF", secondary: "#1E3A8A", onSecondary: "#FFFFFF", background: "#F5F7FB", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#F59E0B" }},
    { id: 'unifesp', name: "UNIFESP", logo: "unifesp.svg", tokens: { primary: "#0B5D45", onPrimary: "#FFFFFF", secondary: "#065F46", onSecondary: "#FFFFFF", background: "#F4F7F5", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#94A3B8" }},
    { id: 'usp', name: "USP", logo: "usp.svg", tokens: { primary: "#111827", onPrimary: "#FFFFFF", secondary: "#374151", onSecondary: "#FFFFFF", background: "#F3F4F6", surface: "#FFFFFF", text: "#111827", muted: "#6B7280", accent: "#60A5FA" }},
    { id: 'anhanguera', name: "Anhanguera", logo: "anhanguera.svg", tokens: { primary: "#F97316", onPrimary: "#FFFFFF", secondary: "#EA580C", onSecondary: "#FFFFFF", background: "#FFF7ED", surface: "#FFFFFF", text: "#111827", muted: "#6B7280", accent: "#FDBA74" }},
    { id: 'anhembimorumbi', name: "Anhembi Morumbi", logo: "anhembimorumbi.svg", tokens: { primary: "#138E84", onPrimary: "#FFFFFF", secondary: "#0E7490", onSecondary: "#FFFFFF", background: "#F0FDFC", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#6B7280" }},
    { id: 'estacio', name: "Estacio", logo: "estacio.svg", tokens: { primary: "#00A3B1", onPrimary: "#FFFFFF", secondary: "#2AB7C1", onSecondary: "#063B3F", background: "#F0FDFF", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#0EA5E9" }},
    { id: 'fiesp', name: "Fiesp", logo: "fiesp.svg", tokens: { primary: "#ED1C24", onPrimary: "#FFFFFF", secondary: "#B91C1C", onSecondary: "#FFFFFF", background: "#FEF2F2", surface: "#FFFFFF", text: "#111827", muted: "#6B7280", accent: "#FFFFFF" }},
    { id: 'fmu', name: "FMU", logo: "fmu.svg", tokens: { primary: "#FF3B3B", onPrimary: "#FFFFFF", secondary: "#DC2626", onSecondary: "#FFFFFF", background: "#FEF2F2", surface: "#FFFFFF", text: "#111827", muted: "#6B7280", accent: "#FDA4AF" }},
    { id: 'saojudas', name: "São Judas", logo: "saojudas.svg", tokens: { primary: "#23398E", onPrimary: "#FFFFFF", secondary: "#1E40AF", onSecondary: "#FFFFFF", background: "#EEF2FF", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#C6CF31" }},
    { id: 'unicid', name: "Unicid", logo: "unicid.svg", tokens: { primary: "#0C3C60", onPrimary: "#FFFFFF", secondary: "#14B8A6", onSecondary: "#053B37", background: "#F0FDFA", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#10B981" }},
];

const createInitialRegistry = (): { registry: ThemeRegistry, snapshot: ThemeTemplate } => {
    const rootStyle = getComputedStyle(document.documentElement);
    
    const defaultSnapshot: ThemeTemplate = {
        id: 'default',
        name: 'Padrão (Default)',
        source: 'snapshot',
        createdAt: new Date().toISOString(),
        tokens: {
            primary: rootStyle.getPropertyValue('--primary').trim() || '#2563eb',
            onPrimary: rootStyle.getPropertyValue('--on-primary').trim() || '#ffffff',
            secondary: rootStyle.getPropertyValue('--secondary').trim() || '#10b981',
            onSecondary: rootStyle.getPropertyValue('--on-secondary').trim() || '#ffffff',
            background: rootStyle.getPropertyValue('--background').trim() || '#f1f5f9',
            surface: rootStyle.getPropertyValue('--surface').trim() || '#ffffff',
            text: rootStyle.getPropertyValue('--text').trim() || '#0f172a',
            muted: rootStyle.getPropertyValue('--muted').trim() || '#64748b',
            accent: rootStyle.getPropertyValue('--accent').trim() || '#3b82f6',
        }
    };

    const registry: ThemeRegistry = { 'default': defaultSnapshot };
    predefinedThemes.forEach(theme => {
        registry[theme.id] = {
            ...theme,
            source: 'predefined',
            createdAt: new Date().toISOString()
        };
    });
    
    return { registry, snapshot: defaultSnapshot };
};


export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [{ themesRegistry, defaultSnapshot }, setRegistryData] = useState(() => {
        const { registry, snapshot } = createInitialRegistry();
        return { themesRegistry: registry, defaultSnapshot: snapshot };
    });
    
    const [currentTheme, setCurrentTheme] = useState<ThemeTemplate | null>(defaultSnapshot);

    const applyTheme = useCallback((theme: ThemeTemplate) => {
        const root = document.documentElement;
        Object.entries(theme.tokens).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
        setCurrentTheme(theme);
    }, []);
    
    useEffect(() => {
      if (defaultSnapshot) {
        applyTheme(defaultSnapshot);
      }
    }, [defaultSnapshot, applyTheme]);

    const getThemeById = useCallback((themeId: string): ThemeTemplate | undefined => {
        return themesRegistry[themeId];
    }, [themesRegistry]);

    const setCurrentThemeById = useCallback((themeId: string) => {
        const themeToApply = getThemeById(themeId) || defaultSnapshot;
        if (themeToApply) {
            applyTheme(themeToApply);
        }
    }, [getThemeById, defaultSnapshot, applyTheme]);
    
    const resetToDefaultTheme = useCallback(() => {
        if (defaultSnapshot) {
            applyTheme(defaultSnapshot);
        }
    }, [defaultSnapshot, applyTheme]);


    const value = {
        themesRegistry,
        currentTheme,
        setCurrentThemeById,
        getThemeById,
        resetToDefaultTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
