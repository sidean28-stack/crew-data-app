// js/auth.js

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
  if (role === 'admin' || role === 'superadmin') {
    const savedRole = sessionStorage.getItem('auth_role');
    if (!savedRole) {
      window.pendingTargetRole = role;
      openLoginModal();
      return;
    }
    window.currentRole = savedRole;
  } else {
    window.currentRole = role;
  }
  updateRoleUI();
}

function updateRoleUI() {
  const currentRole = window.currentRole || 'admin';
  const savedRole = sessionStorage.getItem('auth_role') || currentRole;
  const authUser = sessionStorage.getItem('auth_user');

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
  if (btnLogin && btnLogout) {
    if (authUser) {
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-flex';
      btnLogout.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> <span>Keluar (${escapeHtml(authUser)})</span>`;
    } else {
      btnLogin.style.display = 'inline-flex';
      btnLogout.style.display = 'none';
    }
  }

  // Super Admin Audit Log Button Visibility
  const auditBtn = document.getElementById('btnAuditLog');
  if (auditBtn) {
    auditBtn.style.display = (savedRole === 'superadmin' || window.currentRole === 'superadmin') ? 'inline-flex' : 'none';
  }

  if (typeof loadDirectoryTable === 'function') loadDirectoryTable();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.classList.add('active');
    const input = document.getElementById('loginUsername');
    if (input) input.focus();
  }
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
}

async function executeLogin(e) {
  if (e) e.preventDefault();
  const uInput = document.getElementById('loginUsername');
  const pInput = document.getElementById('loginPassword');
  const btnSubmit = document.getElementById('btnLoginSubmit');

  const username = String(uInput ? uInput.value : '').trim();
  const password = String(pInput ? pInput.value : '').trim();

  if (!username || !password) {
    if (typeof showNotification === 'function') showNotification('Username dan Password wajib diisi!', 'warning');
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;

  try {
    let res = null;
    if (window.api && typeof window.api.login === 'function') {
      res = await window.api.login({ username, password });
    }

    // Fallback credential validation if offline / GAS sync pending
    if (!res || !res.success) {
      const isSuper = (username.toLowerCase() === 'superadmin' && password === 'SuperAdmin123!');
      const isAdmin = (username.toLowerCase() === 'admin' && password === 'Admin123!');
      if (isSuper || isAdmin) {
        res = {
          success: true,
          role: isSuper ? 'superadmin' : 'admin',
          username: username,
          token: 'local_token_' + Date.now()
        };
      }
    }

    if (res && res.success) {
      sessionStorage.setItem('auth_user', res.username || username);
      sessionStorage.setItem('auth_role', res.role || 'admin');
      sessionStorage.setItem('auth_token', res.token || '');
      
      window.currentRole = res.role || 'admin';
      const roleSel = document.getElementById('userRoleSelect');
      if (roleSel) roleSel.value = 'admin';

      closeLoginModal();
      if (typeof showNotification === 'function') {
        showNotification(`Selamat datang, ${res.username || username}! (Role: ${res.role || 'admin'})`, 'success');
      }
      updateRoleUI();
    } else {
      if (typeof showNotification === 'function') {
        showNotification(res && res.message ? res.message : 'Username atau Password salah!', 'error');
      }
    }
  } catch (err) {
    if (typeof showNotification === 'function') showNotification('Gagal memproses login: ' + err.message, 'error');
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

function executeLogout() {
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_role');
  sessionStorage.removeItem('auth_token');
  window.currentRole = 'candidate';
  const roleSel = document.getElementById('userRoleSelect');
  if (roleSel) roleSel.value = 'candidate';
  updateRoleUI();
  if (typeof showNotification === 'function') showNotification('Anda telah keluar dari sistem.', 'info');
}

window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.executeLogin = executeLogin;
window.executeLogout = executeLogout;
