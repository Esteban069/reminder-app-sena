// App.js
// Punto de entrada de la aplicación.
// 1. Inicializa la base de datos SQLite.
// 2. Solicita permisos de notificaciones.
// 3. Carga automáticamente la configuración guardada en AsyncStorage.
// 4. Controla una navegación simple por pestañas entre Recordatorios y Configuración.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from './src/database/db';
import { solicitarPermisos } from './src/notifications/notificationService';
import { loadConfig, DEFAULT_CONFIG } from './src/storage/configStorage';

import RemindersScreen from './src/screens/RemindersScreen';
import ConfigScreen from './src/screens/ConfigScreen';

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [tab, setTab] = useState('recordatorios'); // 'recordatorios' | 'config'

  useEffect(() => {
    async function bootstrap() {
      await initDatabase();
      await solicitarPermisos();
      const configGuardada = await loadConfig(); // Se carga automáticamente al iniciar
      setConfig(configGuardada);
      setCargando(false);
    }
    bootstrap();
  }, []);

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  const dark = config.theme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#121212' : '#f5f5f7' }}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      <View style={{ flex: 1 }}>
        {tab === 'recordatorios' ? (
          <RemindersScreen config={config} theme={config.theme} />
        ) : (
          <ConfigScreen config={config} setConfig={setConfig} theme={config.theme} />
        )}
      </View>

      <View style={[styles.tabBar, { backgroundColor: dark ? '#1e1e1e' : '#fff' }]}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setTab('recordatorios')}>
          <Text style={[styles.tabText, tab === 'recordatorios' && styles.tabTextActive]}>
            Recordatorios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setTab('config')}>
          <Text style={[styles.tabText, tab === 'config' && styles.tabTextActive]}>
            Configuración
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabButton: { flex: 1, alignItems: 'center' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#2563eb' },
});
