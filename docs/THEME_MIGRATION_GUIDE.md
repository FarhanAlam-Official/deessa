# 🎨 Theme Migration Quick Reference

## Color Comparison: Old → New

### Primary Colors

| Old Theme | New Theme | Purpose |
|-----------|-----------|---------|
| `#EA2A33` (Red) | `#3FABDE` (Ocean Blue) | Primary brand color, CTAs, links |
| `oklch(0.55 0.22 25)` | `rgb(63 171 222)` | Same as above (RGB format) |
| N/A | `#0B5F8A` (Deep Ocean) | Hover states, emphasis |

### Use Cases

```css
/* OLD */
.button-primary {
  background: #EA2A33;
}

/* NEW */
.button-primary {
  background: rgb(63 171 222);
}
.button-primary:hover {
  background: rgb(11 95 138);
}
```

---

## Accent Colors (New)

The new theme introduces three pillar colors from the logo:

| Pillar | Color | Hex | Usage |
|--------|-------|-----|-------|
| 🩷 Empowerment | Pink/Magenta | `#D6336C` | Women's programs, community |
| 🌿 Environment | Lime Green | `#95C11F` | Sustainability, eco projects |
| 📚 Education | Amber | `#F59E0B` | Learning, skill development |

---

## Component Migration Guide

### Buttons

#### Before (Red Theme)

```tsx
<Button className="bg-primary">
  Donate Now
</Button>
```

#### After (Ocean Blue)

```tsx
<Button style={{ backgroundColor: 'rgb(63 171 222)', color: 'white' }}>
  Donate Now
</Button>

// Or with Tailwind config:
<Button className="bg-brand-primary text-white hover:bg-brand-primary-dark">
  Donate Now
</Button>
```

---

### Badges

#### Before

```tsx
<Badge className="bg-primary">Active</Badge>
```

#### After - with Pillar Categories

```tsx
{/* Primary badge */}
<Badge className="bg-brand-primary">Active</Badge>

{/* Pillar-specific */}
<Badge className="bg-empowerment">
  <Heart className="w-3 h-3 mr-1" />
  Empowerment Program
</Badge>

<Badge className="bg-environment">
  <Leaf className="w-3 h-3 mr-1" />
  Environmental
</Badge>

<Badge className="bg-education">
  <GraduationCap className="w-3 h-3 mr-1" />
  Education
</Badge>
```

---

### Cards

#### Before

```tsx
<Card>
  <CardContent>...</CardContent>
</Card>
```

#### After - with Hover & Accent Borders

```tsx
{/* Standard hover effect */}
<Card className="hover:shadow-lg hover:bg-soft transition-all">
  <CardContent>...</CardContent>
</Card>

{/* With accent border */}
<Card 
  className="border-2 hover:shadow-lg transition-all"
  style={{ borderColor: 'rgb(63 171 222 / 0.2)' }}
>
  <CardContent>...</CardContent>
</Card>

{/* Colored background */}
<Card style={{ backgroundColor: 'rgb(232 246 252)' }}>
  <CardContent>...</CardContent>
</Card>
```

---

### Alerts

#### Before

```tsx
<Alert variant="default">
  <AlertDescription>Message</AlertDescription>
</Alert>
```

#### After - with Semantic Colors

```tsx
{/* Info */}
<Alert style={{ 
  borderColor: 'rgb(37 99 235)', 
  backgroundColor: 'rgb(219 234 254)' 
}}>
  <Info className="h-4 w-4" style={{ color: 'rgb(37 99 235)' }} />
  <AlertTitle style={{ color: 'rgb(30 64 175)' }}>Information</AlertTitle>
  <AlertDescription style={{ color: 'rgb(30 58 138)' }}>
    Your message here
  </AlertDescription>
</Alert>

{/* Success */}
<Alert style={{ 
  borderColor: 'rgb(22 163 74)', 
  backgroundColor: 'rgb(220 252 231)' 
}}>
  <CheckCircle2 className="h-4 w-4" style={{ color: 'rgb(22 163 74)' }} />
  <AlertTitle style={{ color: 'rgb(21 128 61)' }}>Success</AlertTitle>
  <AlertDescription style={{ color: 'rgb(22 101 52)' }}>
    Action completed successfully
  </AlertDescription>
</Alert>
```

---

### Progress Bars

#### Before

```tsx
<Progress value={75} />
```

#### After - with Pillar Colors

```tsx
{/* Primary */}
<Progress 
  value={75} 
  className="h-3"
  style={{ backgroundColor: 'rgb(232 246 252)' }}
/>

{/* Empowerment */}
<Progress 
  value={60} 
  className="h-3"
  style={{ backgroundColor: 'rgb(251 232 240)' }}
/>

{/* Environment */}
<Progress 
  value={45} 
  className="h-3"
  style={{ backgroundColor: 'rgb(243 248 229)' }}
/>

{/* Education */}
<Progress 
  value={90} 
  className="h-3"
  style={{ backgroundColor: 'rgb(254 243 229)' }}
/>
```

---

## Typography Changes

### Heading Colors

```tsx
{/* Before - all using red or default */}
<h1 className="text-primary">Title</h1>
<h2 className="text-primary">Subtitle</h2>

{/* After - Ocean Blue hierarchy */}
<h1 style={{ color: 'rgb(11 95 138)' }}>Title</h1>         {/* Primary Dark */}
<h2 style={{ color: 'rgb(11 95 138)' }}>Subtitle</h2>      {/* Primary Dark */}
<h3 style={{ color: 'rgb(63 171 222)' }}>Section</h3>      {/* Primary */}
<h4 style={{ color: 'rgb(33 37 41)' }}>Subsection</h4>     {/* Text Main */}
```

