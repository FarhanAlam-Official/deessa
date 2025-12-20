/**
 * deessa Foundation - Ocean Blue Theme
 * Tailwind CSS Configuration Extension
 * 
 * This file contains the Tailwind configuration for the new Ocean Blue theme.
 * Add these colors to your existing tailwind.config.ts extend.colors section.
 */

export const oceanThemeConfig = {
  colors: {
    // Primary Brand Colors
    brand: {
      primary: 'rgb(63 171 222)',       // #3FABDE
      'primary-dark': 'rgb(11 95 138)', // #0B5F8A
      light: 'rgb(232 246 252)',        // #E8F6FC
      soft: 'rgb(179 224 245)',         // #B3E0F5
      medium: 'rgb(125 200 235)',       // #7DC8EB
    },

    // Pillar Accent Colors
    empowerment: {
      DEFAULT: 'rgb(214 51 108)',       // #D6336C
      light: 'rgb(251 232 240)',        // #FBE8F0
      hover: 'rgb(184 43 91)',          // #B82B5B
    },
    environment: {
      DEFAULT: 'rgb(149 193 31)',       // #95C11F
      light: 'rgb(243 248 229)',        // #F3F8E5
      hover: 'rgb(127 165 26)',         // #7FA51A
    },
    education: {
      DEFAULT: 'rgb(245 158 11)',       // #F59E0B
      light: 'rgb(254 243 229)',        // #FEF3E5
      hover: 'rgb(208 134 9)',          // #D08609
    },

    // Semantic Colors
    success: {
      DEFAULT: 'rgb(22 163 74)',        // #16A34A
      light: 'rgb(220 252 231)',        // #DCFCE7
      dark: 'rgb(21 128 61)',           // #15803D
    },
    warning: {
      DEFAULT: 'rgb(245 158 11)',       // #F59E0B
      light: 'rgb(254 243 199)',        // #FEF3C7
      dark: 'rgb(180 83 9)',            // #B45309
    },
    danger: {
      DEFAULT: 'rgb(220 38 38)',        // #DC2626
      light: 'rgb(254 226 226)',        // #FEE2E2
      dark: 'rgb(185 28 28)',           // #B91C1C
    },
    info: {
      DEFAULT: 'rgb(37 99 235)',        // #2563EB
      light: 'rgb(219 234 254)',        // #DBEAFE
      dark: 'rgb(30 64 175)',           // #1E40AF
    },
  },

  // Border Radius
  borderRadius: {
    'sm': '8px',
    'md': '12px',
    'lg': '16px',
    'xl': '24px',
  },

  // Box Shadows
  boxShadow: {
    'primary': '0 10px 25px rgba(63, 171, 222, 0.15)',
    'empowerment': '0 10px 25px rgba(214, 51, 108, 0.15)',
    'environment': '0 10px 25px rgba(149, 193, 31, 0.15)',
    'education': '0 10px 25px rgba(245, 158, 11, 0.15)',
  },

  // Animation & Transitions
  transitionDuration: {
    'fast': '150ms',
    'base': '200ms',
    'slow': '300ms',
  },

  transitionTimingFunction: {
    'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Custom keyframes
  keyframes: {
    shimmer: {
      '0%': { backgroundPosition: '200% 0' },
      '100%': { backgroundPosition: '-200% 0' },
    },
  },

  animation: {
    shimmer: 'shimmer 2s infinite',
  },
}

/**
 * Usage Example in tailwind.config.ts:
 * 
 * import { oceanThemeConfig } from './docs/tailwind-ocean-theme-config'
 * 
 * export default {
 *   theme: {
 *     extend: {
 *       colors: oceanThemeConfig.colors,
 *       borderRadius: oceanThemeConfig.borderRadius,
 *       boxShadow: oceanThemeConfig.boxShadow,
 *       transitionDuration: oceanThemeConfig.transitionDuration,
 *       transitionTimingFunction: oceanThemeConfig.transitionTimingFunction,
 *       keyframes: oceanThemeConfig.keyframes,
 *       animation: oceanThemeConfig.animation,
 *     }
 *   }
 * }
 */

/**
 * Class Name Examples:
 * 
 * Backgrounds:
 * - bg-brand-primary
 * - bg-brand-primary-dark
 * - bg-empowerment
 * - bg-environment
 * - bg-education
 * 
 * Text Colors:
 * - text-brand-primary
 * - text-empowerment
 * - text-success
 * - text-danger
 * 
 * Borders:
 * - border-brand-primary
 * - border-empowerment
 * - border-info
 * 
 * Shadows:
 * - shadow-primary
 * - shadow-empowerment
 * - shadow-environment
 * 
 * Hover States:
 * - hover:bg-brand-primary-dark
 * - hover:text-empowerment-hover
 * - hover:shadow-primary
 */
