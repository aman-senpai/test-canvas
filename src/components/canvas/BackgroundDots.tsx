import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function BackgroundDots() {
  const { theme } = useTheme();
  const dotColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'var(--node-border)';

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[var(--background)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}