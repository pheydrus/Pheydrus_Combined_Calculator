/**
 * Client intake questionnaire data model
 * Captures additional context questions for the client-facing assessment
 */

export type PreferredSolution = 'coaching' | 'workshops' | 'self-study' | 'all';
export type CurrentSituation = 'employed' | 'founder' | 'freelancer' | 'student' | 'monetizing';

export interface ClientIntakeData {
  addressMoveDate: string; // free text, e.g. "March 2023" or a date
  desiredOutcome: string; // free text — next 90 days goal
  obstacle: string; // free text — what's blocking them
  preferredSolution: PreferredSolution | '';
  currentSituation: CurrentSituation | '';
  additionalNotes: string; // free text — anything else
}

export const EMPTY_CLIENT_INTAKE: ClientIntakeData = {
  addressMoveDate: '',
  desiredOutcome: '',
  obstacle: '',
  preferredSolution: '',
  currentSituation: '',
  additionalNotes: '',
};

export const PREFERRED_SOLUTION_LABELS: Record<PreferredSolution, string> = {
  coaching: '1:1 Done For You Calls',
  workshops: 'Group Workshops',
  'self-study': 'Self-Study',
  all: 'All of the above',
};

export const CURRENT_SITUATION_LABELS: Record<CurrentSituation, string> = {
  employed: 'Full-time Employed',
  founder: 'Founder / Executive with profitable company',
  freelancer: 'Freelancer',
  student: 'Student',
  monetizing: 'Looking to monetize my work',
};
