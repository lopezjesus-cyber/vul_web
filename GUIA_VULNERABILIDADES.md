# Manual Técnico de Auditoría, Diagnóstico y Remediación

Este documento detalla el funcionamiento interno de cada escenario implementado en la plataforma, analizando la causa raíz de la debilidad en el código, el impacto en la seguridad y las pautas técnicas necesarias para su corrección definitiva.

---

## 1. Escenario: Inyección SQL (SQLi)

### A. Causa Raíz en el Código
La vulnerabilidad reside en la construcción dinámica de sentencias SQL mediante concatenación directa de parámetros suministrados por el usuario, sin validación previa ni uso de sentencias preparadas:

```javascript
// Código vulnerable (api/login.js)
const query = `SELECT * FROM accounts WHERE username = '${username}' AND password_hash = '${password}' LIMIT 1;`;
```

Cuando un parámetro contiene caracteres de control de sintaxis SQL (como comillas simples `'` o secuencias de comentarios `--`), el intérprete de base de datos altera la lógica de la cláusula `WHERE`. Por ejemplo, al evaluar una condición tautológica (`'1'='1'`), la consulta devuelve el primer registro existente (comúnmente la cuenta administradora), evadiendo la comprobación de la contraseña.

### B. Procedimiento de Auditoría y Verificación
1. **Revisión estática de código (SAST):**
   * Inspeccionar todas las consultas a base de datos y verificar que ningún valor externo participe en la concatenación de cadenas SQL.
2. **Evaluación de respuestas del servidor:**
   * Comprobar si el sistema devuelve respuestas anómalas, cambios de estado HTTP no justificados o revelación de registros no autorizados al recibir comillas simples o secuencias de escape.
3. **Comprobación de registros (Logs):**
   * Revisar los registros de consultas en la base de datos para identificar sentencias mal estructuradas o con sintaxis modificada.

### C. Remediación Defensiva (Parche Seguro)
La solución definitiva recomendada por OWASP es el uso de **consultas preparadas con tipado estricto de parámetros** (*Prepared Statements*), o el empleo de un ORM moderno:

```javascript
// Implementación segura con consultas parametrizadas
const query = "SELECT id, username, role FROM accounts WHERE username = ? AND password_hash = ? LIMIT 1;";
const [rows] = await db.execute(query, [username, hashedPassword]);
```

**Medidas adicionales de mitigación:**
* **Principio de menor privilegio:** Asegurar que el usuario de base de datos utilizado por la aplicación no tenga permisos administrativos innecesarios (por ejemplo, `DROP TABLE`, `ALTER`, `GRANT`).
* **Hashing seguro de contraseñas:** Emplear algoritmos resistentes a ataques de fuerza bruta como `Argon2id` o `bcrypt` con factores de coste adecuados.

---

## 2. Escenario: Fuerza Bruta en el Mecanismo de Autenticación

### A. Causa Raíz en el Código
El endpoint de autenticación (`/api/login`) carece de controles de frecuencia de peticiones (*Rate Limiting*) y de mecanismos de bloqueo temporal ante fallos reiterados. Esto permite enviar un volumen ilimitado de solicitudes por unidad de tiempo sin penalización ni retardo.

### B. Procedimiento de Auditoría y Verificación
1. **Auditoría de políticas de control de acceso:**
   * Evaluar si el servidor aplica límites en el número de intentos consecutivos fallidos por dirección IP o por cuenta de usuario.
2. **Análisis de uniformidad en las respuestas:**
   * Verificar que los mensajes de error no revelen la existencia previa del usuario (evitar mensajes como *"El usuario no existe"*, utilizando en su lugar *"Credenciales incorrectas"*).
3. **Monitoreo de tráfico y telemetría:**
   * Analizar si se generan alertas en el SIEM o en los sistemas de detección de intrusiones (IDS) ante ráfagas anómalas contra los endpoints de autenticación.

### C. Remediación Defensiva (Parche Seguro)
Implementar middleware de limitación de tasa (*Rate Limiting*) en el servidor de aplicaciones o a nivel de proxy inverso/WAF:

```javascript
// Ejemplo de implementación defensiva con express-rate-limit
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 5,                     // Máximo 5 intentos por IP
  message: {
    success: false,
    error: 'Demasiados intentos fallidos. Intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/login', loginLimiter, authHandler);
```

**Medidas complementarias:**
* **Autenticación multifactor (MFA):** Requerir un segundo factor (TOTP o WebAuthn) para neutralizar ataques basados en contraseñas comprometidas.
* **Bloqueo progresivo y CAPTCHA:** Introducir desafíos de validación humana tras un umbral bajo de fallos consecutivos.

---

## 3. Escenario: Inyección de Comandos del Sistema Operativo

### A. Causa Raíz en el Código
La debilidad se origina cuando la aplicación web invoca utilidades del sistema operativo mediante una subshell pasándole directamente argumentos concatenados provenientes del usuario:

```javascript
// Patrón inseguro conceptual
const { exec } = require('child_process');
exec(`ping -c 2 ${host}`, (error, stdout) => { ... });
```

Si el parámetro contiene metacaracteres del intérprete de comandos (como `;`, `&`, `|`, `` ` `` o `$()`), la subshell interpreta dichos símbolos como separadores de instrucciones, ejecutando comandos arbitrarios adicionales con los privilegios del proceso web (`www-data`).

### B. Procedimiento de Auditoría y Verificación
1. **Revisión de arquitectura y dependencias:**
   * Identificar si existen llamadas directas a funciones del sistema (`exec`, `system`, `popen`) para resolver problemas que podrían abordarse con librerías nativas.
2. **Inspección de validación de entradas:**
   * Comprobar si el backend rechaza o normaliza cadenas que contienen caracteres no alfanuméricos o metacaracteres de control de shell.

### C. Remediación Defensiva (Parche Seguro)
1. **Evitar la invocación de subshells:** Emplear APIs de red nativas en el lenguaje de programación en lugar de invocar utilidades binarias del sistema operativo.
2. **Validación estricta con lista blanca (Allowlist):** Si la invocación es estrictamente necesaria, validar que la entrada coincida rigurosamente con el formato esperado (por ejemplo, formato IPv4/IPv6):

```javascript
// Validación estricta con lista blanca (Allowlist)
const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

if (!ipRegex.test(host)) {
  return res.status(400).json({ error: 'Dirección IP con formato inválido.' });
}

// Ejecución sin shell (argumentos pasados como arreglo aislado)
const { execFile } = require('child_process');
execFile('/bin/ping', ['-c', '2', host], (error, stdout) => {
  // Manejo seguro de la salida
});
```

---

## Resumen de Buenas Prácticas de Arquitectura

| Vulnerabilidad | Causa Principal | Corrección Primaria | Control Complementario |
| :--- | :--- | :--- | :--- |
| **SQL Injection** | Concatenación de entradas en cadenas SQL | Consultas parametrizadas (*Prepared Statements*) | Principio de menor privilegio en BD |
| **Fuerza Bruta** | Ausencia de restricciones de frecuencia | *Rate Limiting* por IP y cuenta | Autenticación multifactor (MFA) |
| **Inyección de Comandos** | Invocación de subshells con datos no validados | Uso de APIs nativas / `execFile` con validación estricta | Aislamiento en contenedores y sandboxing |
