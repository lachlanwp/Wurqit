import { makeAutoObservable } from "mobx";
import {
  FIRST_STEP,
  LAST_STEP,
  STEPS,
  stepByPath,
  type StepDefinition,
  type StepId,
} from "./steps";
import type { WorkoutStore } from "./WorkoutStore";
import type { ToastStore } from "./ToastStore";

type Navigator = (path: string) => void;

/**
 * Owns wizard progression: which step is showing, how far the user has got,
 * and whether a given step may be entered. The router remains the source of
 * truth for the current location; this store mirrors it and drives it.
 */
export class WizardStore {
  currentStepId: StepId = FIRST_STEP.id;
  /** The furthest step reached, so completed steps stay clickable. */
  furthestNumber = FIRST_STEP.number;

  private navigate: Navigator = () => {};

  constructor(
    private readonly workout: WorkoutStore,
    private readonly toasts: ToastStore
  ) {
    makeAutoObservable<WizardStore, "workout" | "toasts" | "navigate">(this, {
      workout: false,
      toasts: false,
      navigate: false,
    });
  }

  setNavigator(navigate: Navigator) {
    this.navigate = navigate;
  }

  /** Called by the router bridge whenever the location changes. */
  syncLocation(pathname: string) {
    const step = stepByPath(pathname);
    if (!step) return;
    this.currentStepId = step.id;
    if (step.number > this.furthestNumber) {
      this.furthestNumber = step.number;
    }
  }

  get steps(): StepDefinition[] {
    return STEPS;
  }

  get currentStep(): StepDefinition {
    return STEPS.find((step) => step.id === this.currentStepId) ?? FIRST_STEP;
  }

  get isFirstStep(): boolean {
    return this.currentStep.number === FIRST_STEP.number;
  }

  get isLastStep(): boolean {
    return this.currentStep.number === LAST_STEP.number;
  }

  get nextStep(): StepDefinition | null {
    return STEPS[this.currentStep.number] ?? null;
  }

  get previousStep(): StepDefinition | null {
    return STEPS[this.currentStep.number - 2] ?? null;
  }

  /** A step is reachable once it has been reached at least once. */
  canVisit(step: StepDefinition): boolean {
    return step.number <= this.furthestNumber;
  }

  /**
   * Shows an error state on a step in the progress bar only once the user has
   * moved past it — flagging a step the user has not filled in yet is noise.
   */
  hasError(step: StepDefinition): boolean {
    if (step.number >= this.currentStep.number) return false;
    return !this.workout.isValid(step.id);
  }

  isComplete(step: StepDefinition): boolean {
    return step.number < this.currentStep.number && !this.hasError(step);
  }

  goNext() {
    const next = this.nextStep;
    if (!next) return;

    const error = this.workout.validationError(this.currentStepId);
    if (error) {
      this.workout.markTouched(this.currentStepId);
      this.toasts.show(error, "warning");
      return;
    }

    this.goTo(next);
  }

  goBack() {
    const previous = this.previousStep;
    if (previous) this.goTo(previous);
  }

  goTo(step: StepDefinition) {
    this.currentStepId = step.id;
    if (step.number > this.furthestNumber) this.furthestNumber = step.number;
    this.navigate(step.path);
  }

  /** Used after generation finishes to drop the user back on the summary. */
  goToSummary() {
    this.goTo(LAST_STEP);
  }
}
