// js/config.js

/**
 * ENVIRONMENT METADATA
 * Defines build variables and environment state.
 */
const ENV = {
  APP_VERSION: "1.0.0-rc.1",
  BUILD_NUMBER: 42,
  BUILD_DATE: "2026-08-02",
  ENVIRONMENT: "production"
};

/**
 * Global application state configuration.
 */
window.currentLang = 'id';
window.currentRole = 'admin'; // 'admin', 'owner', 'candidate'
window.activeToken = null;
window.tokenOwnerName = null;
window.currentStep = 1;
window.activeCameraDocType = null;
window.cameraStream = null;

// Selection Basket
window.bookingBasket = [];

// Documents uploaded per step
window.uploadedDocuments = {
  passport: [],
  ktp: [],
  cdc: [],
  medical: [],
  cert: [],
  photo: []
};

window.crewDatabase = [];
