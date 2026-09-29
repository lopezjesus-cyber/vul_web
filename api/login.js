// Vercel Serverless Function: /api/login
// Soporta peticiones JSON, x-www-form-urlencoded y llamadas directas desde PowerShell (Invoke-RestMethod), scripts o el navegador.

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint requiere peticiones HTTP POST con credenciales de usuario.'
    });
  }

  // Parse body (compatible con JSON y form urlencoded)
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // URL encoded fallback: username=...&password=...
      const params = new URLSearchParams(body);
      body = {
        username: params.get('username') || '',
        password: params.get('password') || ''
      };
    }
  }

  const username = (body.username || '').toString().trim();
  const password = (body.password || '').toString();

  // Base de datos corporativa interna (Tabla: accounts)
  const accountsTable = [
    { id: 1, username: 'admin', role: 'SuperAdministrator', email: 'admin@nexuscloud.corp', password_hash: '$2y$12$e8Y5T1mO... (dragon2024)', created_at: '2024-01-15' },
    { id: 2, username: 'soporte', role: 'SupportTech', email: 'soporte@nexuscloud.corp', password_hash: '$2y$12$k9L2P4qR... (password123)', created_at: '2024-03-22' },
    { id: 3, username: 'operador', role: 'Operator', email: 'operador@nexuscloud.corp', password_hash: '$2y$12$m4N1X8wZ... (operador2024)', created_at: '2024-06-10' },
    { id: 4, username: 'ciso_auditor', role: 'Auditor', email: 'security@nexuscloud.corp', password_hash: '$2y$12$p7X9A3cV... (NexusSec#99)', created_at: '2024-08-01' }
  ];

  // Simulación de consulta SQL interna
  const query = `SELECT * FROM accounts WHERE username = '${username}' AND password_hash = '${password}' LIMIT 1;`;

  // 1. Detección de Inyección SQL (SQLi)
  const isSqlInjection = 
    /('|\b)(OR|or)\b.*(=|LIKE|<|>)/i.test(username) ||
    /'\s*OR\s*'\w+'\s*=\s*'\w+/i.test(username) ||
    /--/.test(username) ||
    /#/.test(username) ||
    /'\s*OR\s*1\s*=\s*1/i.test(username) ||
    /UNION\s+SELECT/i.test(username);

  if (isSqlInjection) {
    // Bypass exitoso mediante SQLi y filtración de la tabla de usuarios
    res.setHeader('Set-Cookie', 'session_token=nexus_admin_sess_9941a8e2; Path=/; HttpOnly; SameSite=Lax');
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión correcto (Acceso Administrativo obtenido por SQLi)',
      user: {
        id: 1,
        username: 'admin',
        role: 'SuperAdministrator',
        email: 'admin@nexuscloud.corp',
        token: 'nexus_admin_sess_9941a8e2',
        internal_flag: 'FLAG-SQLI{nexus_sql_injection_bypass_success}'
      },
      debug_query: query,
      database: {
        table_name: 'accounts',
        total_records: accountsTable.length,
        columns: ['id', 'username', 'role', 'email', 'password_hash', 'created_at'],
        records: accountsTable
      }
    });
  }

  // 2. Validación de credenciales normales
  const validUsers = [
    { username: 'admin', password: 'dragon2024', role: 'SuperAdministrator', email: 'admin@nexuscloud.corp' },
    { username: 'soporte', password: 'password123', role: 'SupportTech', email: 'soporte@nexuscloud.corp' },
    { username: 'operador', password: 'operador2024', role: 'Operator', email: 'operador@nexuscloud.corp' }
  ];

  const matchedUser = validUsers.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (matchedUser) {
    res.setHeader('Set-Cookie', `session_token=nexus_sess_${matchedUser.username}; Path=/; HttpOnly; SameSite=Lax`);
    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      user: {
        username: matchedUser.username,
        role: matchedUser.role,
        email: matchedUser.email,
        token: `nexus_sess_${matchedUser.username}_token`
      }
    });
  }

  // 3. Fallo de autenticación (Respuesta estándar HTTP 401 para PowerShell y scripts)
  return res.status(401).json({
    success: false,
    error: 'Credenciales inválidas',
    message: 'El usuario o la contraseña proporcionados no coinciden con nuestros registros.'
  });
};
