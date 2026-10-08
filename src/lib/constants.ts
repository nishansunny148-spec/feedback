import type { Satisfaction } from '../types/feedback';

/* ───────────────────────── Branding ───────────────────────── */

/** Swap to '/sfumato-logo.svg' once an SVG export is available in /public. */
export const LOGO_SRC = '/sfumato-logo.png';
export const LOGO_ALT = 'Sfumato';

/* ───────────────────────── Public form ───────────────────────── */

export const COMPANY_NAME_MAX = 120;

/** Replace with the real question text when it is final. */
export const QUESTION_1_LABEL = 'Question 1';
export const QUESTION_2_LABEL =
  'પ્રોજેક્ટ શરૂ કરતા પહેલાં અમારી ટીમ તમારી બ્રાન્ડ, વ્યવસાયિક જરૂરિયાતો અને અપેક્ષાઓને કેટલી સારી રીતે સમજે છે?';

/** Allowed values, in display order. Must match the CHECK in the submit_feedback RPC. */
export const SATISFACTION_VALUES = ['excellent', 'satisfactory', 'wants_improvements'] as const satisfies readonly Satisfaction[];

export type SatisfactionTone = 'success' | 'warning' | 'danger';

export interface SatisfactionOption {
  value: Satisfaction;
  /** English label (first line). */
  en: string;
  /** Gujarati label (second line, smaller). */
  gu: string;
  /** Short admin label used in stats and filters. */
  short: string;
  tone: SatisfactionTone;
}

export const SATISFACTION_OPTIONS: readonly SatisfactionOption[] = [
  { value: 'excellent', en: 'Excellent', gu: 'ખૂબ જ સારું', short: 'Excellent', tone: 'success' },
  { value: 'satisfactory', en: 'Satisfactory', gu: 'સંતોષકારક', short: 'Satisfactory', tone: 'warning' },
  {
    value: 'wants_improvements',
    en: 'Wants Improvements',
    gu: 'સુધારાની જરૂર છે',
    short: 'Needs work',
    tone: 'danger',
  },
];

export function isSatisfaction(v: unknown): v is Satisfaction {
  return typeof v === 'string' && (SATISFACTION_VALUES as readonly string[]).includes(v);
}

export function getSatisfactionOption(v: Satisfaction): SatisfactionOption {
  const found = SATISFACTION_OPTIONS.find((o) => o.value === v);
  // SATISFACTION_OPTIONS covers every Satisfaction value, so this fallback is unreachable.
  return found ?? SATISFACTION_OPTIONS[0];
}
