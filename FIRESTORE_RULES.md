# Solucionar "Missing or insufficient permissions" en Firestore

## ⚠️ IMPORTANTE: Solo para desarrollo

Si estás en desarrollo y quieres que funcione rápido:

### Paso 1: Ir a Firestore Security Rules

1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Haz clic en la pestaña **Rules** (Reglas)

### Paso 2: Reemplaza las reglas con esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura a todos
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Paso 3: Haz clic en "Publicar"

---

## 🔒 Para PRODUCCIÓN (más seguro):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección de usuarios
    match /usuarios/{userId} {
      // Cualquiera puede leer todos los usuarios
      allow read: if true;
      
      // Solo crear nuevos usuarios (registro)
      allow create: if !exists(/databases/$(database)/documents/usuarios/$(request.auth.uid));
      
      // Actualizar solo el propio documento
      allow update: if request.auth.uid == userId;
      
      // Eliminar solo admin
      allow delete: if get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // Colección de artículos
    match /articulos/{articuloId} {
      // Leer artículos
      allow read: if true;
      
      // Crear artículos (usuarios autenticados)
      allow create: if request.auth.uid != null;
      
      // Actualizar solo si eres propietario o admin
      allow update: if resource.data.userId == request.auth.uid || 
                       get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
      
      // Eliminar solo si eres propietario o admin
      allow delete: if resource.data.userId == request.auth.uid || 
                       get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }
  }
}
```

---

## Si la solución no funciona:

1. **Reinicia la aplicación**: `npm start`
2. **Limpia el navegador**: Presiona `Ctrl+Shift+Delete` y borra datos
3. **Verifica que Firestore esté habilitado** en Firebase Console
