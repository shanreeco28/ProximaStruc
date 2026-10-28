import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import useTheme, { SHOW_THEME_SHORTCUT } from '../hooks/useTheme';

export default function FloatingThemeControl() {
  const { isDark, toggleTheme } = useTheme();
  const [visible, setVisible] = useState(true);
  const button = useRef(null);
  useEffect(() => {
    let timer;
    let keyboardInput = true;
    const activity = event => {
      if (event?.type === 'keydown') keyboardInput = true;
      if (event?.type === 'pointerdown') keyboardInput = false;
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        // A focused control must remain available to keyboard and assistive technology users.
        if (document.activeElement !== button.current || !keyboardInput) setVisible(false);
      }, 15000);
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'focusin'];
    events.forEach(event => window.addEventListener(event, activity, { passive: true, capture: true }));
    window.addEventListener(SHOW_THEME_SHORTCUT, activity);
    activity();
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, activity, { capture: true }));
      window.removeEventListener(SHOW_THEME_SHORTCUT, activity);
    };
  }, []);
  return <button ref={button} type="button" hidden={!visible} onClick={toggleTheme}
    aria-label={isDark ? 'Use light theme' : 'Use dark theme'} title={isDark ? 'Use light theme' : 'Use dark theme'}
    className="theme-shortcut no-print">
    {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
  </button>;
}
