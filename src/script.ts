// Disable right-click context menu
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Global variables for video selection
let availableVideos: Array<{
  path: string;
  category: string;
  equipment: string;
  exerciseName: string;
  filename: string;
}> = [];
let selectedVideos: string[] = [];
let maxSelectableVideos: number = 0;

// Populate dropdown options
function populateDropdowns(): void {
  // Work duration: 20-120 seconds in 5-second increments
  const workDurationSelect = document.getElementById(
    "workDuration"
  ) as HTMLSelectElement;
  for (let i = 20; i <= 120; i += 5) {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = `${i} seconds`;
    workDurationSelect.appendChild(option);
  }

  // Rest duration: 5-60 seconds in 5-second increments
  const restDurationSelect = document.getElementById(
    "restDuration"
  ) as HTMLSelectElement;
  for (let i = 5; i <= 60; i += 5) {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = `${i} seconds`;
    restDurationSelect.appendChild(option);
  }

  // Sets per station: 2-6 in 1 set increments
  const setsPerStationSelect = document.getElementById(
    "setsPerStation"
  ) as HTMLSelectElement;
  for (let i = 2; i <= 6; i++) {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = `${i} sets`;
    setsPerStationSelect.appendChild(option);
  }

  // Station rest: 5-40 seconds in 5-second increments
  const stationRestSelect = document.getElementById(
    "stationRest"
  ) as HTMLSelectElement;
  for (let i = 5; i <= 40; i += 5) {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = `${i} seconds`;
    stationRestSelect.appendChild(option);
  }

  // Total workout duration: 10-120 minutes in 10-minute increments
  const totalWorkoutDurationSelect = document.getElementById(
    "totalWorkoutDuration"
  ) as HTMLSelectElement;
  for (let i = 10; i <= 120; i += 10) {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = `${i} minutes`;
    totalWorkoutDurationSelect.appendChild(option);
  }
}

// Load categories from the generator module
async function loadCategories(): Promise<void> {
  try {
    const categories = await window.api.getCategories();
    const container = document.getElementById("categoriesContainer");
    if (!container) return;

    container.innerHTML = "";

    const checkboxGroup = document.createElement("div");
    checkboxGroup.className = "checkbox-group";

    categories.forEach((category) => {
      const checkboxItem = document.createElement("div");
      checkboxItem.className = "checkbox-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `category-${category}`;
      checkbox.value = category;
      checkbox.name = "categories";

      const label = document.createElement("label");
      label.htmlFor = `category-${category}`;
      label.textContent = category;

      checkboxItem.appendChild(checkbox);
      checkboxItem.appendChild(label);
      checkboxGroup.appendChild(checkboxItem);
    });

    container.appendChild(checkboxGroup);
  } catch (error) {
    const container = document.getElementById("categoriesContainer");
    if (container) {
      container.innerHTML = `<div class="error">Error loading categories: ${
        (error as Error).message
      }</div>`;
    }
  }
}

// Load equipment based on selected categories
async function loadEquipment(): Promise<void> {
  try {
    const selectedCategories = getSelectedCategories();
    if (selectedCategories.length === 0) {
      const container = document.getElementById("equipmentContainer");
      if (container) {
        container.innerHTML =
          '<div class="loading">Select categories first to load equipment</div>';
      }
      return;
    }

    const equipment = await window.api.getEquipment(selectedCategories);
    const container = document.getElementById("equipmentContainer");
    if (!container) return;

    container.innerHTML = "";

    const checkboxGroup = document.createElement("div");
    checkboxGroup.className = "checkbox-group";

    equipment.forEach((equip) => {
      const checkboxItem = document.createElement("div");
      checkboxItem.className = "checkbox-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `equipment-${equip}`;
      checkbox.value = equip;
      checkbox.name = "equipment";

      const label = document.createElement("label");
      label.htmlFor = `equipment-${equip}`;
      label.textContent = equip;

      checkboxItem.appendChild(checkbox);
      checkboxItem.appendChild(label);
      checkboxGroup.appendChild(checkboxItem);
    });

    container.appendChild(checkboxGroup);
  } catch (error) {
    const container = document.getElementById("equipmentContainer");
    if (container) {
      container.innerHTML = `<div class="error">Error loading equipment: ${
        (error as Error).message
      }</div>`;
    }
  }
}

