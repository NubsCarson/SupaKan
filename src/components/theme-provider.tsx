import { createContext, useContext, useEffect, useState } from "react";
import { useThemeStore, type Theme } from "@/lib/theme-store";

type BaseTheme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: BaseTheme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: BaseTheme | string;
  setTheme: (theme: BaseTheme | string) => void;
  customThemes: Theme[];
  addCustomTheme: (theme: Theme) => void;
  removeCustomTheme: (themeId: string) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  customThemes: [],
  addCustomTheme: () => null,
  removeCustomTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function applyThemeColors(theme: Theme) {
  const root = window.document.documentElement;
  // First remove any custom theme colors
  root.style.removeProperty("--background");
  root.style.removeProperty("--foreground");
  root.style.removeProperty("--card");
  root.style.removeProperty("--card-foreground");
  root.style.removeProperty("--popover");
  root.style.removeProperty("--popover-foreground");
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-foreground");
  root.style.removeProperty("--secondary");
  root.style.removeProperty("--secondary-foreground");
  root.style.removeProperty("--muted");
  root.style.removeProperty("--muted-foreground");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-foreground");
  root.style.removeProperty("--destructive");
  root.style.removeProperty("--destructive-foreground");
  root.style.removeProperty("--border");
  root.style.removeProperty("--input");
  root.style.removeProperty("--ring");

  // Then apply the new theme colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    root.style.setProperty(`--${cssKey}`, value);
  });
}

function resetToBaseTheme() {
  const root = window.document.documentElement;
  // Remove all custom theme colors
  root.style.removeProperty("--background");
  root.style.removeProperty("--foreground");
  root.style.removeProperty("--card");
  root.style.removeProperty("--card-foreground");
  root.style.removeProperty("--popover");
  root.style.removeProperty("--popover-foreground");
  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-foreground");
  root.style.removeProperty("--secondary");
  root.style.removeProperty("--secondary-foreground");
  root.style.removeProperty("--muted");
  root.style.removeProperty("--muted-foreground");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-foreground");
  root.style.removeProperty("--destructive");
  root.style.removeProperty("--destructive-foreground");
  root.style.removeProperty("--border");
  root.style.removeProperty("--input");
  root.style.removeProperty("--ring");
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<BaseTheme | string>(
    () => (localStorage.getItem(storageKey) as BaseTheme | string) || defaultTheme
  );

  const { customThemes, addTheme, removeTheme, activeTheme, setActiveTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    // Reset any custom theme colors first
    resetToBaseTheme();

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    if (theme === "light" || theme === "dark") {
      root.classList.add(theme);
      return;
    }

    // Apply custom theme
    const customTheme = customThemes.find(t => t.id === theme);
    if (customTheme) {
      // For custom themes, we still want to use dark mode as the base
      root.classList.add("dark");
      applyThemeColors(customTheme);
    }
  }, [theme, customThemes]);

  const value = {
    theme,
    setTheme: (theme: BaseTheme | string) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
      if (customThemes.some(t => t.id === theme)) {
        setActiveTheme(theme);
      } else {
        setActiveTheme(null);
      }
    },
    customThemes,
    addCustomTheme: addTheme,
    removeCustomTheme: removeTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}; 