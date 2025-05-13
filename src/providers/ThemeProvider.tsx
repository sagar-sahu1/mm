
"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

type Theme = "light" | "dark" | "system";
type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  textToSpeech: boolean; // For UI state, actual TTS is separate
};

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accessibility: AccessibilitySettings;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
  toggleTextToSpeech: () => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  accessibility: {
    largeText: false,
    highContrast: false,
    textToSpeech: false,
  },
  setAccessibility: () => null,
  toggleLargeText: () => null,
  toggleHighContrast: () => null,
  toggleTextToSpeech: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAccessibility = { largeText: false, highContrast: false, textToSpeech: false },
  storageKey = "vite-ui-theme", // Using a generic key name
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultAccessibility?: Partial<AccessibilitySettings>;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useLocalStorage<Theme>(
    `${storageKey}-theme`,
    defaultTheme
  );
  const [accessibility, setAccessibilityState] =
    useLocalStorage<AccessibilitySettings>(`${storageKey}-accessibility`, {
      ...initialState.accessibility,
      ...defaultAccessibility,
    });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Accessibility classes
    if (accessibility.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    if (accessibility.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [theme, accessibility]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibilityState((prev) => ({ ...prev, ...settings }));
  };
  
  const toggleLargeText = () => {
    setAccessibilityState(prev => ({ ...prev, largeText: !prev.largeText }));
  }

  const toggleHighContrast = () => {
    setAccessibilityState(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }

  const toggleTextToSpeech = () => {
    setAccessibilityState(prev => ({ ...prev, textToSpeech: !prev.textToSpeech }));
     if (!accessibility.textToSpeech && window.speechSynthesis) {
        // Simple alert for TTS activation, actual implementation can be more complex
        const utterance = new SpeechSynthesisUtterance("Text to speech enabled.");
        window.speechSynthesis.speak(utterance);
      }
  }


  const value = {
    theme,
    setTheme,
    accessibility,
    setAccessibility,
    toggleLargeText,
    toggleHighContrast,
    toggleTextToSpeech,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