// Get selected categories
function getSelectedCategories(): string[] {
  const checkboxes = document.querySelectorAll(
    'input[name="categories"]:checked'
  ) as NodeListOf<HTMLInputElement>;
  return Array.from(checkboxes).map((cb) => cb.value);
}

// Get selected equipment
function getSelectedEquipment(): string[] {
  const checkboxes = document.querySelectorAll(
    'input[name="equipment"]:checked'
  ) as NodeListOf<HTMLInputElement>;
  return Array.from(checkboxes).map((cb) => cb.value);
}

// Load available videos for selection
async function loadAvailableVideos(): Promise<void> {
  try {
    const selectedCategories = getSelectedCategories();
    const selectedEquipment = getSelectedEquipment();

    if (selectedCategories.length === 0 || selectedEquipment.length === 0) {
      const container = document.getElementById("videoSelectionContainer");
      if (container) {
        container.innerHTML =
          '<div class="loading">Select categories and equipment first to load videos</div>';
      }
      return;
    }

    const videos = await window.api.getAvailableVideos(
      selectedCategories,
      selectedEquipment
    );
    availableVideos = videos;

    // Calculate max selectable videos based on workout parameters
    const workDuration = parseInt(
      (document.getElementById("workDuration") as HTMLSelectElement)?.value ||
        "0"
    );
    const restDuration = parseInt(
      (document.getElementById("restDuration") as HTMLSelectElement)?.value ||
        "0"
    );
    const setsPerStation = parseInt(
      (document.getElementById("setsPerStation") as HTMLSelectElement)?.value ||
        "0"
    );
    const stationRest = parseInt(
      (document.getElementById("stationRest") as HTMLSelectElement)?.value ||
        "0"
    );
    const totalWorkoutDuration = parseInt(
      (document.getElementById("totalWorkoutDuration") as HTMLSelectElement)
        ?.value || "0"
    );

    if (
      workDuration &&
      restDuration &&
      setsPerStation &&
      stationRest &&
      totalWorkoutDuration
    ) {
      const totalSeconds = totalWorkoutDuration * 60;
      const timePerExercise =
        workDuration * setsPerStation +
        restDuration * (setsPerStation - 1) +
        stationRest;
      maxSelectableVideos = Math.floor(totalSeconds / timePerExercise);
    } else {
      maxSelectableVideos = 0;
    }

    displayAvailableVideos();
    updateVideoSelectionUI();

    // Auto-select random videos by default (mimicking the old behavior)
    if (availableVideos.length > 0 && selectedVideos.length === 0) {
      randomSelectVideos();
    }
  } catch (error) {
    const container = document.getElementById("videoSelectionContainer");
    if (container) {
      container.innerHTML = `<div class="error">Error loading videos: ${
        (error as Error).message
      }</div>`;
    }
  }
}

