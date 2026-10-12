import type { Choice } from '../types/feedback';

/* ───────────────────────── Branding ───────────────────────── */

/** Swap to '/sfumato-logo.svg' once an SVG export is available in /public. */
export const LOGO_SRC = '/sfumato-logo-black.png';
export const LOGO_ALT = 'Sfumato – Branding & Advertising Agency';

/* ───────────────────────── Questions ───────────────────────── */

export interface QuestionDef {
  no: number;
  en: string;
  gu: string;
  label?: string;
}

export const QUESTIONS: readonly QuestionDef[] = [
  {
    no: 1,
    en: 'How well does our team understand your brand, business requirements, and expectations before starting a project?',
    gu: 'પ્રોજેક્ટ શરૂ કરતા પહેલાં અમારી ટીમ તમારી બ્રાન્ડ, વ્યવસાયિક જરૂરિયાતો અને અપેક્ષાઓને કેટલી સારી રીતે સમજે છે?',
    label: 'પ્રોજેક્ટ શરૂ કરતા પહેલાં અમારી ટીમ તમારી બ્રાન્ડ, વ્યવસાયિક જરૂરિયાતો અને અપેક્ષાઓને કેટલી સારી રીતે સમજે છે?',
  },
  {
    no: 2,
    en: 'How would you rate the quality and visual appeal of our creative designs in relation to your brand?',
    gu: 'તમારી બ્રાન્ડને અનુરૂપ અમારી ક્રિએટિવ ડિઝાઇનની ગુણવત્તા, વિઝ્યુઅલસ ને તમે શું રેટિંગ કરશો?',
    label: 'તમારી બ્રાન્ડને અનુરૂપ અમારી ક્રિએટિવ ડિઝાઇનની ગુણવત્તા, વિઝ્યુઅલસ ને તમે શું રેટિંગ કરશો?',
  },
  {
    no: 3,
    en: 'How would you rate the quality, creativity, storytelling, and visual impact of the videos and motion content created by our team?',
    gu: 'અમારી ટીમ દ્વારા બનાવવામાં આવતા વીડિયો અને મોશન કન્ટેન્ટની ક્વોલિટી, ક્રિએટિવિટી, સ્ટોરીટેલિંગ અને વિઝ્યુઅલ ઇમ્પેક્ટને તમે શું રેટિંગ કરશો?',
    label: 'અમારી ટીમ દ્વારા બનાવવામાં આવતા વીડિયો અને મોશન કન્ટેન્ટની ક્વોલિટી, ક્રિએટિવિટી, સ્ટોરીટેલિંગ અને વિઝ્યુઅલ ઇમ્પેક્ટને તમે શું રેટિંગ કરશો?',
  },
  {
    no: 4,
    en: 'How would you rate the realism, detailing, creativity, and overall presentation of our 3D work?',
    gu: 'અમારા 3D કામની રિયાલિટી, ડિટેલિંગ, ક્રિએટિવિટી અને ઓવરઓલ પ્રેઝન્ટેશનને તમે શું રેટિંગ આપશો?',
    label: 'અમારા 3D કામની રિયાલિટી, ડિટેલિંગ, ક્રિએટિવિટી અને ઓવરઓલ પ્રેઝન્ટેશનને તમે શું રેટિંગ આપશો?',
  },
  {
    no: 5,
    en: "How would you rate our team's ability to understand your requirements and minimize unnecessary design or creative revisions?",
    gu: 'તમારી જરૂરિયાતોને યોગ્ય રીતે સમજીને બિનજરૂરી ડિઝાઇન અથવા ક્રિએટિવ રિવિઝન ઘટાડવાની અમારી ટીમની ક્ષમતાને તમે શું રેટિંગ આપશો?',
    label: 'તમારી જરૂરિયાતોને યોગ્ય રીતે સમજીને બિનજરૂરી ડિઝાઇન અથવા ક્રિએટિવ રિવિઝન ઘટાડવાની અમારી ટીમની ક્ષમતાને તમે શું રેટિંગ આપશો?',
  },
  {
    no: 6,
    en: "How would you rate our team's communication, coordination, responsiveness, and support throughout the project?",
    gu: 'સમગ્ર પ્રોજેક્ટ દરમિયાન અમારી ટીમનું કમ્યુનિકેશન, કોઓર્ડિનેશન, રિસ્પોન્સિવનેસ અને સપોર્ટને તમે શું રેટિંગ આપશો?',
    label: 'સમગ્ર પ્રોજેક્ટ દરમિયાન અમારી ટીમનું કમ્યુનિકેશન, કોઓર્ડિનેશન, રિસ્પોન્સિવનેસ અને સપોર્ટને તમે શું રેટિંગ આપશો?',
  },
  {
    no: 7,
    en: 'How well does the final output of your project reflect your vision, requirements, and expectations?',
    gu: 'આપનો લાસ્ટ પ્રોજેક્ટ તમારી વિઝન, જરૂરિયાતો અને અપેક્ષાઓને કેટલી સારી રીતે રજૂ કરે છે?',
    label: 'આપનો લાસ્ટ પ્રોજેક્ટ તમારી વિઝન, જરૂરિયાતો અને અપેક્ષાઓને કેટલી સારી રીતે રજૂ કરે છે?',
  },
  {
    no: 8,
    en: 'How satisfied are you with our ability to consistently deliver quality work on time?',
    gu: 'ગુણવત્તાયુક્ત કામ સમયસર અને સતત પ્રદાન કરવાની અમારી ક્ષમતાથી તમે કેટલા સંતુષ્ટ છો?',
    label: 'ગુણવત્તાયુક્ત કામ સમયસર અને સતત પ્રદાન કરવાની અમારી ક્ષમતાથી તમે કેટલા સંતુષ્ટ છો?',
  },
  {
    no: 9,
    en: 'Overall, how satisfied are you with the brand value and quality of work you receive from Sfumato in relation to your investment?',
    gu: 'એકંદરે, તમારા દ્વારા કરવામાં આવેલા રોકાણની સામે Sfumato તરફથી મળતી બ્રાન્ડ વેલ્યુ અને વર્ક ક્વોલિટીથી તમે કેટલા સંતુષ્ટ છો?',
    label: 'એકંદરે, તમારા દ્વારા કરવામાં આવેલા રોકાણની સામે Sfumato તરફથી મળતી બ્રાન્ડ વેલ્યુ અને વર્ક ક્વોલિટીથી તમે કેટલા સંતુષ્ટ છો?',
  },
] as const;

export const QUESTION_1_LABEL = QUESTIONS[0].gu;
export const QUESTION_2_LABEL = QUESTIONS[1].gu;

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

