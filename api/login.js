// Vercel Serverless Function: /api/login
// Soporta peticiones JSON, x-www-form-urlencoded y llamadas directas desde curl, hydra o el navegador.

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
    // Bypass exitoso mediante SQLi
    res.setHeader('Set-Cookie', 'session_token=nexus_admin_sess_9941a8e2; Path=/; HttpOnly; SameSite=Lax');
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión correcto (Acceso Administrativo)',
      user: {
        id: 1,
        username: 'admin',
        role: 'SuperAdministrator',
        email: 'admin@nexuscloud.corp',
        token: 'nexus_admin_sess_9941a8e2',
        internal_flag: 'FLAG-SQLI{nexus_sql_injection_bypass_success}'
      },
      debug_query: query
    });
  }

  // 2. Base de datos simulada para credenciales normales y pruebas de fuerza bruta
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

  // 3. Fallo de autenticación (Respuesta estándar HTTP 401 para herramientas como Hydra o curl)
  return res.status(401).json({
    success: false,
    error: 'Credenciales inválidas',
    message: 'El usuario o la contraseña proporcionados no coinciden con nuestros registros.'
  });
};
