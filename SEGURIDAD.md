# INSTRUCCIONES DE SEGURIDAD DE FIRESTORE

## Cómo aplicar las reglas de seguridad

Las reglas de seguridad están definidas en el archivo `firestore.rules`. Para aplicarlas:

### Opción 1: Desde la Consola de Firebase (Recomendado)
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Reglas**
5. Copia y pega el contenido del archivo `firestore.rules`
6. Haz clic en **Publicar**

### Opción 2: Usando Firebase CLI
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar Firebase en tu proyecto (si no lo has hecho)
firebase init firestore

# Desplegar solo las reglas de Firestore
firebase deploy --only firestore:rules
```

## ⚠️ IMPORTANTE: Migración de Contraseñas

Las contraseñas ahora están encriptadas con bcrypt. Los usuarios existentes en Firestore con contraseñas en texto plano NO podrán iniciar sesión.

### Opciones para migrar usuarios existentes:

#### Opción A: Resetear todos los usuarios (Recomendado para desarrollo)
1. Elimina todos los usuarios de Firestore
2. Pide a los usuarios que se registren nuevamente
3. Las nuevas contraseñas estarán encriptadas

#### Opción B: Script de migración (Para producción)
```javascript
// Ejecutar una sola vez en Node.js con privilegios de admin
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

admin.initializeApp();
const db = admin.firestore();

async function migrarContrasenas() {
  const usuarios = await db.collection('usuarios').get();
  
  for (const doc of usuarios.docs) {
    const data = doc.data();
    // Solo migrar si la contraseña NO está hasheada
    if (data.password && !data.password.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await doc.ref.update({ password: hashedPassword });
      console.log(`Usuario ${data.email} migrado`);
    }
  }
}

migrarContrasenas();
```

## Mejoras de Seguridad Implementadas

✅ **Encriptación de contraseñas** con bcrypt (10 salt rounds)
✅ **Tokens de sesión con expiración** de 24 horas
✅ **Rate limiting** en login (máximo 5 intentos en 15 minutos)
✅ **Reglas de seguridad en Firestore** para proteger datos
✅ **Validación de inputs** contra XSS
✅ **Variables de entorno** para credenciales sensibles

## Configuración Adicional Recomendada

### 1. Verificar archivo .gitignore
Asegúrate de que `.env` esté en `.gitignore`:
```
.env
.env.local
.env.production
```

### 2. Configurar dominios autorizados en Firebase
1. Ve a Firebase Console > Authentication > Settings
2. En "Authorized domains", agrega solo tus dominios de producción
3. Elimina dominios de prueba

### 3. Habilitar App Check (Recomendado)
1. Ve a Firebase Console > App Check
2. Activa App Check para proteger contra uso no autorizado
3. Sigue las instrucciones para tu plataforma

### 4. Implementar HTTPS en producción
- Asegúrate de que tu aplicación use HTTPS en producción
- Considera usar servicios como Netlify, Vercel o Firebase Hosting

### 5. Configurar CORS en Supabase Storage
1. Ve a Supabase Dashboard > Storage
2. Configura políticas de acceso apropiadas
3. Limita los dominios permitidos

## Notas de Seguridad

⚠️ **LocalStorage vs Cookies**
- Actualmente usamos `localStorage` para tokens
- Considera migrar a `httpOnly cookies` para mayor seguridad en producción

⚠️ **Contraseñas en Firestore**
- Aunque están encriptadas, considera usar Firebase Authentication oficial
- Firebase Auth ofrece más funciones (2FA, reseteo de contraseña, etc.)

⚠️ **Rate Limiting**
- El rate limiting actual es solo en frontend
- Para producción, implementa rate limiting en Cloud Functions

⚠️ **Validación del lado del servidor**
- Actualmente toda la validación es en cliente
- Usa Cloud Functions para validaciones críticas del lado del servidor
