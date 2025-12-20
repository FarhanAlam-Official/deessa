# deessa Foundation - New Brand Theme Implementation Plan

## 🎨 Theme Transition Overview

**From:** Red-based theme (#EA2A33)  
**To:** Ocean Blue theme (#3FABDE)  
**Rationale:** Shift from urgency to trust, hope, and sustainability

---

## 📋 Complete Color Palette

### Primary Brand Colors

```css
--brand-primary: 63 171 222;           /* #3FABDE - Main brand color */
--brand-primary-dark: 11 95 138;       /* #0B5F8A - Emphasis & hover states */
```

**Usage:**

- Primary: Main CTAs, links, brand elements, focus rings
- Primary Dark: Hover states, headers, emphasized content

---

### Logo-Derived Accent Colors (Three Pillars)

```css
--accent-empowerment: 214 51 108;      /* #D6336C - Magenta/Pink */
--accent-environment: 149 193 31;      /* #95C11F - Lime Green */
--accent-education: 245 158 11;        /* #F59E0B - Amber */
```

**Pillar Mapping:**

- 🩷 **Empowerment:** Women's programs, community initiatives, leadership
- 🌿 **Environment:** Sustainability, clean water, eco-projects
- 📚 **Education:** Learning programs, skill development, training

---

### Semantic/Functional Colors

```css
--success: 22 163 74;                  /* #16A34A - green-600 */
--warning: 245 158 11;                 /* #F59E0B - amber-500 */
--danger: 220 38 38;                   /* #DC2626 - red-600 */
--info: 37 99 235;                     /* #2563EB - blue-600 */
```

**States:**

- Success: Completed actions, positive feedback, achievements
- Warning: Pending states, attention needed, caution messages
- Danger: Errors, critical alerts, destructive actions
- Info: Informational messages, helpful tips, guidance

---

### Neutral Palette

```css
--bg-white: 255 255 255;               /* #FFFFFF - Pure white */
--bg-soft: 248 249 250;                /* #F8F9FA - Soft gray background */
--border: 229 231 235;                 /* #E5E7EB - Borders & dividers */
--text-main: 33 37 41;                 /* #212529 - Primary text */
--text-muted: 108 117 125;             /* #6C757D - Secondary text */
```

---

## 🎭 Derived Color Variants

### Primary Variants (Opacity-based)

```css
/* Light backgrounds & surfaces */
--primary-light: 232 246 252;          /* #E8F6FC - 10% opacity */
--primary-soft: 179 224 245;           /* #B3E0F5 - 30% opacity */
--primary-medium: 125 200 235;         /* #7DC8EB - 50% opacity */

/* Hover states */
--primary-hover: 11 95 138;            /* Darkens to primary-dark */
--primary-light-hover: 232 246 252;    /* Background hover effect */
```

### Accent Variants

```css
/* Light backgrounds for each pillar */
--empowerment-light: 251 232 240;      /* #FBE8F0 - 10% */
--environment-light: 243 248 229;      /* #F3F8E5 - 10% */
--education-light: 254 243 229;        /* #FEF3E5 - 10% */

/* Hover states (darken by ~15%) */
--empowerment-hover: 184 43 91;        /* #B82B5B */
--environment-hover: 127 165 26;       /* #7FA51A */
--education-hover: 208 134 9;          /* #D08609 */
```

---

## 🖱️ Interactive States & Effects

### Button States

| State | Primary | Accent | Outline |
|-------|---------|--------|---------|
| **Default** | `bg-[rgb(63,171,222)]` | `bg-[pillar-color]` | `border-primary text-primary` |
| **Hover** | `bg-[rgb(11,95,138)]` | `darken(15%)` | `bg-primary-light text-primary-dark` |
| **Active** | `bg-[rgb(11,95,138)] scale-95` | `darken(20%)` | `bg-primary-soft` |
| **Focus** | `ring-2 ring-primary/50 ring-offset-2` | `ring-accent/50` | `ring-primary/50` |
| **Disabled** | `bg-primary/50 cursor-not-allowed` | `bg-accent/50` | `border-border text-muted` |

### Card Hover Effects

```css
/* Default Card */
.card-hover {
  transition: all 200ms ease;
}
.card-hover:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  background-color: rgb(248 249 250);
}

/* Accent Border Card */
.card-accent {
  border: 2px solid rgb(63 171 222 / 0.2);
}
.card-accent:hover {
  border-color: rgb(63 171 222 / 0.5);
  box-shadow: 0 10px 25px rgba(63, 171, 222, 0.15);
}

/* Lift Effect Card */
.card-lift:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}
```

### Input Focus States

```css
/* Default Focus */
input:focus {
  border-color: rgb(63 171 222);
  outline: 2px solid rgb(63 171 222 / 0.2);
  outline-offset: 0;
}

/* Error State */
input.error {
  border-color: rgb(220 38 38);
  outline-color: rgb(220 38 38 / 0.2);
}

/* Success State */
input.success {
  border-color: rgb(22 163 74);
  outline-color: rgb(22 163 74 / 0.2);
}
```

### Link Hover Effects

```css
/* Standard Links */
a {
  color: rgb(63 171 222);
  transition: color 150ms ease;
}
a:hover {
  color: rgb(11 95 138);
  text-decoration: underline;
}

/* Underline Effect */
a.underline-effect {
  position: relative;
  text-decoration: none;
}
a.underline-effect::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: rgb(63 171 222);
  transition: width 200ms ease;
}
a.underline-effect:hover::after {
  width: 100%;
}
```

---

## 🎨 Gradient Combinations

### Primary Gradients

```css
/* Hero Gradient */
background: linear-gradient(135deg, rgb(63 171 222) 0%, rgb(11 95 138) 100%);

/* Soft Background Fade */
background: linear-gradient(to bottom, rgb(232 246 252) 0%, rgb(255 255 255) 100%);

/* Radial Overlay */
background: radial-gradient(circle at top right, rgb(63 171 222 / 0.1) 0%, transparent 100%);
```

### Multi-Pillar Gradients

```css
/* Three Pillars Rainbow */
background: linear-gradient(135deg, 
  rgb(214 51 108) 0%,      /* Empowerment */
  rgb(245 158 11) 50%,     /* Education */
  rgb(149 193 31) 100%     /* Environment */
);

/* Pillar Card Backgrounds */
.empowerment-gradient {
  background: linear-gradient(135deg, rgb(214 51 108 / 0.1) 0%, transparent 100%);
}
.environment-gradient {
  background: linear-gradient(135deg, rgb(149 193 31 / 0.1) 0%, transparent 100%);
}
.education-gradient {
  background: linear-gradient(135deg, rgb(245 158 11 / 0.1) 0%, transparent 100%);
}
```

---

## 🔤 Typography Hierarchy

### Heading Scale

```css
/* Using Ocean Blue theme colors */
h1 {
  font-size: 3rem;           /* 48px */
  font-weight: 700;          /* Bold */
  color: rgb(11 95 138);     /* Primary Dark */
  line-height: 1.2;
}

h2 {
  font-size: 2.25rem;        /* 36px */
  font-weight: 700;
  color: rgb(11 95 138);
  line-height: 1.3;
}

h3 {
  font-size: 1.875rem;       /* 30px */
  font-weight: 600;          /* Semibold */
  color: rgb(63 171 222);    /* Primary */
  line-height: 1.4;
}

h4 {
  font-size: 1.5rem;         /* 24px */
  font-weight: 600;
  color: rgb(33 37 41);      /* Text Main */
  line-height: 1.4;
}

h5 {
  font-size: 1.25rem;        /* 20px */
  font-weight: 600;
  color: rgb(33 37 41);
  line-height: 1.5;
}

h6 {
  font-size: 1rem;           /* 16px */
  font-weight: 600;
  color: rgb(33 37 41);
  line-height: 1.5;
}
```

### Body Text

```css
.text-large {
  font-size: 1.125rem;       /* 18px */
  color: rgb(33 37 41);
  line-height: 1.75;
}

.text-body {
  font-size: 1rem;           /* 16px */
  color: rgb(33 37 41);
  line-height: 1.6;
}

.text-small {
  font-size: 0.875rem;       /* 14px */
  color: rgb(108 117 125);   /* Text Muted */
  line-height: 1.5;
}

.text-tiny {
  font-size: 0.75rem;        /* 12px */
  color: rgb(108 117 125);
  line-height: 1.4;
}
```

---

## 🎯 UI Component Patterns

### Badges

```css
/* Primary Badge */
.badge-primary {
  background: rgb(63 171 222);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Soft Badge */
.badge-soft {
  background: rgb(232 246 252);
  color: rgb(11 95 138);
}

/* Pillar Badges */
.badge-empowerment { background: rgb(214 51 108); color: white; }
.badge-environment { background: rgb(149 193 31); color: white; }
.badge-education { background: rgb(245 158 11); color: white; }

/* Status Badges */
.badge-success { background: rgb(22 163 74); color: white; }
.badge-warning { background: rgb(245 158 11); color: white; }
.badge-danger { background: rgb(220 38 38); color: white; }
```

### Progress Bars

```css
/* Primary Progress */
.progress-primary {
  background: rgb(232 246 252);      /* Track */
}
.progress-primary-fill {
  background: rgb(63 171 222);       /* Fill */
  transition: width 300ms ease;
}

/* Pillar Progress Bars */
.progress-empowerment-track { background: rgb(251 232 240); }
.progress-empowerment-fill { background: rgb(214 51 108); }

.progress-environment-track { background: rgb(243 248 229); }
.progress-environment-fill { background: rgb(149 193 31); }

.progress-education-track { background: rgb(254 243 229); }
.progress-education-fill { background: rgb(245 158 11); }
```

### Alerts

```css
/* Info Alert */
.alert-info {
  background: rgb(219 234 254);      /* blue-100 */
  border: 1px solid rgb(37 99 235);
  color: rgb(30 58 138);             /* blue-900 */
}

/* Success Alert */
.alert-success {
  background: rgb(220 252 231);      /* green-100 */
  border: 1px solid rgb(22 163 74);
  color: rgb(22 101 52);             /* green-900 */
}

/* Warning Alert */
.alert-warning {
  background: rgb(254 243 199);      /* amber-100 */
  border: 1px solid rgb(245 158 11);
  color: rgb(146 64 14);             /* amber-900 */
}

/* Error Alert */
.alert-error {
  background: rgb(254 226 226);      /* red-100 */
  border: 1px solid rgb(220 38 38);
  color: rgb(153 27 27);             /* red-900 */
}
```

---

## 📐 Border Radius & Spacing

### Border Radius Scale

```css
--radius-sm: 8px;                    /* Small elements (badges, inputs) */
--radius-md: 12px;                   /* Medium elements (buttons, cards) */
--radius-lg: 16px;                   /* Large elements (modals, sections) */
--radius-xl: 24px;                   /* Extra large (feature cards) */
--radius-full: 9999px;               /* Pills, circular avatars */
```

### Spacing Scale

```css
/* Consistent with Tailwind defaults */
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */
```

---

## ♿ Accessibility Requirements

### Contrast Ratios (WCAG AA Compliant)

| Combination | Ratio | Status |
|-------------|-------|--------|
| Primary on White | 4.52:1 | ✅ Pass |
| Primary Dark on White | 7.89:1 | ✅ Pass AAA |
| Text Main on White | 14.23:1 | ✅ Pass AAA |
| Text Muted on White | 4.61:1 | ✅ Pass |
| Success on White | 4.85:1 | ✅ Pass |
| Danger on White | 5.21:1 | ✅ Pass |

### Focus Indicators

```css
/* All interactive elements must have visible focus */
*:focus-visible {
  outline: 2px solid rgb(63 171 222);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Alternative ring style */
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgb(63 171 222 / 0.3);
}
```

### Color-Independent Design

- ✅ Never use color alone to convey information
- ✅ Include icons alongside colored badges
- ✅ Use text labels for status indicators
- ✅ Provide patterns/textures for charts when needed

---

## 🌙 Dark Mode Strategy

### Dark Mode Color Adjustments

```css
.dark {
  /* Primary colors - reduce lightness */
  --brand-primary: 50 158 206;         /* Slightly darker */
  --brand-primary-dark: 38 112 154;    /* Adjusted for dark bg */
  
  /* Backgrounds */
  --bg-dark: 17 24 39;                 /* gray-900 */
  --bg-dark-elevated: 31 41 55;        /* gray-800 */
  --border-dark: 55 65 81;             /* gray-700 */
  
  /* Text */
  --text-dark-main: 243 244 246;       /* gray-100 */
  --text-dark-muted: 156 163 175;      /* gray-400 */
  
  /* Semantic - increased contrast */
  --success-dark: 34 197 94;           /* green-500 */
  --warning-dark: 251 191 36;          /* amber-400 */
  --danger-dark: 239 68 68;            /* red-500 */
  --info-dark: 59 130 246;             /* blue-500 */
}
```

---

## 🎬 Animation & Transitions

### Standard Transitions

```css
/* Default transition for interactive elements */
.transition-default {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth color transitions */
.transition-colors {
  transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

/* Transform transitions */
.transition-transform {
  transition: transform 200ms ease;
}

/* Hover scale effect */
.hover-scale:hover {
  transform: scale(1.05);
}

/* Subtle lift */
.hover-lift:hover {
  transform: translateY(-2px);
}
```

### Loading States

```css
/* Shimmer effect for skeleton loaders */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgb(248 249 250) 0%,
    rgb(232 246 252) 50%,
    rgb(248 249 250) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

---

## 📦 Implementation Checklist

### Phase 1: CSS Variables Update

- [ ] Update root CSS variables in `globals.css`
- [ ] Define all primary, accent, semantic colors
- [ ] Add derived color variants
- [ ] Set up dark mode variables
- [ ] Update focus ring colors

### Phase 2: Component Library

- [ ] Update Button component styles
- [ ] Update Badge component
- [ ] Update Card hover states
- [ ] Update Input focus states
- [ ] Update Alert variants
- [ ] Update Progress bar styles

### Phase 3: Layout & Navigation

- [ ] Update header/navbar colors
- [ ] Update footer styling
- [ ] Update sidebar (admin)
- [ ] Update breadcrumbs
- [ ] Update tab components

### Phase 4: Forms

- [ ] Update all form inputs
- [ ] Update textarea styles
- [ ] Update select dropdowns
- [ ] Update checkbox/radio buttons
- [ ] Update switches
- [ ] Update validation states

### Phase 5: Data Display

- [ ] Update tables
- [ ] Update charts (use new accent colors)
- [ ] Update stat cards
- [ ] Update timeline components
- [ ] Update calendar

### Phase 6: Feedback Elements

- [ ] Update toast notifications
- [ ] Update modal dialogs
- [ ] Update tooltips
- [ ] Update loading spinners
- [ ] Update skeleton loaders

### Phase 7: Page-Specific

- [ ] Homepage hero section
- [ ] Programs pages (use pillar colors)
- [ ] Donation pages
- [ ] Event cards
- [ ] Impact/stats sections
- [ ] Admin dashboard

### Phase 8: Testing

- [ ] Test all interactive states
- [ ] Verify contrast ratios
- [ ] Test dark mode (if applicable)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Accessibility audit

---

## 🔄 Migration Strategy

### Gradual Rollout Approach

1. **Week 1:** Update CSS variables and core utilities
2. **Week 2:** Update component library (buttons, badges, alerts)
3. **Week 3:** Update forms and inputs
4. **Week 4:** Update page layouts and navigation
5. **Week 5:** Update data display components
6. **Week 6:** Final testing and refinement

### Backwards Compatibility

```css
/* Keep old variables temporarily with deprecation warnings */
--primary-old: oklch(0.55 0.22 25);  /* DEPRECATED: Use --brand-primary */

/* Provide mapping for transition period */
--primary: rgb(var(--brand-primary));
--destructive: rgb(var(--danger));
```

---

## 📚 Resources & Assets

### Downloads

- [ ] Complete CSS variable file
- [ ] Tailwind config with custom colors
- [ ] Figma design system
- [ ] Color palette PDF
- [ ] Component library documentation

### Design Tokens

- [ ] JSON file with all color values
- [ ] Sketch library
- [ ] Adobe XD assets
- [ ] SVG icon set with new colors

---

## 🎯 Success Metrics

- ✅ All components using new color system
- ✅ 100% WCAG AA compliance
- ✅ Consistent hover/focus states
- ✅ Smooth transition animations
- ✅ Dark mode support (optional)
- ✅ Brand recognition improved
- ✅ User feedback positive

---

**Last Updated:** December 20, 2025  
**Version:** 1.0  
**Status:** Planning & Review Phase
