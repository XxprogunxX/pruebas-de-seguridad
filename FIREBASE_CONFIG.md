# Configuración de Firebase

## Pasos para configurar Firebase en tu aplicación:

### 1. Crear un proyecto en Firebase Console
- Ve a [Firebase Console](https://console.firebase.google.com/)
- Haz clic en "Crear proyecto" o "Añadir proyecto"
- Sigue los pasos para crear un nuevo proyecto

### 2. Habilitar autenticación por correo electrónico
- En Firebase Console, ve a "Autenticación" (en el menú izquierdo)
- Haz clic en la pestaña "Método de inicio de sesión"
- Activa "Correo electrónico y contraseña"

### 3. Obtener las credenciales de Firebase
- Ve a "Configuración del proyecto" (engranaje en la esquina superior)
- En la pestaña "General", baja hasta "Tus apps"
- Si no tienes una app web, haz clic en "</>" para crear una
- Copia las credenciales de firebaseConfig

### 4. Configurar las variables de entorno
- Abre el archivo `.env` en la raíz del proyecto
- Reemplaza los valores con tu configuración de Firebase:

```env
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
```

### 5. Reiniciar la aplicación
Después de actualizar el archivo `.env`, reinicia el servidor:
```bash
npm start
```

## Características de autenticación

✅ Registro de nuevos usuarios
✅ Iniciar sesión con email y contraseña
✅ Validación de errores
✅ Sesión persistente con Firebase Auth
✅ Cerrar sesión

## Notas de seguridad
- NO compartas tus credenciales de Firebase
- El archivo `.env` está en `.gitignore` por razones de seguridad
- Las credenciales que aparecen en el código del cliente son seguras (están restringidas en Firebase Console)
