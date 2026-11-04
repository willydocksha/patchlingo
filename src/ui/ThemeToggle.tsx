// three-way theme switch: follow system, light, dark (remembered per browser)
import { useEffect, useState } from 'react';

type Theme = 'auto' | 'light' | 'dark';
const KEY = 'patchlingo-theme';
const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL: Record<Theme, string> = { auto: '◐ Tema otomatis', light: '☀ Tema terang', dark: '☾ Tema gelap' };

// read the saved choice; storage can be blocked (private mode), so guard it
function readSaved(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readSaved);

  // apply to <html> and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      if (theme === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  return (
    <button type="button" className="btn" onClick={() => setTheme(NEXT[theme])} title="Ganti tema">
      {LABEL[theme]}
    </button>
  );
}
