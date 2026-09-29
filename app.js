/**
 * CyberLab Demo — Interactive Security Lab Logic
 * Fully Client-Side / Serverless Demonstration Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Modules
  initTabs();
  initModal();
  initSQLiLab();
  initBruteForceLab();
  initCmdInjectionLab();
});

/* ==========================================================================
   1. NAVIGATION & TABS
   ========================================================================== */
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   2. MODAL / CHEATSHEET
   ========================================================================== */
function initModal() {
  const modal = document.getElementById('modal-cheatsheet');
  const openBtn = document.getElementById('btn-toggle-cheatsheet');
  const closeBtn = document.getElementById('btn-close-modal');
  const footerBtn = document.getElementById('btn-close-modal-footer');

  if (!modal || !openBtn) return;

  const openModal = () => modal.classList.remove('hidden');
  const closeModal = () => modal.classList.add('hidden');

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  footerBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/* ==========================================================================
   3. SQL INJECTION (SQLi) LAB
   ========================================================================== */
function initSQLiLab() {
  const userInput = document.getElementById('sqli-username');
  const passInput = document.getElementById('sqli-password');
  const secureToggle = document.getElementById('sqli-secure-toggle');
  const toggleLabel = document.getElementById('sqli-toggle-label');
  const modeBadge = document.getElementById('sqli-mode-badge');
  const form = document.getElementById('form-sqli-login');
  const queryDisplay = document.getElementById('sqli-query-display');
  const breakdownText = document.getElementById('sqli-breakdown-text');
  const responseBox = document.getElementById('sqli-response-box');
  const dbTbody = document.getElementById('sqli-db-tbody');
  const resetBtn = document.getElementById('btn-reset-sqli');

  // Simulated Database State
  const mockUsers = [
    { id: 1, username: 'admin', role: 'SuperAdministrator', token: 'eyJhbGciOi_admin_master_key' },
    { id: 2, username: 'carlos_sec', role: 'SecurityAnalyst', token: 'usr_sec_991823' },
    { id: 3, username: 'maria_fin', role: 'FinanceManager', token: 'usr_fin_109283' },
    { id: 4, username: 'dev_guest', role: 'ReadOnlyUser', token: 'usr_gst_002812' }
  ];

  // Render initial DB table
  function renderDbTable(matchedUsers = []) {
    dbTbody.innerHTML = '';
    mockUsers.forEach(u => {
      const tr = document.createElement('tr');
      const isMatched = matchedUsers.some(m => m.id === u.id);
      if (isMatched) {
        tr.classList.add('injected');
      }
      tr.innerHTML = `
        <td>#${u.id}</td>
        <td><strong>${u.username}</strong></td>
        <td><span class="badge-tag">${u.role}</span></td>
        <td><code>${u.token.substring(0, 15)}...</code></td>
      `;
      dbTbody.appendChild(tr);
    });
  }

  // Update query preview in real time
  function updateQueryPreview() {
    const user = userInput.value;
    const pass = passInput.value;
    const isSecure = secureToggle.checked;

    if (isSecure) {
      queryDisplay.innerHTML = `// Prepared Statement (Parámetros aislados):\nconst query = "SELECT * FROM users WHERE username = ? AND password = ?";\ndb.execute(query, ["${escapeHtml(user)}", "${escapeHtml(pass)}"]);`;
      breakdownText.innerHTML = `<strong>Modo Seguro:</strong> El motor SQL precompila la estructura de la consulta. La entrada del usuario se evalúa estrictamente como datos literales (String), imposibilitando alterar la lógica booleana del <code>WHERE</code>.`;
    } else {
      queryDisplay.innerHTML = `SELECT * FROM users WHERE username = '${user}' AND password = '${pass}';`;
      
      // Analyze SQL injection characteristics
      const hasOrBypass = /('|\b)(OR|or)\b.*(=|LIKE|<|>)/i.test(user) || /--/.test(user);
      if (hasOrBypass) {
        breakdownText.innerHTML = `<span class="text-danger"><strong>⚠️ Inyección SQL Detectada:</strong></span> Las comillas cerraron el valor de <code>username</code>. El operador <code>OR '1'='1'</code> hace que la condición sea tautológica (siempre Verdadera), ignorando la validación de la contraseña.`;
      } else {
        breakdownText.innerHTML = `<strong>Concatenación en crudo:</strong> Los valores se insertan directamente en el string SQL sin sanitizar. Cualquier carácter de control como comillas simples (<code>'</code>) modificará la semántica de la consulta.`;
      }
    }
  }

  // Toggle Mode Handler
  secureToggle.addEventListener('change', () => {
    const isSecure = secureToggle.checked;
    if (isSecure) {
      toggleLabel.textContent = 'Prepared Statements (Seguro)';
      toggleLabel.className = 'toggle-state-text text-success';
      modeBadge.textContent = 'Modo Seguro';
      modeBadge.className = 'badge-mode secure';
    } else {
      toggleLabel.textContent = 'Concatenación Insegura';
      toggleLabel.className = 'toggle-state-text text-danger';
      modeBadge.textContent = 'Modo Vulnerable';
      modeBadge.className = 'badge-mode';
    }
    updateQueryPreview();
    responseBox.classList.add('hidden');
    renderDbTable([]);
  });

  userInput.addEventListener('input', updateQueryPreview);
  passInput.addEventListener('input', updateQueryPreview);

  // Quick Chips
  document.querySelectorAll('#panel-sqli .btn-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.getAttribute('data-user');
      passInput.value = chip.getAttribute('data-pass');
      updateQueryPreview();
    });
  });

  // Submit Form Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = userInput.value.trim();
    const pass = passInput.value.trim();
    const isSecure = secureToggle.checked;

    responseBox.classList.remove('hidden', 'success', 'danger');

    if (isSecure) {
      // Secure logic: literal equality check
      const found = mockUsers.find(u => u.username === user && pass === 'password123'); // Normal credential
      if (found) {
        responseBox.classList.add('success');
        responseBox.innerHTML = `<strong>✅ Autenticación Exitosa:</strong> Bienvenido, ${found.username} (Rol: ${found.role}). Parámetros validados correctamente.`;
        renderDbTable([found]);
      } else {
        responseBox.classList.add('danger');
        responseBox.innerHTML = `<strong>🛡️ Acceso Denegado (401 Unauthorized):</strong> Credenciales inválidas. El payload fue tratado como texto literal sin alterar la consulta SQL.`;
        renderDbTable([]);
      }
    } else {
      // Vulnerable logic
      const isSqlInjection = /('|\b)(OR|or)\b.*(=|LIKE|<|>)/i.test(user) || /--/.test(user) || /' OR '1'='1/i.test(user);

      if (isSqlInjection) {
        responseBox.classList.add('danger');
        responseBox.innerHTML = `<strong>🚨 BYPASS DE AUTENTICACIÓN EXITOSO (Vulnerabilidad SQLi):</strong><br>
        La consulta devolvió todos los registros de la tabla sin validar contraseñas. Sesión iniciada automáticamente como <strong>admin (SuperAdministrator)</strong>.
        <br><br><code>Token de sesión extraído: ${mockUsers[0].token}</code>`;
        renderDbTable(mockUsers);
      } else if (user === 'admin' && pass === 'supersecret123') {
        responseBox.classList.add('success');
        responseBox.innerHTML = `<strong>✅ Login correcto:</strong> Bienvenido admin.`;
        renderDbTable([mockUsers[0]]);
      } else {
        responseBox.classList.add('danger');
        responseBox.innerHTML = `<strong>❌ Error de autenticación:</strong> Usuario o contraseña incorrectos en la base de datos.`;
        renderDbTable([]);
      }
    }
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    userInput.value = "admin' OR '1'='1";
    passInput.value = "anything";
    updateQueryPreview();
    responseBox.classList.add('hidden');
    renderDbTable([]);
  });

  // Init
  renderDbTable([]);
  updateQueryPreview();
}

