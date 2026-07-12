---
name: Fidelity Modern
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a32'
  surface-container-highest: '#31353d'
  on-surface: '#e0e2ed'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#e0e2ed'
  inverse-on-surface: '#2d3039'
  outline: '#8c90a1'
  outline-variant: '#424655'
  surface-tint: '#b1c5ff'
  primary: '#b1c5ff'
  on-primary: '#002c70'
  primary-container: '#0e6efd'
  on-primary-container: '#ffffff'
  inverse-primary: '#0057ce'
  secondary: '#b1c5ff'
  on-secondary: '#0d2d69'
  secondary-container: '#2a4481'
  on-secondary-container: '#9bb4f8'
  tertiary: '#ffb599'
  on-tertiary: '#5a1c00'
  tertiary-container: '#cf4b00'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b1c5ff'
  on-secondary-fixed: '#001847'
  on-secondary-fixed-variant: '#2a4481'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7f2b00'
  background: '#10131b'
  on-background: '#e0e2ed'
  surface-variant: '#31353d'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

# Design System: Fidelity Modern

## Brand & Style
The brand identity is rooted in reliability and professional clarity. It targets users who value precision and functional elegance. By utilizing a "Fidelity" color variant, the brand emphasizes true-to-life color representation and a clean, Corporate Modern aesthetic. The transition to a dark color mode shifts the personality toward a high-tech, focused environment, reducing eye strain while maintaining a sophisticated, premium feel.

## Colors
The palette is optimized for a dark color mode. The primary blue (#0e6efd) serves as the core action color, providing high contrast against dark backgrounds. Secondary muted blues (#5c75b5) and tertiary accents (#cf4b00) provide visual hierarchy and functional variance. The neutral palette (#747781) governs surfaces and borders, ensuring a deep, layered UI that maintains readability and professional tone without the harshness of pure black.

## Typography
The system uses Inter for headlines and body text to project a modern, neutral, and highly legible appearance. Public Sans is utilized for labels and data-heavy micro-copy to provide a subtle structural distinction. The scale ensures that information density remains manageable in dark mode, where light text on dark backgrounds can occasionally appear to "glow" if too bold.

## Layout & Spacing
The layout follows a fluid grid system with a consistent 8px rhythmic base. In this dark mode implementation, generous spacing (md and lg) is used to prevent the interface from feeling cramped. Elements are aligned to a 12-column grid for desktop, reflowing to a single column for mobile with 16px gutters to maintain touch-target integrity.

## Elevation & Depth
Depth is conveyed through tonal layering rather than heavy shadows. Since this is a dark mode system, higher elevation levels are represented by lighter surface colors. Low-opacity ambient shadows help define the boundaries of floating elements like modals or dropdowns, while low-contrast outlines in neutral tones help distinguish container boundaries.

## Shapes
The UI employs a "Rounded" shape language (level 2). Standard components feature a 0.5rem (8px) corner radius, while larger containers like cards or dialogs use 1rem (16px). This moderate rounding balances professional discipline with a friendly, accessible modern feel.

## Components
- **Buttons:** Primary buttons use the seed blue with white text. Secondary buttons use an outline style with the neutral-variant border.
- **Cards:** Backgrounds use a slightly elevated surface color (lighter than the base background) with a subtle 1px border.
- **Inputs:** Dark backgrounds with a subtle border that highlights on focus using the primary color.
- **Chips:** Low-contrast surfaces with Public Sans labels for categorization.
