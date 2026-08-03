// js/app.js

/**
 * PHASE 4: GLOBAL ERROR HANDLER
 */
window.onerror = function (message, source, lineno, colno, error) {
  showGlobalError(message, `${source}:${lineno}:${colno}\n\n${error ? error.stack : ''}`);
  return true; // Prevent default reporting
};

window.onunhandledrejection = function (event) {
  showGlobalError("Unhandled Promise Rejection", event.reason);
};

function showGlobalError(message, details) {
  const modal = document.getElementById('globalErrorModal');
  const msgEl = document.getElementById('globalErrorMessage');
  const detailsEl = document.getElementById('globalErrorDetails');
  
  if (modal && msgEl && detailsEl) {
    msgEl.textContent = message || "An unknown error occurred.";
    detailsEl.textContent = details || "No stack trace available.";
    
    // Hide loading if it was active
    const loader = document.getElementById('appLoadingOverlay');
    if (loader) loader.classList.add('hidden');
    
    modal.classList.add('active');
  } else {
    console.error("Critical Error (UI Missing):", message, details);
  }
}

/**
 * PHASE 6: RETRY SYSTEM
 */
function retryBootstrap() {
  const modal = document.getElementById('globalErrorModal');
  if (modal) modal.classList.remove('active');
  
  const loader = document.getElementById('appLoadingOverlay');
  if (loader) loader.classList.remove('hidden');
  
  window.location.reload(true);
}

function updateLoadingText(text) {
  const el = document.getElementById('loadingStatusText');
  if (el) el.textContent = text;
}

/**
 * PHASE 2: REFACTOR APPLICATION BOOTSTRAP
 */
async function bootstrap() {
  try {
    // 1. Initialize Configuration
    updateLoadingText("Loading Configuration...");
    await sleep(200);
    if (typeof initLanguage !== 'function') throw new Error("config.js or ui-components.js failed to load");
    
    // 2. Phase 5: Health Check (Local Storage & DOM)
    updateLoadingText("Running Health Checks...");
    await sleep(200);
    checkCriticalSystems();
    
    // 3. Initialize Services (Cloud First Architecture)
    updateLoadingText("Loading Services...");
    await sleep(200);
    
    updateLoadingText("Verifying Google Apps Script...");
    await pingGoogleAppsScript();

    updateLoadingText("Connecting to Cloud Database...");
    if (window.api && typeof window.api.loadCloudDatabase === 'function') {
      const cloudSuccess = await window.api.loadCloudDatabase();
      
      if (!cloudSuccess) {
        updateLoadingText("Offline Fallback: Loading Local Cache...");
      }
    } else {
      throw new Error("api.js failed to load: window.api is undefined");
    }
    
    // Failsafe: Cloud + Cache Failed
    if (!window.crewDatabase || window.crewDatabase.length === 0) {
      throw new Error("No database available. Please check your connection or sync status.");
    }
    
    if (typeof parseUrlParams === 'function') parseUrlParams();
    
    // 4. Initialize UI
    updateLoadingText("Loading User Interface...");
    await sleep(200);
    initializeUI();
    
    // Finish Loading
    updateLoadingText("Loading Completed");
    await sleep(300);
    document.getElementById('appLoadingOverlay').classList.add('hidden');
    
  } catch (error) {
    showGlobalError("Bootstrap Failed", error.message + "\n" + error.stack);
  }
}

function checkCriticalSystems() {
  try {
    localStorage.setItem('_health', 'test');
    localStorage.removeItem('_health');
  } catch (e) {
    throw new Error("Local Storage is unavailable or restricted. Please enable cookies/storage.");
  }
  
  const requiredElements = ['crewForm', 'catalogGridContainer', 'directoryTableBody'];
  for (let id of requiredElements) {
    if (!document.getElementById(id)) {
      throw new Error(`Critical UI Element Missing: #${id}`);
    }
  }
}

function initializeUI() {
  initLanguage();
  populateDropdowns();
  renderDynamicRadioAndCheckboxes();
  if (typeof loadSavedDraft === 'function') loadSavedDraft();
  if (typeof updateRoleUI === 'function') updateRoleUI();
  if (typeof updateGasStatusUI === 'function') updateGasStatusUI();
  if (typeof setupDragAndDrop === 'function') setupDragAndDrop();
}

async function pingGoogleAppsScript() {
  const url = typeof getGasUrl === 'function' ? getGasUrl() : null;
  if (!url) throw new Error("Google Apps Script URL is missing");
  await sleep(200); 
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start sequence when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap);