// Display available videos in the UI
function displayAvailableVideos(): void {
  const container = document.getElementById("videoSelectionContainer");
  if (!container) return;

  if (availableVideos.length === 0) {
    container.innerHTML =
      '<div class="loading">No videos found for selected categories and equipment</div>';
    return;
  }

  const videoSelectionContainer = document.createElement("div");
  videoSelectionContainer.className = "video-selection-container";

  availableVideos.forEach((video) => {
    const videoItem = document.createElement("div");
    videoItem.className = "video-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `video-${video.path.replace(/[^a-zA-Z0-9]/g, "_")}`;
    checkbox.value = video.path;
    checkbox.name = "selectedVideos";
    checkbox.addEventListener("change", handleVideoSelectionChange);

    const videoInfo = document.createElement("div");
    videoInfo.className = "video-item-info";

    const videoName = document.createElement("div");
    videoName.className = "video-item-name";
    videoName.textContent = video.exerciseName;

    const videoMeta = document.createElement("div");
    videoMeta.className = "video-item-meta";

    const categorySpan = document.createElement("span");
    categorySpan.className = "video-item-category";
    categorySpan.textContent = video.category;

    const equipmentSpan = document.createElement("span");
    equipmentSpan.className = "video-item-equipment";
    equipmentSpan.textContent = video.equipment;

    videoMeta.appendChild(categorySpan);
    videoMeta.appendChild(equipmentSpan);

    // Add video preview
    const videoPreview = document.createElement("video");
    videoPreview.className = "video-preview";
    videoPreview.src = `file://${video.path}`;
    videoPreview.muted = true;
    videoPreview.loop = true;
    videoPreview.controls = false;
    videoPreview.preload = "metadata";

    // Play on hover, pause on leave
    videoPreview.addEventListener("mouseenter", () => {
      videoPreview.play().catch(() => {
        // Silently handle play errors
      });
    });
    videoPreview.addEventListener("mouseleave", () => {
      videoPreview.pause();
      videoPreview.currentTime = 0;
    });

    // Toggle checkbox on video click
    videoPreview.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      handleVideoSelectionChange();
    });

    videoPreview.addEventListener("error", () => {
      // Replace with a placeholder if video fails to load
      videoPreview.style.display = "none";
      const placeholder = document.createElement("div");
      placeholder.className = "video-preview-placeholder";
      placeholder.innerHTML = "🎬";
      placeholder.style.cssText = `
        width: 100%;
        height: 200px;
        background-color: #f8f9fa;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 0 auto;
      `;
      videoPreview.parentNode?.insertBefore(placeholder, videoPreview);
    });

    videoInfo.appendChild(videoName);
    videoInfo.appendChild(videoMeta);
    videoItem.appendChild(checkbox);
    videoItem.appendChild(videoPreview);
    videoItem.appendChild(videoInfo);
    videoSelectionContainer.appendChild(videoItem);
  });

  // Add summary section
  const summarySection = document.createElement("div");
  summarySection.className = "video-selection-summary";
  summarySection.innerHTML = `
    <h4>Selected Workout Summary</h4>
    <div id="workoutSummary">No videos selected</div>
  `;

  container.innerHTML = "";
  container.appendChild(videoSelectionContainer);
  container.appendChild(summarySection);

  // Update summary immediately
  updateWorkoutSummary();
}

// Handle video selection change
function handleVideoSelectionChange(): void {
  const checkboxes = document.querySelectorAll(
    'input[name="selectedVideos"]:checked'
  ) as NodeListOf<HTMLInputElement>;
  selectedVideos = Array.from(checkboxes).map((cb) => cb.value);

  // If user tries to select more than max, uncheck the last one
  if (selectedVideos.length > maxSelectableVideos && maxSelectableVideos > 0) {
    const lastChecked = checkboxes[checkboxes.length - 1];
    if (lastChecked) {
      lastChecked.checked = false;
      selectedVideos = selectedVideos.slice(0, -1);
    }
  }

  updateVideoSelectionUI();
  updateWorkoutSummary();
}

// Update video selection UI
function updateVideoSelectionUI(): void {
  const countElement = document.getElementById("videoSelectionCount");
  const limitElement = document.getElementById("videoSelectionLimit");
  const selectAllBtn = document.getElementById(
    "selectAllBtn"
  ) as HTMLButtonElement;
  const deselectAllBtn = document.getElementById(
    "deselectAllBtn"
  ) as HTMLButtonElement;
  const randomSelectBtn = document.getElementById(
    "randomSelectBtn"
  ) as HTMLButtonElement;

  if (countElement) {
    countElement.textContent = `${selectedVideos.length} out of ${availableVideos.length} selected`;
  }

  if (limitElement && maxSelectableVideos > 0) {
    limitElement.textContent = `(Maximum ${maxSelectableVideos} videos can be selected)`;
  }

  if (selectAllBtn) {
    selectAllBtn.disabled = selectedVideos.length === availableVideos.length;
  }

  if (deselectAllBtn) {
    deselectAllBtn.disabled = selectedVideos.length === 0;
  }

  if (randomSelectBtn) {
    randomSelectBtn.disabled = availableVideos.length === 0;
  }
}

