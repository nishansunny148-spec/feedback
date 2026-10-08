import type { Choice } from '../types/feedback';

/* ───────────────────────── Branding ───────────────────────── */

/** Swap to '/sfumato-logo.svg' once an SVG export is available in /public. */
export const LOGO_SRC = '/sfumato-logo.png';
export const LOGO_ALT = 'Sfumato';

/* ───────────────────────── Questions ───────────────────────── */

export interface QuestionDef {
  no: number;
  label: string;
}

export const QUESTIONS: readonly QuestionDef[] = [
  {
    no: 1,
    label: 'પ્રોજેક્ટ શરૂ કરતા પહેલાં અમારી ટીમ તમારી બ્રાન્ડ, વ્યવસાયિક જરૂરિયાતો અને અપેક્ષાઓને કેટલી સારી રીતે સમજે છે?',
  },
  {
    no: 2,
    label: 'તમારી બ્રાન્ડને અનુરૂપ અમારી ક્રિએટિવ ડિઝાઇનની ગુણવત્તા, વિઝ્યુઅલસ ને તમે શું રેટિંગ કરશો?',
  },
  {
    no: 3,
    label: 'અમારી ટીમ દ્વારા બનાવવામાં આવતા વીડિયો અને મોશન કન્ટેન્ટની ક્વોલિટી, ક્રિએટિવિટી, સ્ટોરીટેલિંગ અને વિઝ્યુઅલ ઇમ્પેક્ટને તમે શું રેટિંગ કરશો?',
  },
] as const;

export const QUESTION_1_LABEL = QUESTIONS[0].label;
export const QUESTION_2_LABEL = QUESTIONS[1].label;

export const COMPANY_NAME_MAX = 120;

/** Allowed values for question choices. */
export const CHOICE_VALUES = ['excellent', 'satisfactory', 'wants_improvements'] as const satisfies readonly Choice[];

export type SatisfactionTone = 'success' | 'warning' | 'danger';

export interface SatisfactionOption {
  value: Choice;
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

export function isChoice(v: unknown): v is Choice {
  return typeof v === 'string' && (CHOICE_VALUES as readonly string[]).includes(v);
}

export const isSatisfaction = isChoice;

export function getSatisfactionOption(v: Choice): SatisfactionOption {
  const found = SATISFACTION_OPTIONS.find((o) => o.value === v);
  return found ?? SATISFACTION_OPTIONS[0];
}

