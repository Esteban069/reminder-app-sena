// src/storage/configStorage.js
// Persistencia clave-valor con AsyncStorage para la configuración global:
// tema de interfaz, sonido de alertas y nombre del usuario.
// Se usa AsyncStorage (y no SQLite) porque es un único objeto plano,
// de bajo volumen, que se lee completo al iniciar la app.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_KEY = '@user_config';

export const DEFAULT_CONFIG = {
  theme: 'light',            // 'light' | 'dark'
  soundEnabled: true,        // Modo de alerta: sonido activado/desactivado
  username: '',              // Nombre del usuario
};

// Guarda la configuración completa del usuario.
export async function saveConfig(config) {
  try {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Error al guardar configuración', e);
    return false;
  }
}

// Carga la configuración guardada. Si no existe (primer uso de la app),
// devuelve los valores por defecto.
export async function loadConfig() {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error al leer configuración', e);
    return DEFAULT_CONFIG;
  }
}
