export type StepId =
  | "duration"
  | "categories"
  | "equipment"
  | "body-groups"
  | "videos"
  | "summary";

export interface StepDefinition {
  id: StepId;
  /** 1-based, matching the numbers shown in the progress bar. */
  number: number;
  path: string;
  /** Short form for the progress bar. */
  label: string;
  icon: string;
  heading: string;
  description: string;
}

export const STEPS: StepDefinition[] = [
  {
    id: "duration",
    number: 1,
    path: "/duration",
    label: "Duration",
    icon: "⏱️",
    heading: "Duration Settings",
    description: "Configure your workout timing parameters",
  },
  {
    id: "categories",
    number: 2,
    path: "/categories",
    label: "Categories",
    icon: "📂",
    heading: "Exercise Categories",
    description: "Select the types of exercises you want in your workout",
  },
  {
    id: "equipment",
    number: 3,
    path: "/equipment",
    label: "Equipment",
    icon: "🏋️",
    heading: "Equipment",
    description: "Choose the equipment you have available",
  },
  {
    id: "body-groups",
    number: 4,
    path: "/body-groups",
    label: "Body Groups",
    icon: "🧍",
    heading: "Body Groups",
    description: "Select which body parts to focus on",
  },
  {
    id: "videos",
    number: 5,
    path: "/videos",
    label: "Videos",
    icon: "🎬",
    heading: "Exercise Video Selection",
    description: "Choose specific exercises for your workout",
  },
  {
    id: "summary",
    number: 6,
    path: "/summary",
    label: "Summary",
    icon: "📋",
    heading: "Final Summary",
    description: "Review your workout configuration and generate the video",
  },
];

export const FIRST_STEP = STEPS[0];
export const LAST_STEP = STEPS[STEPS.length - 1];

export function stepByPath(pathname: string): StepDefinition | undefined {
  return STEPS.find((step) => step.path === pathname);
}

export function stepById(id: StepId): StepDefinition {
  const step = STEPS.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`Unknown step: ${id}`);
  return step;
}
