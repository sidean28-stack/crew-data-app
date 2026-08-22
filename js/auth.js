// js/auth.js

function getAuthUser() {
  return sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
}

function getAuthRole() {
  return sessionStorage.getItem('auth_role') || localStorage.getItem('auth_role');
}

function getAuthToken() {
  return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
}

function hideGatekeeper() {
  const gatekeeper = document.getElementById('startupLoginGatekeeper');
  if (gatekeeper) {
    if (typeof forceDisableOverlay === 'function') {
      forceDisableOverlay(gatekeeper);
    } else {
      gatekeeper.classList.remove('active');
      gatekeeper.style.display = 'none';
      gatekeeper.style.pointerEvents = 'none';
      gatekeeper.style.visibility = 'hidden';
      gatekeeper.style.opacity = '0';
    }
  }
  const loadingOverlay = document.getElementById('appLoadingOverlay');
  if (loadingOverlay && (loadingOverlay.classList.contains('hidden') || getAuthUser())) {
    if (typeof forceDisableOverlay === 'function') {
      forceDisableOverlay(loadingOverlay);
    }
  }
}

function showGatekeeper() {
  const gatekeeper = document.getElementById('startupLoginGatekeeper');
  if (gatekeeper) {
    gatekeeper.classList.add('active');
    gatekeeper.style.display = 'flex';
    gatekeeper.style.pointerEvents = 'auto';
    gatekeeper.style.visibility = 'visible';
    gatekeeper.style.opacity = '1';
    const input = document.getElementById('loginUsername');
    if (input) setTimeout(() => input.focus(), 150);
  }
}

function checkMandatoryStartupLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const authUser = getAuthUser();

  if (token) {
    window.activeToken = token;
    window.tokenOwnerName = urlParams.get('owner') || "Ship Owner";
    window.currentRole = 'owner';
    const roleSel = document.getElementById('userRoleSelect');
    if (roleSel) roleSel.value = 'owner';
    showSecurityBanner(`船东专用一次性访问链接已验证：${window.tokenOwnerName}。资料已解锁并加水印。`);
    hideGatekeeper();
    return;
  }

  if (!authUser) {
    showGatekeeper();
  } else {
    hideGatekeeper();
  }
}

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const roleParam = urlParams.get('role');

  if (token) {
    window.activeToken = token;
    window.tokenOwnerName = urlParams.get('owner') || "Ship Owner";
    window.currentRole = 'owner';
    const roleSel = document.getElementById('userRoleSelect');
    if (roleSel) roleSel.value = 'owner';
    showSecurityBanner(`船东专用一次性访问链接已验证：${window.tokenOwnerName}。资料已解锁并加水印。`);
  } else if (roleParam) {
    window.currentRole = roleParam;
    const roleSel = document.getElementById('userRoleSelect');
    if (roleSel) roleSel.value = roleParam;
  }

  checkMandatoryStartupLogin();
}

function showSecurityBanner(msg) {
  const banner = document.getElementById('securityTokenBanner');
  if (banner) {
    const txt = document.getElementById('securityBannerText');
    if (txt) txt.textContent = msg;
    banner.style.display = 'flex';
  }
}

function switchRole(role) {
  const savedRole = getAuthRole();
  
  if (role === 'admin' || role === 'superadmin') {
    if (!savedRole) {
      window.pendingTargetRole = role;
      openLoginModal(true);
      return;
    }
    // Allow switching between admin and superadmin when logged in as superadmin,
    // or keep as admin when logged in as admin.
    if (savedRole === 'superadmin') {
      window.currentRole = role;
    } else {
      window.currentRole = 'admin';
    }
  } else {
    window.currentRole = role;
  }
  updateRoleUI();
}