// Select all videos (up to max limit)
function selectAllVideos(): void {
  const maxToSelect =
    maxSelectableVideos > 0
      ? Math.min(maxSelectableVideos, availableVideos.length)
      : availableVideos.length;
  const checkboxes = document.querySelectorAll(
    'input[name="selectedVideos"]'
  ) as NodeListOf<HTMLInputElement>;

  let selectedCount = 0;
  checkboxes.forEach((checkbox) => {
    if (selectedCount < maxToSelect) {
      checkbox.checked = true;
      selectedCount++;
    } else {
      checkbox.checked = false;
    }
  });

  handleVideoSelectionChange();
}

// Deselect all videos
function deselectAllVideos(): void {
  const checkboxes = document.querySelectorAll(
    'input[name="selectedVideos"]'
  ) as NodeListOf<HTMLInputElement>;
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  handleVideoSelectionChange();
}

// Randomly select videos (up to max limit)
function randomSelectVideos(): void {
  const maxToSelect =
    maxSelectableVideos > 0
      ? Math.min(maxSelectableVideos, availableVideos.length)
      : availableVideos.length;

  // Shuffle available videos
  const shuffledVideos = [...availableVideos];
  for (let i = shuffledVideos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledVideos[i], shuffledVideos[j]] = [
      shuffledVideos[j],
      shuffledVideos[i],
    ];
  }

  // Select first maxToSelect videos
  const checkboxes = document.querySelectorAll(
    'input[name="selectedVideos"]'
  ) as NodeListOf<HTMLInputElement>;
  checkboxes.forEach((checkbox) => {
    const videoPath = checkbox.value;
    const isSelected = shuffledVideos
      .slice(0, maxToSelect)
      .some((video) => video.path === videoPath);
    checkbox.checked = isSelected;
  });

  handleVideoSelectionChange();
}

// Get selected videos
function getSelectedVideos(): string[] {
  return selectedVideos;
}

// Save current form settings (silent - no user notification)
async function saveCurrentSettings(): Promise<void> {
  try {
    const settings = {
      workDuration:
        parseInt(
          (document.getElementById("workDuration") as HTMLSelectElement)
            ?.value || "0"
        ) || null,
      restDuration:
        parseInt(
          (document.getElementById("restDuration") as HTMLSelectElement)
            ?.value || "0"
        ) || null,
      setsPerStation:
        parseInt(
          (document.getElementById("setsPerStation") as HTMLSelectElement)
            ?.value || "0"
        ) || null,
      stationRest:
        parseInt(
          (document.getElementById("stationRest") as HTMLSelectElement)
            ?.value || "0"
        ) || null,
      totalWorkoutDuration:
        parseInt(
          (document.getElementById("totalWorkoutDuration") as HTMLSelectElement)
            ?.value || "0"
        ) || null,
      categories: getSelectedCategories(),
      equipment: getSelectedEquipment(),
      selectedVideos: getSelectedVideos(),
      outputPath:
        (document.getElementById("outputFolder") as HTMLInputElement)?.value ||
        null,
      timestamp: new Date().toISOString(),
    };

    await window.api.saveSettings(settings);
  } catch (error) {
    console.log("Failed to save settings:", (error as Error).message);
  }
}

