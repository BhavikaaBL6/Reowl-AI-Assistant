import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "light" | "dark" | "system";
type ColorPreset = "blue" | "purple" | "green" | "teal" | "indigo" | "rose" | "amber";

interface ThemeContextType {
  mode: ThemeMode;
  preset: ColorPreset;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ColorPreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const presets = {
  blue: { primary: "#3B82F6" },
  purple: { primary: "#A855F7" },
  green: { primary: "#10B981" },
  teal: { primary: "#14B8A6" },
  indigo: { primary: "#5E5CE6" },
  rose: { primary: "#F43F5E" },
  amber: { primary: "#F59E0B" },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("reowl-theme-mode") as ThemeMode) || "system";
  });
  const [preset, setPreset] = useState<ColorPreset>(() => {
    return (localStorage.getItem("reowl-theme-preset") as ColorPreset) || "indigo";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyMode = (m: ThemeMode) => {
      if (m === "dark" || (m === "system" && mediaQuery.matches)) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyMode(mode);
    localStorage.setItem("reowl-theme-mode", mode);

    const listener = () => {
      if (mode === "system") applyMode("system");
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [mode]);

  useEffect(() => {
    const root = window.document.documentElement;
    const color = presets[preset].primary;
    root.style.setProperty("--primary-color", color);
    localStorage.setItem("reowl-theme-preset", preset);
  }, [preset]);

  return (
    <ThemeContext.Provider value={{ mode, preset, setMode, setPreset }}>
      {children}
    </ThemeContext.Provider>
  );
};
