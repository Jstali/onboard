# 🎨 NXZEN Brand Typography System

## Overview
This guide outlines the complete typography system implemented across the NXZEN Employee Portal, based on the official brand guide specifications.

## 📝 Font Families

### Primary Fonts (Brand Guide)
- **HEADING**: `Canela` (Thin Italic) - Web Safe: `Times New Roman Italic`
- **SUBHEADING**: `Corporative Sans Rounded` (Bold + All Caps) - Web Safe: `Arial Rounded MT Bold`
- **BODY**: `Corporative Sans Rounded` (Regular) - Web Safe: `Calibri Regular`
- **HIGHLIGHT**: `Testimonia` (Regular) - Web Safe: `Brush Script MT`

### Font Stacks (Tailwind Config)
```javascript
fontFamily: {
  'heading': ['Canela', 'Times New Roman', 'serif'],
  'subheading': ['Corporative Sans Rounded', 'Arial Rounded MT Bold', 'Arial', 'sans-serif'],
  'body': ['Corporative Sans Rounded', 'Calibri', 'Arial', 'sans-serif'],
  'highlight': ['Testimonia', 'Brush Script MT', 'cursive'],
}
```

## 🎯 Typography Scale

### Headings
- **XL**: `3.5rem` (56px) - Line Height: 1.1, Letter Spacing: 0
- **LG**: `2.5rem` (40px) - Line Height: 1.2, Letter Spacing: 0
- **MD**: `2rem` (32px) - Line Height: 1.3, Letter Spacing: 0
- **SM**: `1.5rem` (24px) - Line Height: 1.4, Letter Spacing: 0

### Subheadings
- **LG**: `1.25rem` (20px) - Line Height: 1.3, Letter Spacing: 0.1em
- **MD**: `1.125rem` (18px) - Line Height: 1.4, Letter Spacing: 0.1em
- **SM**: `1rem` (16px) - Line Height: 1.5, Letter Spacing: 0.1em

### Body Text
- **LG**: `1.125rem` (18px) - Line Height: 1.6, Letter Spacing: 0
- **MD**: `1rem` (16px) - Line Height: 1.6, Letter Spacing: 0
- **SM**: `0.875rem` (14px) - Line Height: 1.5, Letter Spacing: 0

### Highlight
- **Base**: `1rem` (16px) - Line Height: 1.4, Letter Spacing: 0

## 🎨 Utility Classes

### Brand Typography Classes
```css
/* Headings */
.brand-heading-xl    /* 3.5rem, Canela Thin Italic */
.brand-heading-lg    /* 2.5rem, Canela Thin Italic */
.brand-heading-md    /* 2rem, Canela Thin Italic */
.brand-heading-sm    /* 1.5rem, Canela Thin Italic */

/* Subheadings */
.brand-subheading-lg /* 1.25rem, Corporative Sans Rounded Bold + All Caps */
.brand-subheading-md /* 1.125rem, Corporative Sans Rounded Bold + All Caps */
.brand-subheading-sm /* 1rem, Corporative Sans Rounded Bold + All Caps */

/* Body Text */
.brand-body-lg       /* 1.125rem, Corporative Sans Rounded Regular */
.brand-body-md       /* 1rem, Corporative Sans Rounded Regular */
.brand-body-sm       /* 0.875rem, Corporative Sans Rounded Regular */

/* Highlight */
.brand-highlight     /* 1rem, Testimonia Regular Italic */
```

### Fallback Classes (Web Safe)
```css
.brand-heading-safe     /* Times New Roman Italic */
.brand-subheading-safe  /* Arial Rounded MT Bold */
.brand-body-safe        /* Calibri Regular */
.brand-highlight-safe   /* Brush Script MT */
```

## 🎯 Usage Guidelines

### When to Use Each Font

#### Headings (Canela)
- **Use for**: Main page titles, section headers, hero text
- **Examples**: "Employee Portal", "Manager Dashboard", "Company Policies"
- **Style**: Always italic, thin weight, elegant serif

#### Subheadings (Corporative Sans Rounded)
- **Use for**: Section titles, card headers, navigation labels
- **Examples**: "ATTENDANCE MANAGEMENT", "LEAVE REQUESTS", "EMPLOYEE LIST"
- **Style**: Always bold, all caps, wide letter spacing

#### Body Text (Corporative Sans Rounded)
- **Use for**: Paragraphs, descriptions, form labels, general content
- **Examples**: Policy descriptions, form instructions, table data
- **Style**: Regular weight, normal case, comfortable line height

#### Highlight (Testimonia)
- **Use for**: Special emphasis, callouts, decorative text
- **Examples**: Important notices, special announcements, decorative elements
- **Style**: Regular weight, italic, distinctive script style

## 🎨 Color Integration

### Text Colors
- **Primary**: `text-deep-space-black` (#030304)
- **Secondary**: `text-deep-space-black/80` (80% opacity)
- **Muted**: `text-deep-space-black/70` (70% opacity)
- **Accent**: `text-neon-violet` (#AD96DC) for highlights

### Background Integration
- **Default**: `bg-iridescent-pearl` (#F6F2F4)
- **Cards**: `bg-white` with subtle borders
- **Headers**: `bg-white` with shadow

## 📱 Responsive Considerations

### Mobile Typography
- Reduce heading sizes by one level on mobile
- Maintain readable body text sizes (minimum 16px)
- Ensure adequate touch targets for interactive elements

### Accessibility
- Maintain sufficient color contrast ratios
- Use semantic HTML elements (h1, h2, p, etc.)
- Ensure text is scalable up to 200% without horizontal scrolling

## 🔧 Implementation Examples

### Login Page
```jsx
<h1 className="brand-heading-lg text-white">nxzen</h1>
<p className="brand-subheading-md text-white/80">Employee Portal</p>
<label className="brand-body-sm text-white">Email Address</label>
```

### Dashboard
```jsx
<h1 className="brand-heading-md text-deep-space-black">Manager Dashboard</h1>
<p className="brand-body-sm text-deep-space-black/70">Total Employees</p>
<span className="brand-subheading-sm text-deep-space-black">EMPLOYEE LIST</span>
```

### Forms
```jsx
<label className="brand-body-sm text-deep-space-black">Field Label</label>
<input className="brand-body-md text-deep-space-black" />
<button className="brand-subheading-sm">SUBMIT</button>
```

## 🚀 Future Enhancements

### Font Loading
Consider implementing web font loading for better performance:
```css
@font-face {
  font-family: 'Canela';
  src: url('/fonts/Canela-ThinItalic.woff2') format('woff2');
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}
```

### Advanced Typography
- Implement fluid typography for better responsive scaling
- Add more granular font weight options
- Create specialized classes for specific use cases

## 📋 Checklist for New Components

When creating new components, ensure:

- [ ] Use appropriate brand typography classes
- [ ] Maintain consistent color hierarchy
- [ ] Follow responsive typography guidelines
- [ ] Test accessibility and readability
- [ ] Validate against brand guide specifications

---

*This typography system ensures consistent, professional, and brand-aligned text presentation across the entire NXZEN Employee Portal.*