/* ==========================================================================
   4. BRUTE FORCE & RATE LIMITING LAB
   ========================================================================== */
function initBruteForceLab() {
  const defenseToggle = document.getElementById('brute-defense-toggle');
  const toggleLabel = document.getElementById('brute-toggle-label');
  const modeBadge = document.getElementById('brute-mode-badge');
  const startBtn = document.getElementById('btn-start-brute');
  const stopBtn = document.getElementById('btn-stop-brute');
  const resetBtn = document.getElementById('btn-reset-brute');
  const clearLogBtn = document.getElementById('btn-clear-brute-log');
  const terminal = document.getElementById('brute-terminal');
  const wordlistContainer = document.getElementById('wordlist-items');
  const wordlistCount = document.getElementById('wordlist-count');

  // Stats
  const statAttempts = document.getElementById('stat-attempts');
  const statSpeed = document.getElementById('stat-speed');
  const statBlocked = document.getElementById('stat-blocked');
  const statStatus = document.getElementById('stat-status');

  const simulatedWordlist = [
    '123456', 'password', '12345678', 'qwerty',
    'admin123', 'welcome', 'login2024', 'football',
    'monkey', 'dragon2024', 'masterkey', 'secret'
  ];

  const validPassword = 'dragon2024';
  let isAttacking = false;
  let attackInterval = null;
  let currentIndex = 0;
  let attemptsCount = 0;
  let blockedCount = 0;
  let attackSpeed = 200; // ms

  // Speed buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      attackSpeed = parseInt(btn.getAttribute('data-speed'), 10);
    });
  });

  // Render Wordlist
  function renderWordlist() {
    wordlistContainer.innerHTML = '';
    wordlistCount.textContent = `${simulatedWordlist.length} contraseñas`;
    simulatedWordlist.forEach((word, idx) => {
      const span = document.createElement('span');
      span.className = 'word-tag';
      span.id = `word-tag-${idx}`;
      span.textContent = word;
      wordlistContainer.appendChild(span);
    });
  }

  // Toggle Defense
  defenseToggle.addEventListener('change', () => {
    const isProtected = defenseToggle.checked;
    if (isProtected) {
      toggleLabel.textContent = 'Rate Limiter Activo (Seguro)';
      toggleLabel.className = 'toggle-state-text text-success';
      modeBadge.textContent = 'Rate Limit Activo';
      modeBadge.className = 'badge-mode secure';
      appendLog('[CONFIG] Middleware Rate Limiter activado (Máximo 4 intentos por minuto por IP).', 'log-cmd');
    } else {
      toggleLabel.textContent = 'Desactivado (Vulnerable)';
      toggleLabel.className = 'toggle-state-text text-danger';
      modeBadge.textContent = 'Sin Protección';
      modeBadge.className = 'badge-mode';
      appendLog('[CONFIG] Servidor en modo vulnerable: Intentos de login ilimitados sin retardo.', 'log-cmd');
    }
  });

  function appendLog(message, className = '') {
    const line = document.createElement('div');
    line.className = `log-line ${className}`;
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${message}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  function stopAttack(statusText = 'Detenido') {
    isAttacking = false;
    clearInterval(attackInterval);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statStatus.textContent = statusText;
    statStatus.className = 'stat-val';
  }

  function runAttackStep() {
    if (currentIndex >= simulatedWordlist.length) {
      stopAttack('Completado');
      appendLog('[ATAQUE] Diccionario finalizado.', 'text-muted');
      return;
    }

    const currentWord = simulatedWordlist[currentIndex];
    const tag = document.getElementById(`word-tag-${currentIndex}`);
    if (tag) tag.className = 'word-tag testing';

    attemptsCount++;
    statAttempts.textContent = attemptsCount;
    statSpeed.textContent = `${Math.round(1000 / attackSpeed)} req/s`;

    const isProtected = defenseToggle.checked;

    // Defense Logic: If protected and > 4 attempts, trigger HTTP 429
    if (isProtected && attemptsCount > 4) {
      blockedCount++;
      statBlocked.textContent = blockedCount;
      if (tag) tag.className = 'word-tag failed';

      appendLog(`POST /api/v1/auth/login 429 Too Many Requests | IP bloqueada temporalmente | Password probada: "${currentWord}"`, 'log-429');
      stopAttack('Bloqueado (429)');
      appendLog('[DEFENSA EXITOSA] El sistema detectó comportamiento anómalo. La dirección IP ha sido suspendida por 60 segundos.', 'text-success');
      return;
    }

    // Check if password matches
    if (currentWord === validPassword) {
      if (tag) tag.className = 'word-tag cracked';
      appendLog(`POST /api/v1/auth/login 200 OK — ¡CREDENCIALES DESCUBIERTAS! Password: "${currentWord}"`, 'log-200');
      stopAttack('¡Descifrado!');
      statStatus.className = 'stat-val text-danger';
      appendLog('[ALERTA DE SEGURIDAD] Acceso administrativo obtenido mediante fuerza bruta en ausencia de Rate Limiting.', 'log-401');
      return;
    } else {
      if (tag) tag.className = 'word-tag failed';
      appendLog(`POST /api/v1/auth/login 401 Unauthorized — Intento fallido con: "${currentWord}"`, 'log-401');
    }

    currentIndex++;
  }

  startBtn.addEventListener('click', () => {
    if (isAttacking) return;
    isAttacking = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statStatus.textContent = 'Atacando...';
    statStatus.className = 'stat-val text-warning';

    appendLog(`[ATAQUE] Iniciando prueba de credenciales contra admin@empresa.com a ${attackSpeed}ms...`, 'log-cmd');

    attackInterval = setInterval(runAttackStep, attackSpeed);
  });

  stopBtn.addEventListener('click', () => {
    stopAttack('Pausado');
    appendLog('[USUARIO] Ataque pausado por el operador.', 'text-muted');
  });

  resetBtn.addEventListener('click', () => {
    stopAttack('Inactivo');
    currentIndex = 0;
    attemptsCount = 0;
    blockedCount = 0;
    statAttempts.textContent = '0';
    statSpeed.textContent = '0 req/s';
    statBlocked.textContent = '0';
    renderWordlist();
    appendLog('[RESET] Contadores y estado de pruebas reiniciados.');
  });

  clearLogBtn.addEventListener('click', () => {
    terminal.innerHTML = '<div class="log-line text-muted">[LOG] Registro de consola vaciado.</div>';
  });

  // Init
  renderWordlist();
}

