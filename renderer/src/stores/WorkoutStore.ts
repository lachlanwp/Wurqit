import { makeAutoObservable, runInAction } from "mobx";
import type {
  ExerciseVideo,
  GenerateWorkoutRequest,
  PersistedSettings,
} from "@shared/ipc";
import { api, errorMessage, plain } from "@/api/wurqit";
import type { StepId } from "./steps";

export type TimingKey =
  | "workDuration"
  | "restDuration"
  | "setsPerStation"
  | "stationRest"
  | "totalWorkoutDuration";

export const TIMING_KEYS: TimingKey[] = [
  "workDuration",
  "restDuration",
  "setsPerStation",
  "stationRest",
  "totalWorkoutDuration",
];

/** Tracks an async list that the user picks from. */
class SelectionList<T extends string = string> {
  options: T[] = [];
  selected: T[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isSelected() {
    const selected = new Set<string>(this.selected);
    return (value: string) => selected.has(value);
  }

  toggle(value: T, checked: boolean) {
    if (!checked) {
      this.selected = this.selected.filter((item) => item !== value);
      return;
    }
    // Guard against double-adding: a duplicate would inflate the selection
    // count that validation checks and be sent to the generator twice.
    if (this.selected.includes(value)) return;
    this.selected = [...this.selected, value];
  }

  /**
   * Applies a new set of options, keeping whichever of `preferred` (falling
   * back to the current selection) still exist. Without this, reloading a
   * derived list would discard choices the user had already made further down
   * the wizard even when they remain valid.
   */
  replaceOptions(options: T[], preferred?: T[]) {
    const available = new Set<string>(options);
    const candidates = preferred ?? this.selected;
    this.options = options;
    // A persisted selection is untrusted input, so it is de-duplicated as well
    // as filtered against what the library currently offers.
    this.selected = [...new Set(candidates)].filter((value) =>
      available.has(value)
    );
  }

  reset() {
    this.options = [];
    this.selected = [];
    this.error = null;
  }
}

export class WorkoutStore {
  workDuration: number | null = null;
  restDuration: number | null = null;
  setsPerStation: number | null = null;
  stationRest: number | null = null;
  totalWorkoutDuration: number | null = null;

  categories = new SelectionList();
  equipment = new SelectionList();
  bodyGroups = new SelectionList();

  availableVideos: ExerciseVideo[] = [];
  selectedVideoPaths: string[] = [];
  videosLoading = false;
  videosError: string | null = null;

  outputPath: string | null = null;
  outputPathError: string | null = null;

  /** Set once the user has attempted to leave a step, so errors are not shown
   *  on a form the user has not filled in yet. */
  touched = new Set<StepId>();

  /** Guards against out-of-order responses when selections change quickly. */
  private loadToken = 0;

  constructor() {
    makeAutoObservable<WorkoutStore, "loadToken">(this, { loadToken: false });
  }

  // ---------------------------------------------------------------- timings

  get timings() {
    return {
      workDuration: this.workDuration,
      restDuration: this.restDuration,
      setsPerStation: this.setsPerStation,
      stationRest: this.stationRest,
      totalWorkoutDuration: this.totalWorkoutDuration,
    };
  }

  get timingsComplete(): boolean {
    return TIMING_KEYS.every((key) => this[key] !== null);
  }

  setTiming(key: TimingKey, value: number | null) {
    this[key] = value;
    // Timings do not change which exercises exist, only how many fit, so the
    // selection is trimmed rather than cleared.
    this.trimVideoSelection();
  }

  /** Seconds one exercise station consumes, including its inter-set rests. */
  get secondsPerStation(): number {
    if (!this.timingsComplete) return 0;
    return (
      this.workDuration! * this.setsPerStation! +
      this.restDuration! * (this.setsPerStation! - 1) +
      this.stationRest!
    );
  }

  /** How many exercises fit in the requested total duration. */
  get videoSlots(): number {
    const perStation = this.secondsPerStation;
    if (!perStation) return 0;
    return Math.floor((this.totalWorkoutDuration! * 60) / perStation);
  }