// Load saved settings into form (silent - no user notification)
async function loadSavedSettings(): Promise<void> {
  try {
    const settings = await window.api.loadSettings();
    if (!settings) {
      return;
    }

    // Load form values
    if (settings.workDuration) {
      const workDurationSelect = document.getElementById(
        "workDuration"
      ) as HTMLSelectElement;
      if (workDurationSelect)
        workDurationSelect.value = settings.workDuration.toString();
    }
    if (settings.restDuration) {
      const restDurationSelect = document.getElementById(
        "restDuration"
      ) as HTMLSelectElement;
      if (restDurationSelect)
        restDurationSelect.value = settings.restDuration.toString();
    }
    if (settings.setsPerStation) {
      const setsPerStationSelect = document.getElementById(
        "setsPerStation"
      ) as HTMLSelectElement;
      if (setsPerStationSelect)
        setsPerStationSelect.value = settings.setsPerStation.toString();
    }
    if (settings.stationRest) {
      const stationRestSelect = document.getElementById(
        "stationRest"
      ) as HTMLSelectElement;
      if (stationRestSelect)
        stationRestSelect.value = settings.stationRest.toString();
    }
    if (settings.totalWorkoutDuration) {
      const totalWorkoutDurationSelect = document.getElementById(
        "totalWorkoutDuration"
      ) as HTMLSelectElement;
      if (totalWorkoutDurationSelect)
        totalWorkoutDurationSelect.value =
          settings.totalWorkoutDuration.toString();
    }
    if (settings.outputPath) {
      const outputFolderInput = document.getElementById(
        "outputFolder"
      ) as HTMLInputElement;
      if (outputFolderInput) outputFolderInput.value = settings.outputPath;
    }

    // Load categories (need to wait for categories to be loaded)
    if (settings.categories && settings.categories.length > 0) {
      // Wait a bit for categories to be loaded, then check them
      setTimeout(() => {
        settings.categories.forEach((category) => {
          const checkbox = document.getElementById(
            `category-${category}`
          ) as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = true;
          }
        });
        // Trigger equipment loading
        loadEquipment();
      }, 500);
    }

    // Load equipment (need to wait for equipment to be loaded)
    if (settings.equipment && settings.equipment.length > 0) {
      setTimeout(() => {
        settings.equipment.forEach((equipment) => {
          const checkbox = document.getElementById(
            `equipment-${equipment}`
          ) as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = true;
          }
        });

        // Load videos and restore selected videos
        setTimeout(() => {
          loadAvailableVideos().then(() => {
            if (settings.selectedVideos && settings.selectedVideos.length > 0) {
              settings.selectedVideos.forEach((videoPath) => {
                const checkbox = document.querySelector(
                  `input[name="selectedVideos"][value="${videoPath}"]`
                ) as HTMLInputElement;
                if (checkbox) {
                  checkbox.checked = true;
                }
              });
              handleVideoSelectionChange();
            }
          });
        }, 500);
      }, 1000);
    }

    console.log("Settings loaded automatically");
  } catch (error) {
    console.log(
      "No saved settings found or error loading settings:",
      (error as Error).message
    );
  }
}