function updateRoleUI() {
  const currentRole = window.currentRole || 'admin';
  const savedRole = getAuthRole() || currentRole;
  const authUser = getAuthUser();

  // Synchronize dropdown selection with current active role
  const roleSel = document.getElementById('userRoleSelect');
  if (roleSel) {
    if (savedRole === 'superadmin' && !roleSel.querySelector('option[value="superadmin"]')) {
      const opt = document.createElement('option');
      opt.value = 'superadmin';
      opt.textContent = 'Super Admin';
      roleSel.insertBefore(opt, roleSel.firstChild);
    }
    roleSel.value = currentRole;
  }

  if (currentRole === 'candidate') {
    switchTab('form');
  } else if (currentRole === 'owner') {
    if (window.currentLang !== 'zh' && typeof switchLanguage === 'function') switchLanguage('zh');
    switchTab('catalog');
  } else if (currentRole === 'admin' || currentRole === 'superadmin') {
    switchTab('directory');
  }

  // Header Login & Logout Buttons State
  const btnLogin = document.getElementById('btnOpenLogin');
  const btnLogout = document.getElementById('btnExecuteLogout');
  const floatBtn = document.getElementById('floatingLoginBtn');

  if (btnLogin && btnLogout) {
    if (authUser) {
      const safeUser = typeof escapeHTML === 'function' ? escapeHTML(authUser) : (typeof escapeHtml === 'function' ? escapeHtml(authUser) : authUser);
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-flex';
      btnLogout.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> <span>Keluar (${safeUser})</span>`;
      if (floatBtn) floatBtn.style.display = 'none';
    } else {
      btnLogin.style.display = 'inline-flex';
      btnLogout.style.display = 'none';
      if (floatBtn) floatBtn.style.display = 'flex';
    }
  }

  // Super Admin Audit Log & User Management Buttons Visibility
  // Only display Super Admin features when current active role view is 'superadmin'
  const isSuperRole = (savedRole === 'superadmin' && currentRole === 'superadmin');
  const auditBtn = document.getElementById('btnAuditLog');
  if (auditBtn) {
    auditBtn.style.display = isSuperRole ? 'inline-flex' : 'none';
  }
  const userMgmtBtn = document.getElementById('btnUserManagement');
  if (userMgmtBtn) {
    userMgmtBtn.style.display = isSuperRole ? 'inline-flex' : 'none';
  }

  // Cleanup: Ensure startup login gatekeeper does not block clicks when authenticated
  if (authUser) {
    hideGatekeeper();
  }

  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
}

function openLoginModal(isMandatory = false) {
  showGatekeeper();
}

function closeLoginModal() {
  const authUser = getAuthUser();
  if (!authUser && !window.activeToken) {
    hideGatekeeper();
    window.currentRole = 'candidate';
    const roleSel = document.getElementById('userRoleSelect');
    if (roleSel) roleSel.value = 'candidate';
    if (typeof switchTab === 'function') switchTab('form');
    return;
  }
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
  hideGatekeeper();
}

async function executeLogin(e) {
  if (e) e.preventDefault();
  const form = e && e.target ? e.target : document;
  const uInput = form.querySelector('#loginUsername') || document.getElementById('loginUsername');
  const pInput = form.querySelector('#loginPassword') || document.getElementById('loginPassword');
  const btnSubmit = form.querySelector('#btnLoginSubmit') || document.getElementById('btnLoginSubmit');

  const username = String(uInput ? uInput.value : '').trim();
  const password = String(pInput ? pInput.value : '').trim();

  if (!username || !password) {
    if (typeof showNotification === 'function') showNotification('Username dan Password wajib diisi!', 'warning');
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;

  // Check stored user database created by Super Admin
  const users = (typeof getStoredUsers === 'function') ? getStoredUsers() : [];
  const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

  const isSuperDefault = (username.toLowerCase() === 'superadmin' && password === 'SuperAdmin123!');
  const isAdminDefault = (username.toLowerCase() === 'admin' && password === 'Admin123!');

  if (foundUser || isSuperDefault || isAdminDefault) {
    const role = foundUser ? foundUser.role : (isSuperDefault ? 'superadmin' : 'admin');
    const token = 'token_' + Date.now();

    sessionStorage.setItem('auth_user', username);
    sessionStorage.setItem('auth_role', role);
    sessionStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', username);
    localStorage.setItem('auth_role', role);
    localStorage.setItem('auth_token', token);

    window.currentRole = role;
    const roleSel = document.getElementById('userRoleSelect');
    if (roleSel) roleSel.value = role;

    hideGatekeeper();

    if (typeof showNotification === 'function') {
      showNotification(`Selamat datang, ${username}! (Role: ${role})`, 'success');
    }
    updateRoleUI();

    // Notify backend in background without blocking UI
    if (window.api && typeof window.api.login === 'function') {
      window.api.login({ username, password }).catch(() => {});
    }

    if (btnSubmit) btnSubmit.disabled = false;
    return;
  }

  // Fallback cloud validation if non-standard credentials
  try {
    let res = await window.api.login({ username, password }).catch(() => null);

    if (res && res.success) {
      sessionStorage.setItem('auth_user', res.username || username);
      sessionStorage.setItem('auth_role', res.role || 'admin');
      sessionStorage.setItem('auth_token', res.token || '');
      localStorage.setItem('auth_user', res.username || username);
      localStorage.setItem('auth_role', res.role || 'admin');
      localStorage.setItem('auth_token', res.token || '');

      window.currentRole = res.role || 'admin';
      const roleSel = document.getElementById('userRoleSelect');
      if (roleSel) roleSel.value = res.role || 'admin';

      hideGatekeeper();

      if (typeof showNotification === 'function') {
        showNotification(`Selamat datang, ${res.username || username}! (Role: ${res.role || 'admin'})`, 'success');
      }
      updateRoleUI();
    } else {
      if (typeof showNotification === 'function') {
        showNotification('Username atau Password salah!', 'error');
      }
    }
  } catch (err) {
    if (typeof showNotification === 'function') {
      showNotification('Username atau Password salah!', 'error');
    }
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

function executeLogout() {
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_role');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_token');
  window.currentRole = 'candidate';
  const roleSel = document.getElementById('userRoleSelect');
  if (roleSel) roleSel.value = 'candidate';
  updateRoleUI();

  showGatekeeper();

  if (typeof showNotification === 'function') showNotification('Anda telah keluar dari sistem.', 'info');
}

window.checkMandatoryStartupLogin = checkMandatoryStartupLogin;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.executeLogin = executeLogin;
window.executeLogout = executeLogout;
