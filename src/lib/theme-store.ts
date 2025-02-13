import { create, StateCreator } from 'zustand';
import type { StateCreator as ZustandStateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

export interface Theme {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

interface ThemeStore {
  customThemes: Theme[];
  activeTheme: string | null;
  addTheme: (theme: Theme) => void;
  removeTheme: (themeId: string) => void;
  setActiveTheme: (themeId: string | null) => void;
}

type ThemeStorePersist = (
  config: StateCreator<ThemeStore>,
  options: PersistOptions<ThemeStore>
) => StateCreator<ThemeStore>;

export const useThemeStore = create<ThemeStore>()(
  (persist as ThemeStorePersist)(
    (set) => ({
      customThemes: [],
      activeTheme: null,
      addTheme: (theme: Theme) =>
        set((state: ThemeStore) => ({
          customThemes: [...state.customThemes, theme],
        })),
      removeTheme: (themeId: string) =>
        set((state: ThemeStore) => ({
          customThemes: state.customThemes.filter((t: Theme) => t.id !== themeId),
          activeTheme: state.activeTheme === themeId ? null : state.activeTheme,
        })),
      setActiveTheme: (themeId: string | null) =>
        set(() => ({
          activeTheme: themeId,
        })),
    }),
    {
      name: 'kanban-custom-themes',
    }
  )
); 