  /**
   * The number of videos the user is actually expected to pick. The slot count
   * is capped by how many clips exist, otherwise a narrow filter combined with
   * a long workout would demand more videos than the library can offer and the
   * step could never be completed.
   */
  get selectionTarget(): number {
    if (this.availableVideos.length === 0) return 0;
    if (this.videoSlots <= 0) return this.availableVideos.length;
    return Math.min(this.videoSlots, this.availableVideos.length);
  }

  // --------------------------------------------------------------- loading

  async loadCategories(preferred?: string[]) {
    this.categories.loading = true;
    this.categories.error = null;
    try {
      const options = await api.getCategories();
      runInAction(() => this.categories.replaceOptions(options, preferred));
    } catch (error) {
      runInAction(() => {
        this.categories.error = errorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.categories.loading = false;
      });
    }
  }

  /**
   * Reloads equipment for the current categories, then cascades into body
   * groups and videos. Each level narrows the next, so they always refresh as
   * one sequence instead of the chain of timeouts the previous UI used.
   */
  async refreshEquipment(preferred?: {
    equipment?: string[];
    bodyGroups?: string[];
    videos?: string[];
  }) {
    const token = ++this.loadToken;

    if (this.categories.selected.length === 0) {
      runInAction(() => {
        this.equipment.reset();
        this.bodyGroups.reset();
        this.clearVideos();
      });
      return;
    }

    this.equipment.loading = true;
    this.equipment.error = null;
    try {
      const options = await api.getEquipment(plain(this.categories.selected));
      if (token !== this.loadToken) return;
      runInAction(() =>
        this.equipment.replaceOptions(options, preferred?.equipment)
      );
    } catch (error) {
      if (token !== this.loadToken) return;
      runInAction(() => {
        this.equipment.error = errorMessage(error);
        this.equipment.options = [];
        this.equipment.selected = [];
      });
    } finally {
      if (token === this.loadToken) {
        runInAction(() => {
          this.equipment.loading = false;
        });
      }
    }

    if (token !== this.loadToken) return;
    await this.refreshBodyGroups(preferred, token);
  }

  async refreshBodyGroups(
    preferred?: { bodyGroups?: string[]; videos?: string[] },
    parentToken?: number
  ) {
    const token = parentToken ?? ++this.loadToken;

    if (
      this.categories.selected.length === 0 ||
      this.equipment.selected.length === 0
    ) {
      runInAction(() => {
        this.bodyGroups.reset();
        this.clearVideos();
      });
      return;
    }

    this.bodyGroups.loading = true;
    this.bodyGroups.error = null;
    try {
      const options = await api.getBodyGroups(
        plain(this.categories.selected),
        plain(this.equipment.selected)
      );
      if (token !== this.loadToken) return;
      runInAction(() =>
        this.bodyGroups.replaceOptions(options, preferred?.bodyGroups)
      );
    } catch (error) {
      if (token !== this.loadToken) return;
      runInAction(() => {
        this.bodyGroups.error = errorMessage(error);
        this.bodyGroups.options = [];
        this.bodyGroups.selected = [];
      });
    } finally {
      if (token === this.loadToken) {
        runInAction(() => {
          this.bodyGroups.loading = false;
        });
      }
    }

    if (token !== this.loadToken) return;
    await this.refreshVideos(preferred?.videos, token);
  }

