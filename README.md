# ft_transcendence


can the theme toggle button change to little moon when it is in the light theme?
can we improve the the little sun and moon icons? maybe we can use the ones from the vercel project (/vercelDesignV6/components/theme-toggle.tsx) or we can create our own icons based on the ones from the vercel project. The icons should be simple and easy to understand. The sun icon should be a circle with rays coming out of it and the moon icon should be a crescent shape. The icons should be white in the dark theme and black in the light theme. The icons should also have a hover effect that changes their color to the primary color of the theme.





Consider the current theme the dark theme. It will be the default theme of the project. The light theme will be implemented later on. The dark theme is based on the dark theme of this vercel project. The light theme will be based on the light theme of this vercel project. The button to change theme will be based on the one from the vercel project or if possible use the same.

like the vercel project, the navbar will still be the same from the dark theme, but the background will be changed to the light theme background. The text color will also be changed to the light theme text color. The button to change theme will also be changed to the light theme button.Current balance card will also be the same as the dark theme.

Use vercel project hover effects for light and dark themes.












---

## MiniBank Theme System

**Brand identity** is derived from the MiniBank logo, which features deep navy blue (`#0b1a30`) and teal/cyan (`#17b5ba`). The entire palette is built around shades of blue, teal, and white.

**Fonts:** Inter (body/sans) and Space Grotesk (mono/numbers).

**Border radius:** `0.75rem` globally.

---

### Light Theme

| Token | Value | Role
|-----|-----|-----
| `background` | `#eef3fa` | Blue-tinted off-white page background
| `foreground` | `#0b1a30` | Deep navy body text
| `card` | `#ffffff` | Pure white card surfaces
| `card-foreground` | `#0b1a30` | Deep navy text on cards
| `popover` | `#ffffff` | White popover background
| `popover-foreground` | `#0b1a30` | Deep navy popover text
| `primary` | `#0c7c80` | Dark teal (brand action color)
| `primary-foreground` | `#ffffff` | White text on primary
| `secondary` | `#e2ecf7` | Light blue-gray surfaces
| `secondary-foreground` | `#0f2041` | Navy text on secondary
| `muted` | `#e2ecf7` | Light blue-gray muted surfaces
| `muted-foreground` | `#3d5a80` | Medium navy for secondary text
| `accent` | `#1777a8` | Medium blue accent
| `accent-foreground` | `#ffffff` | White text on accent
| `destructive` | `#dc2626` | Red for errors/destructive
| `border` | `#a3bfdb` | Visible blue-tinted borders
| `input` | `#b4cce3` | Slightly lighter blue input borders
| `ring` | `#0c7c80` | Teal focus rings


### Dark Theme (default)

| Token | Value | Role
|-----|-----|-----
| `background` | `#0a1628` | Deep dark navy page background
| `foreground` | `#f0f4ff` | Very light blue-white text
| `card` | `#0f2041` | Slightly lighter navy card surfaces
| `card-foreground` | `#f0f4ff` | Light blue-white text on cards
| `popover` | `#0f2041` | Navy popover background
| `popover-foreground` | `#f0f4ff` | Light text in popovers
| `primary` | `#17b5ba` | Bright teal (brand action color, brighter than light mode)
| `primary-foreground` | `#ffffff` | White text on primary
| `secondary` | `#163057` | Medium navy surfaces
| `secondary-foreground` | `#c8daf5` | Light blue text on secondary
| `muted` | `#122848` | Dark navy muted surfaces
| `muted-foreground` | `#8ba4cb` | Muted blue for secondary text
| `accent` | `#1e9bd7` | Brighter blue accent
| `accent-foreground` | `#ffffff` | White text on accent
| `destructive` | `#ef4444` | Brighter red for dark backgrounds
| `border` | `#1e3a68` | Subtle navy borders
| `input` | `#1e3a68` | Same as border for inputs
| `ring` | `#17b5ba` | Bright teal focus rings


---

### Key Behavioral Differences in Components

1. **Navbar:** Always renders with a fixed dark navy (`#0b1a30`) background and white text in both themes. The logo gets `brightness-0 invert` to appear white on the dark bar.
2. **Balance card:** Always uses a dark gradient (`from-[#0b1a30] via-[#0f2a4a] to-[#0c7c80]`) with white text in both themes -- it acts as a hero/accent element.
3. **Card hover states:** Borders shift to teal-tinted (`hover:border-[#0c7c80]/60` light, `hover:border-[#17b5ba]/50` dark) with elevated shadow (`hover:shadow-md`). Quick stat cards also get a blue-tinted background on hover (`hover:bg-[#eef3fa]` light, `hover:bg-[#122848]` dark).
4. **Table row hover:** Rows highlight with `hover:bg-[#dce8f5]` (visible blue-gray) in light mode, `hover:bg-[#122848]` in dark.
5. **Status badges:** Use opaque, theme-aware backgrounds -- light mode uses `bg-emerald-50`, `bg-amber-50`, `bg-rose-50` with 700-weight text; dark mode uses `bg-{color}-500/10` with 400-weight text.
6. **Transaction type icons:** Same pattern -- `bg-emerald-100 text-emerald-700` (light) vs `bg-emerald-500/15 text-emerald-400` (dark).
7. **Color intensity rule:** Light mode uses darker, more saturated versions of brand colors (`#0c7c80` teal, `#1777a8` blue) for text legibility on white. Dark mode uses brighter, lighter versions (`#17b5ba` teal, `#1e9bd7` blue) for visibility on dark surfaces.
