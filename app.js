/**
 * NexusCloud Technologies — Front-End Application Logic
 * Integración transparente con endpoint REST serverless (/api/login)
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLoginForm();
  initDashboard();
});

/* ==========================================================================
   1. NAVIGATION
   ========================================================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.page-section');
  const heroBtnLogin = document.getElementById('hero-btn-login');
  const headerLoginBtn = document.getElementById('btn-header-login');
  const navBrand = document.getElementById('nav-brand');

  function showSection(targetSectionId) {
    sections.forEach(sec => sec.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    const targetSec = document.getElementById(targetSectionId);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    const activeLink = document.querySelector(`.nav-link[data-section="${targetSectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-section');
      showSection(target);
    });
  });

  if (heroBtnLogin) {
    heroBtnLogin.addEventListener('click', () => showSection('section-login'));
  }
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('section-login');
    });
  }
  if (navBrand) {
    navBrand.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('section-home');
    });
  }
}

/* ==========================================================================
   2. AUTHENTICATION & LOGIN FORM
   ========================================================================== */
function initLoginForm() {
  const form = document.getElementById('main-login-form');
  const userInput = document.getElementById('input-username');
  const passInput = document.getElementById('input-password');
  const alertBox = document.getElementById('login-feedback-alert');
  const submitBtn = document.getElementById('btn-submit-auth');
  const formCard = document.getElementById('login-form-card');
  const dashCard = document.getElementById('dashboard-view-card');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = userInput.value.trim();
    const password = passInput.value;

    alertBox.className = 'alert-box hidden';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verificando...';

    try {
      // Petición real al endpoint /api/login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login exitoso (Normal o SQLi Bypass)
        alertBox.className = 'alert-box success';
        alertBox.textContent = data.message || 'Sesión iniciada con éxito. Redirigiendo...';

        setTimeout(() => {
          formCard.classList.add('hidden');
          dashCard.classList.remove('hidden');

          const user = data.user || {};
          document.getElementById('dash-welcome-title').textContent = `Bienvenido, ${user.username || 'Usuario'}`;
          document.getElementById('dash-role-badge').textContent = user.role || 'Usuario';
          document.getElementById('dash-email-subtitle').textContent = user.email || `${user.username}@nexuscloud.corp`;
          document.getElementById('dash-token-display').textContent = user.token || 'nexus_session_token';

          const flagEl = document.getElementById('dash-flag-display');
          const flagContainer = document.getElementById('dash-flag-container');
          if (user.internal_flag) {
            flagContainer.classList.remove('hidden');
            flagEl.textContent = user.internal_flag;
          } else {
            flagContainer.classList.add('hidden');
          }

          // Update header
          const userStatus = document.getElementById('header-user-status');
          if (userStatus) {
            userStatus.innerHTML = `<span class="user-role-badge">${user.username} (${user.role})</span>`;
          }
        }, 600);
      } else {
        // Fallo de autenticación (401)
        alertBox.className = 'alert-box danger';
        alertBox.textContent = data.message || data.error || 'Credenciales inválidas. Por favor verifique sus datos.';
      }
    } catch (err) {
      // Fallback para pruebas locales estáticas sin backend Node
      handleClientSideFallback(username, password, alertBox, formCard, dashCard);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar al Panel';
    }
  });
}

// Fallback cliente en caso de que se pruebe en un servidor estático sin Node runtime
function handleClientSideFallback(username, password, alertBox, formCard, dashCard) {
  const isSqlInjection = 
    /('|\b)(OR|or)\b.*(=|LIKE|<|>)/i.test(username) ||
    /'\s*OR\s*'\w+'\s*=\s*'\w+/i.test(username) ||
    /--/.test(username) ||
    /#/.test(username) ||
    /'\s*OR\s*1\s*=\s*1/i.test(username);

  if (isSqlInjection) {
    alertBox.className = 'alert-box success';
    alertBox.textContent = 'Acceso concedido mediante bypass de autenticación.';
    setTimeout(() => {
      formCard.classList.add('hidden');
      dashCard.classList.remove('hidden');
      document.getElementById('dash-welcome-title').textContent = 'Bienvenido, admin';
      document.getElementById('dash-role-badge').textContent = 'SuperAdministrator';
      document.getElementById('dash-email-subtitle').textContent = 'admin@nexuscloud.corp';
      document.getElementById('dash-token-display').textContent = 'nexus_admin_sess_9941a8e2';
      document.getElementById('dash-flag-display').textContent = 'FLAG-SQLI{nexus_sql_injection_bypass_success}';
    }, 400);
  } else if (username === 'admin' && password === 'dragon2024') {
    alertBox.className = 'alert-box success';
    alertBox.textContent = 'Credenciales correctas. Bienvenido.';
    setTimeout(() => {
      formCard.classList.add('hidden');
      dashCard.classList.remove('hidden');
      document.getElementById('dash-welcome-title').textContent = 'Bienvenido, admin';
      document.getElementById('dash-role-badge').textContent = 'SuperAdministrator';
      document.getElementById('dash-email-subtitle').textContent = 'admin@nexuscloud.corp';
      document.getElementById('dash-token-display').textContent = 'nexus_admin_sess_9941a8e2';
      document.getElementById('dash-flag-container').classList.add('hidden');
    }, 400);
  } else {
    alertBox.className = 'alert-box danger';
    alertBox.textContent = 'Credenciales inválidas. Por favor verifique sus datos.';
  }
}

/* ==========================================================================
   3. DASHBOARD
   ========================================================================== */
function initDashboard() {
  const logoutBtn = document.getElementById('btn-dash-logout');
  const formCard = document.getElementById('login-form-card');
  const dashCard = document.getElementById('dashboard-view-card');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      dashCard.classList.add('hidden');
      formCard.classList.remove('hidden');
      const userStatus = document.getElementById('header-user-status');
      if (userStatus) {
        userStatus.innerHTML = `<a href="#login" class="btn-nav-primary" id="btn-header-login">Iniciar Sesión</a>`;
      }
    });
  }
}
