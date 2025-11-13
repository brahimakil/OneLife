// Fitness-themed Color Palette for OneLife Admin Panel
export const colors = {
  // Primary Colors - Energetic Fitness Theme
  primary: {
    main: '#FF6B35', // Vibrant Orange - Energy & Action
    light: '#FF8C61',
    dark: '#E65A2B',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
  },
  
  // Secondary Colors - Strength & Stability
  secondary: {
    main: '#004E89', // Deep Blue - Trust & Professionalism
    light: '#1A6BA8',
    dark: '#003B6A',
    gradient: 'linear-gradient(135deg, #004E89 0%, #0066B2 100%)',
  },
  
  // Accent Colors - Motivation & Success
  accent: {
    success: '#00D084', // Green - Achievement
    warning: '#FFC947', // Yellow - Caution
    error: '#FF4757', // Red - Alert
    info: '#3AB4F2', // Light Blue - Information
  },
  
  // Neutral Colors - Clean & Modern
  neutral: {
    darkest: '#1A1A2E', // Almost Black - Main Background
    dark: '#16213E', // Dark Blue Gray - Cards
    medium: '#2E3856', // Medium Gray Blue
    light: '#E8ECF1', // Light Gray
    lightest: '#F5F7FA', // Off White
    white: '#FFFFFF',
  },
  
  // Text Colors
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#3AB4F2',
  },
  
  // Background Colors
  background: {
    primary: '#F5F7FA',
    secondary: '#FFFFFF',
    dark: '#1A1A2E',
    card: '#FFFFFF',
    hover: '#F0F2F5',
  },
  
  // Sidebar Colors
  sidebar: {
    background: '#1A1A2E',
    hover: '#16213E',
    active: '#FF6B35',
    text: '#E8ECF1',
    textActive: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
};

// Spacing System
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

// Border Radius
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '50%',
};

// Typography
export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Montserrat', sans-serif",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',
};

// Breakpoints
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};
