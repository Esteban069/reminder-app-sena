// src/screens/ConfigScreen.js
// Pantalla de configuración: Modo de Alerta (sonido), Tema de interfaz y
// Nombre del Usuario, persistidos con AsyncStorage. Se carga automáticamente
// al iniciar la app (ver App.js) y se guarda cada vez que el usuario confirma.

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { saveConfig } from '../storage/configStorage';

export default function ConfigScreen({ config, setConfig, theme }) {
  const [username, setUsername] = useState(config.username);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const [isDark, setIsDark] = useState(theme === 'dark');

  useEffect(() => {
    setUsername(config.username);
    setSoundEnabled(config.soundEnabled);
    setIsDark(config.theme === 'dark');
  }, [config]);

  async function handleGuardar() {
    const nuevaConfig = {
      username: username.trim(),
      soundEnabled,
      theme: isDark ? 'dark' : 'light',
    };
    const ok = await saveConfig(nuevaConfig);
    if (ok) {
      setConfig(nuevaConfig);
      Alert.alert('Configuración guardada', 'Tus preferencias se aplicaron correctamente.');
    } else {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
  }

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe tu nombre"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Sonido de alertas</Text>
        <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Modo oscuro</Text>
        <Switch value={isDark} onValueChange={setIsDark} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
        <Text style={styles.saveButtonText}>Guardar configuración</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(theme) {
  const dark = theme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? '#121212' : '#f5f5f7', padding: 20 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: dark ? '#fff' : '#111' },
    label: { fontSize: 15, color: dark ? '#ddd' : '#333', marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: dark ? '#333' : '#ddd',
      borderRadius: 8,
      padding: 10,
      marginBottom: 20,
      color: dark ? '#fff' : '#111',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: '#2563eb',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
