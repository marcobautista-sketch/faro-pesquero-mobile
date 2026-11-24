// Paleta "Mar de Grau" del sistema de diseño (FIGMA_DESIGN_SYSTEM.md de la web).
// Dos modos: noche (azul profundo) y Modo Sol (negro puro con bordes blancos para el reflejo del mar).

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
}

const night: ThemeColors = {
  bg: '#040C18',
  surface: '#081B33',
  surfaceAlt: '#0C2645',
  border: '#1B4570',
  text: '#FFFFFF',
  muted: '#C7D6E6',
  faint: '#93AAC2',
  accent: '#22D3EE',
  danger: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
};

const sun: ThemeColors = {
  bg: '#000000',
  surface: '#0A0A0A',
  surfaceAlt: '#161616',
  border: '#FFFFFF',
  text: '#FFFFFF',
  muted: '#F1F5F9',
  faint: '#E2E8F0',
  accent: '#67E8F9',
  danger: '#EF4444',
  success: '#34D399',
  warning: '#FBBF24',
};

export interface Theme {
  c: ThemeColors;
  highContrast: boolean;
  // Escala tipográfica: ningún texto útil baja de 13 px (regla del diseño).
  fs: (size: number) => number;
  borderWidth: number;
}

export function makeTheme(highContrast: boolean, largeFont: boolean): Theme {
  const scale = largeFont ? 1.12 : 1;
  return {
    c: highContrast ? sun : night,
    highContrast,
    fs: (size) => Math.round(Math.max(13, size) * scale),
    borderWidth: highContrast ? 2 : 1,
  };
}

// Mezcla un color hex con transparencia (por ejemplo, fondos suaves por especie).
export function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