  async refreshVideos(preferred?: string[], parentToken?: number) {
    const token = parentToken ?? ++this.loadToken;

    if (
      this.categories.selected.length === 0 ||
      this.equipment.selected.length === 0
    ) {
      runInAction(() => this.clearVideos());
      return;
    }

    this.videosLoading = true;
    this.videosError = null;
    try {
      const videos = await api.getAvailableVideos(
        plain(this.categories.selected),
        plain(this.equipment.selected),
        plain(this.bodyGroups.selected)
      );
      if (token !== this.loadToken) return;
      runInAction(() => {
        this.availableVideos = videos;
        const available = new Set(videos.map((video) => video.path));
        const candidates = preferred ?? this.selectedVideoPaths;
        this.selectedVideoPaths = [...new Set(candidates)].filter((path) =>
          available.has(path)
        );
        this.trimVideoSelection();
        // Matches the original behaviour of pre-filling a suggested workout
        // rather than presenting an empty selection.
        if (this.selectedVideoPaths.length === 0 && videos.length > 0) {
          this.randomSelect();
        }
      });
    } catch (error) {
      if (token !== this.loadToken) return;
      runInAction(() => {
        this.videosError = errorMessage(error);
        this.availableVideos = [];
        this.selectedVideoPaths = [];
      });
    } finally {
      if (token === this.loadToken) {
        runInAction(() => {
          this.videosLoading = false;
        });
      }
    }
  }

  private clearVideos() {
    this.availableVideos = [];
    this.selectedVideoPaths = [];
    this.videosError = null;
  }

  // ------------------------------------------------------------- selection

  setCategorySelected(value: string, checked: boolean) {
    this.categories.toggle(value, checked);
    void this.refreshEquipment();
  }

  setEquipmentSelected(value: string, checked: boolean) {
    this.equipment.toggle(value, checked);
    void this.refreshBodyGroups();
  }

  setBodyGroupSelected(value: string, checked: boolean) {
    this.bodyGroups.toggle(value, checked);
    void this.refreshVideos();
  }

  get isVideoSelected() {
    const selected = new Set(this.selectedVideoPaths);
    return (path: string) => selected.has(path);
  }

  get selectedVideos(): ExerciseVideo[] {
    const order = new Map(
      this.selectedVideoPaths.map((path, index) => [path, index])
    );
    return this.availableVideos
      .filter((video) => order.has(video.path))
      .sort((a, b) => order.get(a.path)! - order.get(b.path)!);
  }

  get selectionIsFull(): boolean {
    return (
      this.selectionTarget > 0 &&
      this.selectedVideoPaths.length >= this.selectionTarget
    );
  }

  /**
   * @returns false when the video could not be added because every slot is
   *          taken, so the caller can explain why nothing happened.
   */
  setVideoSelected(path: string, checked: boolean): boolean {
    if (!checked) {
      this.selectedVideoPaths = this.selectedVideoPaths.filter(
        (item) => item !== path
      );
      return true;
    }
    if (this.selectedVideoPaths.includes(path)) return true;
    if (this.selectionIsFull) return false;
    this.selectedVideoPaths = [...this.selectedVideoPaths, path];
    return true;
  }

  toggleVideo(path: string): boolean {
    return this.setVideoSelected(path, !this.isVideoSelected(path));
  }

  selectAll() {
    this.selectedVideoPaths = this.availableVideos
      .slice(0, this.selectionTarget)
      .map((video) => video.path);
  }

  deselectAll() {
    this.selectedVideoPaths = [];
  }

