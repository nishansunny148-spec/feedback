import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        raised: token('bg-raised'),
        card: token('bg-card'),
        fg: {
          DEFAULT: token('fg'),
          2: token('fg-2'),
          3: token('fg-3'),
        },
        accent: {
          DEFAULT: token('accent'),
          ink: token('accent-ink'),
          fg: token('accent-fg'),
        },
        rec: token('rec'),
        success: token('success'),
        warning: token('warning'),
        danger: {
          DEFAULT: token('danger'),
          ink: token('danger-ink'),
        },
        ring: token('ring'),
        line: {
          DEFAULT: 'rgb(var(--line) / var(--line-a))',
          strong: 'rgb(var(--line) / var(--line-strong-a))',
        },
      },
      fontFamily: {
        // Gotham has no Gujarati glyphs; the browser falls through to Noto Sans Gujarati per glyph.
        sans: ['Gotham', 'Montserrat', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
      },
      // Only Gotham Book (400) and Bold (700) ship; map in-between weights onto them.
      fontWeight: {
        medium: '400',
        semibold: '700',
      },
      borderRadius: {
        control: '12px',
        card: '20px',
        hero: '28px',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        lift: 'var(--shadow-lift)',
      },
      maxWidth: {
        form: '560px',
        admin: '1280px',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        indeterminate: 'indeterminate 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
