
1. Crea un repositorio vacío en GitHub (sin README, sin .gitignore) desde
   https://github.com/new — por ejemplo `reminder-app-sena`.
2. Descarga el .zip que te compartí y descomprímelo, o copia la carpeta a tu equipo.
3. Dentro de la carpeta del proyecto, ejecuta:

```bash
git init
git add .
git commit -m "Clase 11 - Notificaciones y persistencia en React Native/Expo"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/reminder-app-sena.git
git push -u origin main
```

4. Copia la URL de tu repositorio (`https://github.com/TU_USUARIO/reminder-app-sena`) y
   entrégala como evidencia de producto según lo pide la guía.

## 6. Checklist de evidencia (según el punto 4 de la guía)

- [x] Codifica la aplicación móvil según las especificaciones del diseño.
- [x] Implementa almacenamiento persistente (AsyncStorage / SQLite) correctamente.
- [x] Programa notificaciones locales con permisos validados.
- [x] Aplica validaciones de reglas de negocio en la gestión de tiempo (sin duplicados).
