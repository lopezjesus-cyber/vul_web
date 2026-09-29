# Manual Técnico de Auditoría, Diagnóstico y Remediación: Inyección SQL (SQLi)

Este documento detalla el funcionamiento interno de la vulnerabilidad de **Inyección SQL (SQLi)** implementada en la plataforma, analizando la causa raíz en el código, el impacto en la seguridad y las pautas técnicas necesarias para su corrección definitiva.

---

## 1. Escenario: Inyección SQL en Autenticación (SQLi Bypass)

### A. Causa Raíz en el Código
La vulnerabilidad reside en la construcción dinámica de sentencias SQL mediante concatenación directa de parámetros suministrados por el usuario, sin validación previa ni uso de sentencias preparadas:

```javascript
// Código vulnerable (api/login.js)
const query = `SELECT * FROM accounts WHERE username = '${username}' AND password_hash = '${password}' LIMIT 1;`;
```

Cuando el parámetro `username` contiene caracteres de control de sintaxis SQL (como comillas simples `'` o comentarios `--`), el intérprete de base de datos altera la lógica de la cláusula `WHERE`. 

Al inyectar una condición tautológica como:
```text
admin' OR '1'='1
```
La sentencia resultante se evalúa de la siguiente forma:
```sql
SELECT * FROM accounts WHERE username = 'admin' OR '1'='1' AND password_hash = '...' LIMIT 1;
```
Dado que la condición `'1'='1'` siempre es verdadera, la cláusula devuelve el primer registro coincidente en la base de datos (generalmente la cuenta administradora), evadiendo completamente la comprobación de la contraseña.

---

### B. Procedimiento de Auditoría y Verificación

1. **Revisión estática de código (SAST):**
   * Inspeccionar todas las consultas a la base de datos y comprobar que ningún valor externo (proveniente de `req.body` o `req.query`) participe en la concatenación de cadenas SQL.
2. **Evaluación de respuestas del servidor:**
   * Comprobar si el sistema devuelve respuestas anómalas, cambios de estado HTTP no justificados o acceso no autorizado al recibir caracteres delimitadores (`'`, `"`, `--`, `/*`).
3. **Comprobación de registros (Logs):**
   * Revisar los registros de consultas en la base de datos para identificar sentencias mal estructuradas o con sintaxis modificada.

---

### C. Remediación Defensiva (Parche Seguro)

La solución definitiva recomendada por el estándar OWASP es el uso de **consultas preparadas con tipado estricto de parámetros** (*Prepared Statements*), o el empleo de un ORM moderno:

```javascript
// Implementación segura con consultas parametrizadas (Prepared Statements)
const query = "SELECT id, username, role FROM accounts WHERE username = ? AND password_hash = ? LIMIT 1;";
const [rows] = await db.execute(query, [username, hashedPassword]);
```

**Medidas adicionales de mitigación:**
* **Principio de menor privilegio:** Asegurar que el usuario de base de datos utilizado por la aplicación no posea permisos administrativos innecesarios (por ejemplo, `DROP TABLE`, `ALTER`, `GRANT`).
* **Hashing seguro de contraseñas:** Emplear algoritmos resistentes como `Argon2id` o `bcrypt` con factores de coste adecuados en lugar de almacenar o comparar contraseñas en texto claro.

---

## 2. Resumen de Buenas Prácticas

| Aspecto | Implementación Vulnerable | Implementación Defensiva (Segura) |
| :--- | :--- | :--- |
| **Construcción de Consultas** | Concatenación de strings con `${var}` | Parámetros vinculados (`?` o `$1`) |
| **Control de Entrada** | Aceptación directa de metacaracteres | Validación de tipos y longitudes |
| **Permisos de BD** | Conexión con privilegios globales | Usuario restringido a `SELECT` en tabla específica |
| **Manejo de Errores** | Exposición de consultas en depuración | Mensajes genéricos sin trazas técnicas |
