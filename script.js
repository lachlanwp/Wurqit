// Disable right-click context menu
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Populate dropdown options
function populateDropdowns() {
  // Work duration: 20-120 seconds in 5-second increments
  const workDurationSelect = document.getElementById("workDuration");
  for (let i = 20; i <= 120; i += 5) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} seconds`;
    workDurationSelect.appendChild(option);
  }

  // Rest duration: 5-60 seconds in 5-second increments
  const restDurationSelect = document.getElementById("restDuration");
  for (let i = 5; i <= 60; i += 5) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} seconds`;
    restDurationSelect.appendChild(option);
  }

  // Sets per station: 2-6 in 1 set increments
  const setsPerStationSelect = document.getElementById("setsPerStation");
  for (let i = 2; i <= 6; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} sets`;
    setsPerStationSelect.appendChild(option);
  }

  // Station rest: 5-40 seconds in 5-second increments
  const stationRestSelect = document.getElementById("stationRest");
  for (let i = 5; i <= 40; i += 5) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} seconds`;
    stationRestSelect.appendChild(option);
  }

  // Total workout duration: 10-120 minutes in 10-minute increments
  const totalWorkoutDurationSelect = document.getElementById(
    "totalWorkoutDuration"
  );
  for (let i = 10; i <= 120; i += 10) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} minutes`;
    totalWorkoutDurationSelect.appendChild(option);
  }
}

// Load categories from the generator module
async function loadCategories() {
  try {
    const categories = await window.api.getCategories();
    const container = document.getElementById("categoriesContainer");
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
    document.getElementById(
      "categoriesContainer"
    ).innerHTML = `<div class="error">Error loading categories: ${error.message}</div>`;
  }
}

// Load equipment based on selected categories
async function loadEquipment() {
  try {
    const selectedCategories = getSelectedCategories();
    if (selectedCategories.length === 0) {
      document.getElementById("equipmentContainer").innerHTML =
        '<div class="loading">Select categories first to load equipment</div>';
      return;
    }

    const equipment = await window.api.getEquipment(selectedCategories);
    const container = document.getElementById("equipmentContainer");
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
    document.getElementById(
      "equipmentContainer"
    ).innerHTML = `<div class="error">Error loading equipment: ${error.message}</div>`;
  }
}

// Get selected categories
function getSelectedCategories() {
  const checkboxes = document.querySelectorAll(
    'input[name="categories"]:checked'
  );
  return Array.from(checkboxes).map((cb) => cb.value);
}

// Get selected equipment
function getSelectedEquipment() {
  const checkboxes = document.querySelectorAll(
    'input[name="equipment"]:checked'
  );
  return Array.from(checkboxes).map((cb) => cb.value);
}

// Save current form settings (silent - no user notification)
async function saveCurrentSettings() {
  try {
    const settings = {
      workDuration: parseInt(document.getElementById("workDuration").value) || null,
      restDuration: parseInt(document.getElementById("restDuration").value) || null,
      setsPerStation: parseInt(document.getElementById("setsPerStation").value) || null,
      stationRest: parseInt(document.getElementById("stationRest").value) || null,
      totalWorkoutDuration: parseInt(document.getElementById("totalWorkoutDuration").value) || null,
      categories: getSelectedCategories(),
      equipment: getSelectedEquipment(),
      outputPath: document.getElementById("outputFolder").value || null,
      timestamp: new Date().toISOString()
    };

    await window.api.saveSettings(settings);
  } catch (error) {
    console.log("Failed to save settings:", error.message);
  }
}

// Load saved settings into form (silent - no user notification)
async function loadSavedSettings() {
  try {
    const settings = await window.api.loadSettings();
    if (!settings) {
      return;
    }

    // Load form values
    if (settings.workDuration) {
      document.getElementById("workDuration").value = settings.workDuration;
    }
    if (settings.restDuration) {
      document.getElementById("restDuration").value = settings.restDuration;
    }
    if (settings.setsPerStation) {
      document.getElementById("setsPerStation").value = settings.setsPerStation;
    }
    if (settings.stationRest) {
      document.getElementById("stationRest").value = settings.stationRest;
    }
    if (settings.totalWorkoutDuration) {
      document.getElementById("totalWorkoutDuration").value = settings.totalWorkoutDuration;
    }
    if (settings.outputPath) {
      document.getElementById("outputFolder").value = settings.outputPath;
    }

    // Load categories (need to wait for categories to be loaded)
    if (settings.categories && settings.categories.length > 0) {
      // Wait a bit for categories to be loaded, then check them
      setTimeout(() => {
        settings.categories.forEach(category => {
          const checkbox = document.getElementById(`category-${category}`);
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
        settings.equipment.forEach(equipment => {
          const checkbox = document.getElementById(`equipment-${equipment}`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }, 1000);
    }

    console.log("Settings loaded automatically");
  } catch (error) {
    console.log("No saved settings found or error loading settings:", error.message);
  }
}

// Show message to user
function showMessage(message, type = "info") {
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
async function selectOutputFolder() {
  try {
    const selectedPath = await window.api.selectOutputFolder();
    if (selectedPath) {
      document.getElementById("outputFolder").value = selectedPath;
      document.getElementById("outputFolderError").textContent = "";
    }
  } catch (error) {
    document.getElementById("outputFolderError").textContent = `Error selecting folder: ${error.message}`;
  }
}

// Set form readonly state
function setFormReadonly(readonly) {
  // Get all form elements that should be disabled
  const formElements = [
    ...document.querySelectorAll('select'),
    ...document.querySelectorAll('input[type="checkbox"]'),
    document.getElementById('outputFolder'),
    document.getElementById('selectFolderBtn')
  ];

  formElements.forEach(element => {
    element.disabled = readonly;
  });

  // Add visual feedback for readonly state
  const formSections = document.querySelectorAll('.form-section');
  formSections.forEach(section => {
    if (readonly) {
      section.style.opacity = '0.6';
      section.style.pointerEvents = 'none';
    } else {
      section.style.opacity = '1';
      section.style.pointerEvents = 'auto';
    }
  });
}

// Form validation
function validateForm() {
  let isValid = true;

  // Clear previous errors
  document
    .querySelectorAll(".error")
    .forEach((el) => (el.textContent = ""));

  // Validate required fields
  const requiredFields = [
    "workDuration",
    "restDuration",
    "setsPerStation",
    "stationRest",
    "totalWorkoutDuration",
  ];

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + "Error");

    if (!field.value) {
      errorElement.textContent = "This field is required";
      isValid = false;
    }
  });

  // Validate categories
  const selectedCategories = getSelectedCategories();
  if (selectedCategories.length === 0) {
    document.getElementById("categoriesError").textContent =
      "Please select at least one category";
    isValid = false;
  }

  // Validate equipment
  const selectedEquipment = getSelectedEquipment();
  if (selectedEquipment.length === 0) {
    document.getElementById("equipmentError").textContent =
      "Please select at least one equipment type";
    isValid = false;
  }

  // Validate output folder
  const outputFolder = document.getElementById("outputFolder").value;
  if (!outputFolder) {
    document.getElementById("outputFolderError").textContent =
      "Please select a folder to save the video";
    isValid = false;
  }

  return isValid;
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const output = document.getElementById("output");
  const progressContainer = document.getElementById("progressContainer");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const progressMessage = document.getElementById("progressMessage");

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
      const selectedPath = document.getElementById("outputFolder").value;
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
        document.getElementById("workDuration").value
      ),
      restDuration: parseInt(
        document.getElementById("restDuration").value
      ),
      setsPerStation: parseInt(
        document.getElementById("setsPerStation").value
      ),
      stationRest: parseInt(document.getElementById("stationRest").value),
      totalWorkoutDuration: parseInt(
        document.getElementById("totalWorkoutDuration").value
      ),
      categories: getSelectedCategories(),
      equipment: getSelectedEquipment(),
      outputPath: document.getElementById("outputFolder").value,
    };

    const result = await window.api.generateWorkoutVideo(formData);
    output.textContent += `\n✅ Workout video generated successfully!\nOutput file: ${result}`;
    
    // Auto-save settings after successful generation
    await saveCurrentSettings();
  } catch (error) {
    output.textContent += `\n❌ Error: ${error.message}`;
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
async function debugFfmpeg() {
  const output = document.getElementById("output");
  output.textContent = "🔧 Debugging FFmpeg installation...\n";

  try {
    const debugInfo = await window.api.debugFfmpeg();
    output.textContent += `\n📋 FFmpeg Debug Information:\n`;
    output.textContent += `Path: ${debugInfo.ffmpegPath}\n`;
    output.textContent += `Exists: ${
      debugInfo.exists ? "✅ Yes" : "❌ No"
    }\n`;
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
    output.textContent += `\n❌ Debug Error: ${error.message}\n`;
    output.scrollTop = output.scrollHeight;
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", async () => {
  populateDropdowns();
  loadCategories();

  // Load saved settings immediately
  loadSavedSettings();

  // Reload equipment when categories change
  document.addEventListener("change", (event) => {
    if (event.target.name === "categories") {
      loadEquipment();
    }
  });

  // Form submission
  document
    .getElementById("workoutForm")
    .addEventListener("submit", handleSubmit);

  // Folder selection button
  document
    .getElementById("selectFolderBtn")
    .addEventListener("click", selectOutputFolder);

  // Debug button (if it exists)
  const debugBtn = document.getElementById("debugBtn");
  if (debugBtn) {
    debugBtn.addEventListener("click", debugFfmpeg);
  }
}); 