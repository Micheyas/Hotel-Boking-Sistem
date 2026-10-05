import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "hbs-theme";
const DEFAULT_THEME = "gold";

// Six selectable looks. `swatch` is [dark, light] for the picker preview dot.
export const THEMES = [
  { id: "gold", name: "Legendary Gold", amName: "ወርቃማ", swatch: ["#1a1a2e", "#c9a84c"] },
  { id: "emerald", name: "Emerald Palace", amName: "ኤመራልድ", swatch: ["#052e22", "#10b981"] },
  { id: "sapphire", name: "Royal Sapphire", amName: "ንጉሣዊ ሰማያዊ", swatch: ["#1e1b4b", "#60a5fa"] },
  { id: "violet", name: "Violet Majesty", amName: "ወይንጠጅ", swatch: ["#2e1065", "#a78bfa"] },
  { id: "crimson", name: "Crimson Sunset", amName: "ቀይ ሽግግር", swatch: ["#450a0a", "#f43f5e"] },
  { id: "ocean", name: "Ocean Breeze", amName: "ውቅያኖስ", swatch: ["#082f49", "#38bdf8"] },
];

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: THEMES,
});

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* storage unavailable — fall through to default */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (id) => {
    if (THEMES.some((t) => t.id === id)) setThemeState(id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
