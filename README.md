# SecDemo Interactive Lab 🛡️

Simulador interactivo y visual de vulnerabilidades web (Inyección SQL, Ataque de Fuerza Bruta y Ejecución de Comandos del Sistema Operativo) diseñado para demostraciones en vivo, charlas y formación técnica.

## 🚀 Despliegue en Vercel

Esta aplicación está construida con arquitectura **100% estática y serverless**, lo que garantiza que:
* Se despliega de forma inmediata en Vercel sin dependencias pesadas.
* No compromete la infraestructura de hosting ni expone servicios reales vulnerables al exterior.
* Ofrece una experiencia visual fluida e instantánea en vivo.

### Opción 1: Con Vercel CLI
```bash
# 1. Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# 2. Desplegar desde la carpeta del proyecto
vercel
```

### Opción 2: Conectar con GitHub
1. Sube este directorio a un repositorio de GitHub.
2. Ingresa a [vercel.com](https://vercel.com) e importa tu repositorio.
3. Vercel detectará automáticamente los archivos estáticos y publicará la web con HTTPS gratuito.

---

## 🎯 Módulos incluidos en la Demostración

1. **💉 Inyección SQL (SQLi):**
   * Demuestra cómo la concatenación de variables en sentencias SQL permite evadir autenticaciones (`admin' OR '1'='1`).
   * Visualiza la diferencia con el uso de **Prepared Statements** (consultas parametrizadas).

2. **⚡ Fuerza Bruta & Rate Limiting:**
   * Simulación interactiva de ataque de diccionario contra endpoints de autenticación.
   * Telemetría en tiempo real: Peticiones por segundo, registro HTTP y demostración de respuesta `HTTP 429 Too Many Requests`.

3. **🖥️ Inyección de Comandos & Shell:**
   * Muestra el riesgo de invocar utilidades del sistema (`ping`) concatenando entradas sin sanitizar.
   * Explicación de mitigaciones mediante listas blancas de caracteres y APIs seguras.