// Show message to user
function showMessage(message: string, type: string = "info"): void {
  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    max-width: 300px;
    word-wrap: break-word;
  `;

  // Set background color based on type
  switch (type) {
    case "success":
      messageDiv.style.backgroundColor = "#28a745";
      break;
    case "error":
      messageDiv.style.backgroundColor = "#dc3545";
      break;
    case "warning":
      messageDiv.style.backgroundColor = "#ffc107";
      messageDiv.style.color = "#212529";
      break;
    default:
      messageDiv.style.backgroundColor = "#007bff";
  }

  // Add to page
  document.body.appendChild(messageDiv);

  // Remove after 3 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 3000);
}

// Handle folder selection
async function selectOutputFolder(): Promise<void> {
  try {
    const selectedPath = await window.api.selectOutputFolder();
    if (selectedPath) {
      const outputFolderInput = document.getElementById(
        "outputFolder"
      ) as HTMLInputElement;
      if (outputFolderInput) outputFolderInput.value = selectedPath;
      const outputFolderError = document.getElementById("outputFolderError");
      if (outputFolderError) outputFolderError.textContent = "";
    }
  } catch (error) {
    const outputFolderError = document.getElementById("outputFolderError");
    if (outputFolderError) {
      outputFolderError.textContent = `Error selecting folder: ${
        (error as Error).message
      }`;
    }
  }
}

// Set form readonly state
function setFormReadonly(readonly: boolean): void {
  // Get all form elements that should be disabled
  const formElements = [
    ...document.querySelectorAll("select"),
    ...document.querySelectorAll('input[type="checkbox"]'),
    document.getElementById("outputFolder"),
    document.getElementById("selectFolderBtn"),
  ] as HTMLElement[];

  formElements.forEach((element) => {
    if (element) {
      (
        element as HTMLInputElement | HTMLSelectElement | HTMLButtonElement
      ).disabled = readonly;
    }
  });

  // Add visual feedback for readonly state
  const formSections = document.querySelectorAll(".form-section");
  formSections.forEach((section) => {
    if (readonly) {
      (section as HTMLElement).style.opacity = "0.6";
      (section as HTMLElement).style.pointerEvents = "none";
    } else {
      (section as HTMLElement).style.opacity = "1";
      (section as HTMLElement).style.pointerEvents = "auto";
    }
  });
}

// Form validation
function validateForm(): boolean {
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));

  // Validate required fields
  const requiredFields = [
    "workDuration",
    "restDuration",
    "setsPerStation",
    "stationRest",
    "totalWorkoutDuration",
  ];

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId) as HTMLSelectElement;
    const errorElement = document.getElementById(fieldId + "Error");

    if (!field?.value) {
      if (errorElement) errorElement.textContent = "This field is required";
      isValid = false;
    }
  });

  // Validate categories
  const selectedCategories = getSelectedCategories();
  if (selectedCategories.length === 0) {
    const categoriesError = document.getElementById("categoriesError");
    if (categoriesError)
      categoriesError.textContent = "Please select at least one category";
    isValid = false;
  }

  // Validate equipment
  const selectedEquipment = getSelectedEquipment();
  if (selectedEquipment.length === 0) {
    const equipmentError = document.getElementById("equipmentError");
    if (equipmentError)
      equipmentError.textContent = "Please select at least one equipment type";
    isValid = false;
  }

  // Validate video selection
  const selectedVideos = getSelectedVideos();
  if (selectedVideos.length === 0) {
    const videoSelectionError = document.getElementById("videoSelectionError");
    if (videoSelectionError)
      videoSelectionError.textContent =
        "Please select at least one exercise video";
    isValid = false;
  }

  // Validate output folder
  const outputFolder = (
    document.getElementById("outputFolder") as HTMLInputElement
  )?.value;
  if (!outputFolder) {
    const outputFolderError = document.getElementById("outputFolderError");
    if (outputFolderError)
      outputFolderError.textContent =
        "Please select a folder to save the video";
    isValid = false;
  }

  return isValid;
}

// Handle form submission
async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const submitBtn = document.getElementById("submitBtn") as HTMLButtonElement;
  const output = document.getElementById("output");
  const progressContainer = document.getElementById("progressContainer");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const progressMessage = document.getElementById("progressMessage");

  if (
    !submitBtn ||
    !output ||
    !progressContainer ||
    !progressText ||
    !progressFill ||
    !progressMessage
  ) {
    return;
  }

  // Disable form elements
  setFormReadonly(true);

  submitBtn.disabled = true;
  submitBtn.textContent = "🔄 Generating...";
  output.textContent = "Starting workout video generation...\n";

  // Show progress container
  progressContainer.style.display = "block";
  progressText.textContent = "0%";
  progressFill.style.width = "0%";
  progressMessage.textContent = "Initializing...";

  // Set up progress listener
  window.api.onGenerationProgress((data) => {
    const { progress, message } = data;
    progressText.textContent = `${progress}%`;
    progressFill.style.width = `${progress}%`;
    progressMessage.textContent = message;

    // Update page title with progress
    document.title = `WURQIT - ${progress}% - ${message}`;

    // Add to output log
    output.textContent += `\n[${progress}%] ${message}`;
    output.scrollTop = output.scrollHeight;

    // Show output location when we get the first progress update
    if (progress === 5) {
      const selectedPath = (
        document.getElementById("outputFolder") as HTMLInputElement
      )?.value;
      output.textContent += `\n📁 Output will be saved to: ${selectedPath}`;
      output.scrollTop = output.scrollHeight;
    }
  });

  // Set up console log listener
  window.api.onConsoleLog((data) => {
    const { level, message } = data;

    // Log to browser console with appropriate level
    switch (level) {
      case "info":
        console.log(`[INFO] ${message}`);
        break;
      case "warn":
        console.warn(`[WARNING] ${message}`);
        break;
      case "error":
        console.error(`[ERROR] ${message}`);
        break;
      default:
        console.log(`[${level.toUpperCase()}] ${message}`);
    }
  });

  try {
    const formData = {
      workDuration: parseInt(
        (document.getElementById("workDuration") as HTMLSelectElement)?.value ||
          "0"
      ),
      restDuration: parseInt(
        (document.getElementById("restDuration") as HTMLSelectElement)?.value ||
          "0"
      ),
      setsPerStation: parseInt(
        (document.getElementById("setsPerStation") as HTMLSelectElement)
          ?.value || "0"
      ),
      stationRest: parseInt(
        (document.getElementById("stationRest") as HTMLSelectElement)?.value ||
          "0"
      ),
      totalWorkoutDuration: parseInt(
        (document.getElementById("totalWorkoutDuration") as HTMLSelectElement)
          ?.value || "0"
      ),
      categories: getSelectedCategories(),
      equipment: getSelectedEquipment(),
      selectedVideos: getSelectedVideos(),
      outputPath: (document.getElementById("outputFolder") as HTMLInputElement)
        ?.value,
    };

    const result = await window.api.generateWorkoutVideo(formData);
    output.textContent += `\n✅ Workout video generated successfully!\nOutput file: ${result}`;

    // Auto-save settings after successful generation
    await saveCurrentSettings();
  } catch (error) {
    output.textContent += `\n❌ Error: ${(error as Error).message}`;
  } finally {
    // Re-enable form elements
    setFormReadonly(false);

    submitBtn.disabled = false;
    submitBtn.textContent = "🎬 Generate Workout Video";

    // Reset page title
    document.title = "WURQIT";

    // Hide progress container after a delay
    setTimeout(() => {
      progressContainer.style.display = "none";
    }, 3000);

    // Clean up listeners
    window.api.removeGenerationProgress();
    window.api.removeConsoleLog();
  }
}

// Debug function
async function debugFfmpeg(): Promise<void> {
  const output = document.getElementById("output");
  if (!output) return;

  output.textContent = "🔧 Debugging FFmpeg installation...\n";

  try {
    const debugInfo = await window.api.debugFfmpeg();
    output.textContent += `\n📋 FFmpeg Debug Information:\n`;
    output.textContent += `Path: ${debugInfo.ffmpegPath}\n`;
    output.textContent += `Exists: ${debugInfo.exists ? "✅ Yes" : "❌ No"}\n`;
    output.textContent += `Resources Path: ${debugInfo.resourcesPath}\n`;
    output.textContent += `Current Directory: ${debugInfo.currentDir}\n`;
    output.textContent += `Development Mode: ${
      debugInfo.isDev ? "Yes" : "No"
    }\n`;
    output.textContent += `Platform: ${debugInfo.platform}\n`;
    output.textContent += `Architecture: ${debugInfo.arch}\n`;

    if (debugInfo.version) {
      output.textContent += `Version: ${debugInfo.version}\n`;
    } else if (debugInfo.versionError) {
      output.textContent += `Version Error: ${debugInfo.versionError}\n`;
    }

    output.scrollTop = output.scrollHeight;
  } catch (error) {
    output.textContent += `\n❌ Debug Error: ${(error as Error).message}\n`;
    output.scrollTop = output.scrollHeight;
  }
}

// Update Progress Functions
function showUpdateOverlay(): void {
  const overlay = document.getElementById("updateOverlay") as HTMLElement;
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function hideUpdateOverlay(): void {
  const overlay = document.getElementById("updateOverlay") as HTMLElement;
  if (overlay) {
    overlay.style.display = "none";
  }
}

function updateProgress(progress: number, message: string): void {
  const progressText = document.getElementById(
    "updateProgressText"
  ) as HTMLElement;
  const progressFill = document.getElementById(
    "updateProgressFill"
  ) as HTMLElement;
  const messageElement = document.getElementById(
    "updateMessage"
  ) as HTMLElement;

  if (progressText) {
    progressText.textContent = `${progress}%`;
  }

  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }

  if (messageElement) {
    messageElement.textContent = message;
  }
}
// Update workout summary
function updateWorkoutSummary(): void {
  const summaryElement = document.getElementById("workoutSummary");
  if (!summaryElement) return;

  const selectedVideos = getSelectedVideos();
  if (selectedVideos.length === 0) {
    summaryElement.textContent = "No videos selected";
    return;
  }

  const selectedVideoData = availableVideos.filter((v) =>
    selectedVideos.includes(v.path)
  );
  const uniqueCategories = [
    ...new Set(selectedVideoData.map((v) => v.category)),
  ];
  const uniqueEquipment = [
    ...new Set(selectedVideoData.map((v) => v.equipment)),
  ];
  const exerciseNames = selectedVideoData.map((v) => v.exerciseName);

  let summaryText = `${selectedVideos.length} exercise${
    selectedVideos.length === 1 ? "" : "s"
  }: `;
  if (uniqueCategories.length > 0) {
    summaryText += `${uniqueCategories.length} category${
      uniqueCategories.length === 1 ? "" : "ies"
    }: ${uniqueCategories.join(", ")}. `;
  }
  if (uniqueEquipment.length > 0) {
    summaryText += `${uniqueEquipment.length} equipment type${
      uniqueEquipment.length === 1 ? "" : "s"
    }: ${uniqueEquipment.join(", ")}. `;
  }
  summaryText += `\n\nExercises: ${exerciseNames.join(", ")}`;
  summaryText = summaryText.trim();

  summaryElement.innerHTML = summaryText.replace(/\n/g, "<br>");
}

// Event listeners
document.addEventListener("DOMContentLoaded", async () => {
  populateDropdowns();
  loadCategories();

  // Load saved settings immediately
  loadSavedSettings();

  // Reload equipment when categories change
  document.addEventListener("change", (event) => {
    if ((event.target as HTMLInputElement)?.name === "categories") {
      loadEquipment();
      // Hide video selection when categories change
      const videoSelectionSection = document.getElementById(
        "videoSelectionSection"
      );
      if (videoSelectionSection) {
        videoSelectionSection.style.display = "none";
      }
    }
  });

  // Reload videos when equipment changes
  document.addEventListener("change", (event) => {
    if ((event.target as HTMLInputElement)?.name === "equipment") {
      loadAvailableVideos();
      // Show video selection section when equipment is selected
      const videoSelectionSection = document.getElementById(
        "videoSelectionSection"
      );
      if (videoSelectionSection) {
        videoSelectionSection.style.display = "block";
      }
    }
  });

  // Reload videos when workout parameters change
  document.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    if (
      target &&
      [
        "workDuration",
        "restDuration",
        "setsPerStation",
        "stationRest",
        "totalWorkoutDuration",
      ].includes(target.id)
    ) {
      if (availableVideos.length > 0) {
        loadAvailableVideos();
      }
    }
  });

  // Video selection control buttons
  const selectAllBtn = document.getElementById("selectAllBtn");
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", selectAllVideos);
  }

  const deselectAllBtn = document.getElementById("deselectAllBtn");
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener("click", deselectAllVideos);
  }

  const randomSelectBtn = document.getElementById("randomSelectBtn");
  if (randomSelectBtn) {
    randomSelectBtn.addEventListener("click", randomSelectVideos);
  }

  // Form submission
  const workoutForm = document.getElementById("workoutForm");
  if (workoutForm) {
    workoutForm.addEventListener("submit", handleSubmit);
  }

  // Folder selection button
  const selectFolderBtn = document.getElementById("selectFolderBtn");
  if (selectFolderBtn) {
    selectFolderBtn.addEventListener("click", selectOutputFolder);
  }

  // Debug button (if it exists)
  const debugBtn = document.getElementById("debugBtn");
  if (debugBtn) {
    debugBtn.addEventListener("click", debugFfmpeg);
  }

  // Set up update progress listener
  window.api.onUpdateProgress((data: { progress: number; message: string }) => {
    if (data.progress === 0) {
      showUpdateOverlay();
    }
    updateProgress(data.progress, data.message);

    if (data.progress === 100) {
      setTimeout(() => {
        hideUpdateOverlay();
      }, 2000); // Hide after 2 seconds when complete
    }
  });
});