/* ==========================================================================
   5. COMMAND INJECTION & SHELL LAB
   ========================================================================== */
function initCmdInjectionLab() {
  const defenseToggle = document.getElementById('cmd-defense-toggle');
  const toggleLabel = document.getElementById('cmd-toggle-label');
  const modeBadge = document.getElementById('cmd-mode-badge');
  const form = document.getElementById('form-cmd-tool');
  const ipInput = document.getElementById('cmd-ip-input');
  const invocationDisplay = document.getElementById('cmd-invocation-display');
  const terminalOutput = document.getElementById('cmd-terminal-output');
  const resetBtn = document.getElementById('btn-reset-cmd');
  const clearBtn = document.getElementById('btn-clear-cmd-log');

  function updateInvocationPreview() {
    const rawVal = ipInput.value;
    const isProtected = defenseToggle.checked;

    if (isProtected) {
      invocationDisplay.innerHTML = `// Ejecución Segura (Validación estricta de formato IP):\nconst isIPv4 = /^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$/.test("${escapeHtml(rawVal)}");\nif (!isIPv4) throw new Error("Host inválido");\nexecFile("ping", ["-c", "2", "${escapeHtml(rawVal)}"]);`;
    } else {
      invocationDisplay.innerHTML = `child_process.exec("ping -c 2 ${rawVal}");`;
    }
  }

  defenseToggle.addEventListener('change', () => {
    const isProtected = defenseToggle.checked;
    if (isProtected) {
      toggleLabel.textContent = 'Sanitización / RegExp Segura';
      toggleLabel.className = 'toggle-state-text text-success';
      modeBadge.textContent = 'Modo Seguro';
      modeBadge.className = 'badge-mode secure';
    } else {
      toggleLabel.textContent = 'system() Inseguro';
      toggleLabel.className = 'toggle-state-text text-danger';
      modeBadge.textContent = 'Modo Vulnerable';
      modeBadge.className = 'badge-mode';
    }
    updateInvocationPreview();
  });

  ipInput.addEventListener('input', updateInvocationPreview);

  document.querySelectorAll('#panel-cmd .btn-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      ipInput.value = chip.getAttribute('data-cmd');
      updateInvocationPreview();
    });
  });

  function appendTerminal(line, isError = false) {
    const div = document.createElement('div');
    div.className = `log-line ${isError ? 'text-danger' : 'text-code'}`;
    div.textContent = line;
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = ipInput.value.trim();
    const isProtected = defenseToggle.checked;

    appendTerminal(`$ [HTTP POST /api/tools/ping] input="${input}"`);

    if (isProtected) {
      // Regex check for IPv4
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(input)) {
        appendTerminal(`[ERROR 400 Bad Request] Entrada rechazada por el filtro de seguridad. Caracteres no permitidos detectados.`, true);
        appendTerminal(`[DEFENSA ACTIVA] Se evitó la invocación a la subshell del sistema operativo.`);
        return;
      }

      // Normal ping
      appendTerminal(`PING ${input} (${input}): 56 data bytes`);
      appendTerminal(`64 bytes from ${input}: icmp_seq=0 ttl=117 time=12.4 ms`);
      appendTerminal(`64 bytes from ${input}: icmp_seq=1 ttl=117 time=11.9 ms`);
      appendTerminal(`--- ${input} ping statistics --- 2 packets transmitted, 2 received, 0% packet loss`);
    } else {
      // Vulnerable execution
      const hasInjection = /[;&|`]/.test(input);

      // Simulated standard ping portion
      appendTerminal(`PING ${input.split(/[;&|]/)[0].trim()}: 56 data bytes`);
      appendTerminal(`64 bytes from host: icmp_seq=0 ttl=117 time=14.1 ms`);

      if (hasInjection) {
        appendTerminal(`------------------------------------------------------------`);
        appendTerminal(`[ALERTA] Inyección de Comandos Arbitrarios Ejecutada con Éxito:`);
        
        if (input.includes('whoami')) {
          appendTerminal(`www-data`);
        } else if (input.includes('id')) {
          appendTerminal(`uid=33(www-data) gid=33(www-data) groups=33(www-data)`);
        } else if (input.includes('/etc/passwd')) {
          appendTerminal(`root:x:0:0:root:/root:/bin/bash`);
          appendTerminal(`daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin`);
          appendTerminal(`www-data:x:33:33:www-data:/var/www:/bin/bash`);
          appendTerminal(`jesus:x:1000:1000:Developer:/home/jesus:/bin/bash`);
        } else if (input.includes('uname')) {
          appendTerminal(`Linux production-app-node-01 5.15.0-89-generic #99-Ubuntu SMP x86_64 GNU/Linux`);
        } else {
          appendTerminal(`[Comando encadenado ejecutado en la shell del servidor]`);
        }
        appendTerminal(`------------------------------------------------------------`);
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    ipInput.value = '8.8.8.8; whoami';
    updateInvocationPreview();
  });

  clearBtn.addEventListener('click', () => {
    terminalOutput.innerHTML = '<div class="log-line text-muted">$ Listo para ejecutar peticiones...</div>';
  });

  updateInvocationPreview();
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