---

## Gradients

### New Gradient Options

```css
/* Primary Gradient */
background: linear-gradient(135deg, rgb(63 171 222) 0%, rgb(11 95 138) 100%);

/* Pillar Rainbow */
background: linear-gradient(135deg, 
  rgb(214 51 108) 0%,      /* Empowerment */
  rgb(245 158 11) 50%,     /* Education */
  rgb(149 193 31) 100%     /* Environment */
);

/* Soft Background */
background: linear-gradient(to bottom, rgb(232 246 252) 0%, rgb(255 255 255) 100%);

/* Radial Overlay */
background: radial-gradient(circle at top right, rgb(63 171 222 / 0.1) 0%, transparent 100%);
```

---

## Real-World Example: Donation Card

### Before (Red Theme)

```tsx
<Card>
  <CardHeader>
    <Badge className="bg-primary">Urgent</Badge>
    <CardTitle>Support Our Cause</CardTitle>
  </CardHeader>
  <CardContent>
    <Progress value={45} />
    <Button className="bg-primary w-full mt-4">
      Donate Now
    </Button>
  </CardContent>
</Card>
```

### After (Ocean Blue with Pillar)

```tsx
<Card className="overflow-hidden hover:shadow-lg transition-all">
  {/* Hero image with gradient overlay */}
  <div 
    className="h-48 bg-cover bg-center relative"
    style={{
      backgroundImage: 'url(...)',
    }}
  >
    <div className="absolute inset-0" 
         style={{ background: 'linear-gradient(to top, rgb(11 95 138 / 0.9) 0%, transparent 100%)' }} 
    />
    <div className="absolute bottom-4 left-4 right-4">
      {/* Pillar badge */}
      <Badge style={{ backgroundColor: 'rgb(149 193 31)', color: 'white' }}>
        <Leaf className="w-3 h-3 mr-1" />
        Environment
      </Badge>
      <h3 className="text-2xl font-bold text-white">
        Clean Water Initiative
      </h3>
    </div>
  </div>
  
  <CardContent className="p-6">
    <div className="mb-4">
      <div className="flex justify-between mb-2 text-sm">
        <span style={{ color: 'rgb(108 117 125)' }}>₹45,000 raised</span>
        <span style={{ color: 'rgb(11 95 138)' }} className="font-semibold">
          ₹100,000 goal
        </span>
      </div>
      {/* Progress with light background */}
      <Progress 
        value={45} 
        className="h-2"
        style={{ backgroundColor: 'rgb(243 248 229)' }}
      />
    </div>
    
    {/* Primary CTA */}
    <Button 
      className="w-full" 
      style={{ backgroundColor: 'rgb(63 171 222)', color: 'white' }}
    >
      <Heart className="w-4 h-4 mr-2" />
      Donate Now
    </Button>
  </CardContent>
</Card>
```

---

## CSS Variable Names

### Global CSS Variables

```css
/* Use these in your CSS */
--brand-primary          /* #3FABDE */
--brand-primary-dark     /* #0B5F8A */
--primary-light          /* Light blue background */

--accent-empowerment     /* #D6336C */
--accent-environment     /* #95C11F */
--accent-education       /* #F59E0B */

--success                /* #16A34A */
--warning                /* #F59E0B */
--danger                 /* #DC2626 */
--info                   /* #2563EB */

--text-main              /* #212529 */
--text-muted             /* #6C757D */
--border                 /* #E5E7EB */
--bg-soft                /* #F8F9FA */
```

### Usage in Components

```css
.custom-button {
  background-color: rgb(var(--brand-primary));
  color: white;
}

.custom-button:hover {
  background-color: rgb(var(--brand-primary-dark));
}

.pillar-badge {
  background-color: rgb(var(--accent-empowerment));
  color: white;
}
```

---

## Search & Replace Patterns

Use these patterns to help migrate existing code:

### Find (Red Theme)

```
bg-primary
text-primary
border-primary
#EA2A33
oklch(0.55 0.22 25)
```

### Replace With (Ocean Blue)

```
bg-brand-primary
text-brand-primary
border-brand-primary
rgb(63 171 222) or #3FABDE
rgb(63 171 222)
```

---

## Testing Checklist

- [ ] All buttons use new primary color
- [ ] Hover states show primary-dark
- [ ] Headings use correct color hierarchy (h1/h2: dark, h3: primary)
- [ ] Pillar colors applied to relevant programs/categories
- [ ] Semantic colors used for success/error/warning/info states
- [ ] Progress bars have light-colored tracks
- [ ] Cards have appropriate hover effects
- [ ] Focus rings visible on all interactive elements
- [ ] Links change color on hover
- [ ] Badges use appropriate colors
- [ ] Alerts use semantic colors with proper contrast

---

## Need Help?

1. **Demo Page:** Visit `/demo/new-brand-theme` to see all components in action
2. **Full Plan:** Check `docs/NEW_BRAND_THEME_PLAN.md` for complete implementation details
3. **CSS File:** Import `styles/theme-ocean-blue.css` for ready-to-use styles
4. **Tailwind Config:** Use `docs/tailwind-ocean-theme-config.ts` for Tailwind setup

---

**Quick Start:**

1. Import the new CSS: `@import 'styles/theme-ocean-blue.css'`
2. Update primary colors from red to ocean blue
3. Add pillar colors to categorized content
4. Test all interactive states
5. Verify accessibility (contrast ratios)

---

Last Updated: December 20, 2025
