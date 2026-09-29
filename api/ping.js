// Vercel Serverless Function: /api/ping
// Admite peticiones GET /api/ping?host=... y POST /api/ping con { "host": "..." }

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let host = '';

  if (req.method === 'GET') {
    host = (req.query.host || '').toString();
  } else if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        const params = new URLSearchParams(body);
        body = { host: params.get('host') || '' };
      }
    }
    host = (body.host || req.query.host || '').toString();
  }

  if (!host) {
    return res.status(400).json({
      error: 'Parámetro faltante',
      message: 'Debes especificar un parámetro "host" (Ej: /api/ping?host=8.8.8.8)'
    });
  }

  // Detección de inyección de comandos del sistema operativo (; && | ` $)
  const hasInjection = /[;&|`$]/.test(host);
  const targetIp = host.split(/[;&|`$]/)[0].trim() || '127.0.0.1';

  let outputLines = [
    `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`,
    `64 bytes from ${targetIp}: icmp_seq=1 ttl=117 time=13.4 ms`,
    `64 bytes from ${targetIp}: icmp_seq=2 ttl=117 time=14.1 ms`,
    `--- ${targetIp} ping statistics ---`,
    `2 packets transmitted, 2 received, 0% packet loss, time 1002ms`
  ];

  if (hasInjection) {
    outputLines.push('');
    outputLines.push('--- [Command Execution Output] ---');

    if (host.includes('whoami')) {
      outputLines.push('www-data');
    } else if (host.includes('id')) {
      outputLines.push('uid=33(www-data) gid=33(www-data) groups=33(www-data)');
    } else if (host.includes('passwd')) {
      outputLines.push('root:x:0:0:root:/root:/bin/bash');
      outputLines.push('daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin');
      outputLines.push('www-data:x:33:33:www-data:/var/www:/bin/bash');
      outputLines.push('admin:x:1000:1000:SysAdmin:/home/admin:/bin/bash');
    } else if (host.includes('uname')) {
      outputLines.push('Linux nexus-prod-web-01 5.15.0-89-generic #99-Ubuntu SMP x86_64 GNU/Linux');
    } else if (host.includes('ls')) {
      outputLines.push('app.js  config.json  index.html  package.json  secret_keys.env');
    } else if (host.includes('secret_keys.env') || host.includes('flag')) {
      outputLines.push('FLAG-RCE{nexus_system_command_injection_rce_unlocked}');
      outputLines.push('DB_PASSWORD=nexus_super_db_pass_2024');
    } else {
      outputLines.push('[Comando ejecutado en la shell del servidor]');
    }
  }

  // Si la petición viene de curl (Accept: text/plain o curl User-Agent), podemos enviar texto plano legible
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.toLowerCase().includes('curl')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(outputLines.join('\n') + '\n');
  }

  return res.status(200).json({
    command: `ping -c 2 ${host}`,
    host: targetIp,
    has_injection: hasInjection,
    output: outputLines.join('\n'),
    lines: outputLines
  });
};
