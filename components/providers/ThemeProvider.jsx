'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const ACCENTS = [
  {
    id: 'purple',
    name: 'Meova Purple',
    hex: '#7657D9',
    hover: '#6848C9',
    pressed: '#5B3FB3',
    tint10: '#F1EEFB',
    tint20: '#D9D1F2',
    badge: 'Permanent',
  },
];

export const MODES = [
  { id: 'light', name: 'Crisp White', icon: 'ri-sun-line' },
  { id: 'dark', name: 'Midnight Black', icon: 'ri-moon-line' },
];

const ThemeContext = createContext({
  mode: 'light',
  accent: 'purple',
  setMode: () => {},
  setAccent: () => {},
  setTheme: () => {},
  themePreset: 'light-purple',
  setThemePreset: () => {},
  currentAccent: ACCENTS[0],
  isThemeModalOpen: false,
  openThemeModal: () => {},
  closeThemeModal: () => {},
  mounted: false,
});

export function ThemeProvider({ children, initialMode = 'light', initialAccent = 'purple' }) {
  const [mode, setModeState] = useState(initialMode);
  const [accent, setAccentState] = useState(initialAccent);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Apply theme attributes to DOM immediately
  const applyThemeToDom = useCallback((newMode, newAccent) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-mode', newMode);
    root.setAttribute('data-accent', newAccent);
    root.setAttribute('data-theme', `${newMode}-${newAccent}`);
    root.classList.toggle('dark', newMode === 'dark');

    // Update meta theme-color for mobile browser address bar
    const selectedAccent = ACCENTS.find((a) => a.id === newAccent) || ACCENTS[0];
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newMode === 'dark' ? '#0D0D0D' : selectedAccent.hex);
    }

    // Dynamic Browser Tab Favicon matching active theme accent (Instant 0ms sync)
    try {
      const iconHref = `/favicon-${newAccent}.png`;
      const iconLinks = document.querySelectorAll("link[rel*='icon']");
      iconLinks.forEach((link) => {
        link.href = iconHref;
      });
    } catch (e) {}
  }, []);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedMode = localStorage.getItem('meova_mode') || 'light';
      const savedAccent = 'purple';
      localStorage.setItem('meova_accent', 'purple');
      document.cookie = 'meova_accent=purple; path=/; max-age=31536000';
      setModeState(savedMode);
      setAccentState(savedAccent);
      applyThemeToDom(savedMode, savedAccent);
    } catch (e) {
      console.warn('ThemeProvider storage error:', e);
    }
  }, [applyThemeToDom]);

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('meova_mode', newMode);
      document.cookie = `meova_mode=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    applyThemeToDom(newMode, accent);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: newMode, accent } }));
  }, [accent, applyThemeToDom]);

  const setAccent = useCallback((newAccent) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem('meova_accent', newAccent);
      document.cookie = `meova_accent=${newAccent}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    applyThemeToDom(mode, newAccent);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode, accent: newAccent } }));
  }, [mode, applyThemeToDom]);

  const setTheme = useCallback(({ mode: newMode, accent: newAccent }) => {
    if (newMode) setModeState(newMode);
    if (newAccent) setAccentState(newAccent);
    const m = newMode || mode;
    const a = newAccent || accent;
    try {
      localStorage.setItem('meova_mode', m);
      localStorage.setItem('meova_accent', a);
      document.cookie = `meova_mode=${m}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `meova_accent=${a}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    applyThemeToDom(m, a);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: m, accent: a } }));
  }, [mode, accent, applyThemeToDom]);

  const setThemePreset = useCallback((presetId) => {
    const [m, a] = presetId.split('-');
    if (m && a) {
      setTheme({ mode: m, accent: a });
    }
  }, [setTheme]);

  const openThemeModal = useCallback(() => setIsThemeModalOpen(true), []);
  const closeThemeModal = useCallback(() => setIsThemeModalOpen(false), []);

  const currentAccent = ACCENTS.find((a) => a.id === accent) || ACCENTS[0];
  const themePreset = `${mode}-${accent}`;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        setMode,
        setAccent,
        setTheme,
        themePreset,
        setThemePreset,
        currentAccent,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
