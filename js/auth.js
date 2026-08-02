// js/auth.js

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const roleParam = urlParams.get('role');

  if (token) {
    window.activeToken = token;
    window.tokenOwnerName = urlParams.get('owner') || "Ship Owner";
    window.currentRole = 'owner';
    document.getElementById('userRoleSelect').value = 'owner';
    showSecurityBanner(`One-Time Access Link Aktif: Terverifikasi untuk ${window.tokenOwnerName}. Data Unmasked & Watermarked.`);
  } else if (roleParam) {
    window.currentRole = roleParam;
    document.getElementById('userRoleSelect').value = roleParam;
  }
}

function showSecurityBanner(msg) {
  const banner = document.getElementById('securityTokenBanner');
  document.getElementById('securityBannerText').textContent = msg;
  banner.style.display = 'flex';
}

function switchRole(role) {
  window.currentRole = role;
  updateRoleUI();
}

function updateRoleUI() {
  if (window.currentRole === 'candidate') {
    switchTab('form');
  } else if (window.currentRole === 'owner') {
    switchTab('catalog');
  } else if (window.currentRole === 'admin') {
    switchTab('directory');
  }

  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
}