  randomSelect() {
    const shuffled = [...this.availableVideos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.selectedVideoPaths = shuffled
      .slice(0, this.selectionTarget)
      .map((video) => video.path);
  }

  /**
   * Swaps one chosen exercise for a random unchosen one, preserving its
   * position in the workout.
   * @returns false when there is nothing left to swap to.
   */
  swapVideo(path: string): boolean {
    const selected = new Set(this.selectedVideoPaths);
    const candidates = this.availableVideos.filter(
      (video) => !selected.has(video.path)
    );
    if (candidates.length === 0) return false;

    const replacement =
      candidates[Math.floor(Math.random() * candidates.length)];
    this.selectedVideoPaths = this.selectedVideoPaths.map((current) =>
      current === path ? replacement.path : current
    );
    return true;
  }

  private trimVideoSelection() {
    const target = this.selectionTarget;
    if (target > 0 && this.selectedVideoPaths.length > target) {
      this.selectedVideoPaths = this.selectedVideoPaths.slice(0, target);
    }
  }

  // ------------------------------------------------------------ output dir

  setOutputPath(path: string | null) {
    this.outputPath = path;
    if (path) this.outputPathError = null;
  }

  async chooseOutputFolder() {
    try {
      const selected = await api.selectOutputFolder();
      if (selected) runInAction(() => this.setOutputPath(selected));
    } catch (error) {
      runInAction(() => {
        this.outputPathError = `Error selecting folder: ${errorMessage(error)}`;
      });
    }
  }

  // ------------------------------------------------------------ validation

  /** @returns an error message, or null when the step is satisfied. */
  validationError(step: StepId): string | null {
    switch (step) {
      case "duration":
        return this.timingsComplete
          ? null
          : "Please complete all duration settings before proceeding";
      case "categories":
        return this.categories.selected.length > 0
          ? null
          : "Please select at least one category";
      case "equipment":
        return this.equipment.selected.length > 0
          ? null
          : "Please select at least one equipment type";
      case "body-groups":
        // Some equipment has no body-group breakdown; nothing to enforce then.
        if (this.bodyGroups.options.length === 0) return null;
        return this.bodyGroups.selected.length > 0
          ? null
          : "Please select at least one body group";
      case "videos":
        if (this.selectedVideoPaths.length === 0)
          return "Please select at least one exercise video";
        if (this.selectedVideoPaths.length < this.selectionTarget)
          return `Please select all ${this.selectionTarget} available video slots for your workout duration`;
        return null;
      case "summary":
        return this.outputPath
          ? null
          : "Please select a folder to save the video";
    }
  }

  isValid(step: StepId): boolean {
    return this.validationError(step) === null;
  }

  /** Field-level errors for the duration step, shown under each control. */
  timingError(key: TimingKey): string | null {
    if (!this.touched.has("duration")) return null;
    return this[key] === null ? "This field is required" : null;
  }

  /** Step-level error, suppressed until the user has tried to move on. */
  visibleError(step: StepId): string | null {
    return this.touched.has(step) ? this.validationError(step) : null;
  }

  markTouched(step: StepId) {
    this.touched = new Set(this.touched).add(step);
  }

  // ----------------------------------------------------------- persistence

  get generateRequest(): GenerateWorkoutRequest | null {
    if (!this.timingsComplete || !this.outputPath) return null;
    return {
      workDuration: this.workDuration!,
      restDuration: this.restDuration!,
      setsPerStation: this.setsPerStation!,
      stationRest: this.stationRest!,
      totalWorkoutDuration: this.totalWorkoutDuration!,
      categories: [...this.categories.selected],
      equipment: [...this.equipment.selected],
      bodyGroups: [...this.bodyGroups.selected],
      selectedVideos: [...this.selectedVideoPaths],
      outputPath: this.outputPath,
    };
  }

  get snapshot(): PersistedSettings {
    return {
      workDuration: this.workDuration,
      restDuration: this.restDuration,
      setsPerStation: this.setsPerStation,
      stationRest: this.stationRest,
      totalWorkoutDuration: this.totalWorkoutDuration,
      categories: [...this.categories.selected],
      equipment: [...this.equipment.selected],
      bodyGroups: [...this.bodyGroups.selected],
      selectedVideos: [...this.selectedVideoPaths],
      outputPath: this.outputPath,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Restores a saved configuration by walking the same dependency chain the UI
   * uses, passing the saved choices down as preferences. Anything that no
   * longer exists in the video library is dropped rather than restored blindly.
   */
  async hydrate(settings: PersistedSettings) {
    runInAction(() => {
      this.workDuration = settings.workDuration;
      this.restDuration = settings.restDuration;
      this.setsPerStation = settings.setsPerStation;
      this.stationRest = settings.stationRest;
      this.totalWorkoutDuration = settings.totalWorkoutDuration;
      this.outputPath = settings.outputPath;
    });

    await this.loadCategories(settings.categories ?? []);
    if (this.categories.selected.length === 0) return;

    await this.refreshEquipment({
      equipment: settings.equipment ?? [],
      bodyGroups: settings.bodyGroups ?? [],
      videos: settings.selectedVideos ?? [],
    });
  }
}
