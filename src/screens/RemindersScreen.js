// src/screens/RemindersScreen.js
// Pantalla principal: Crear, Listar, Modificar y Eliminar recordatorios,
// aplicando la regla de negocio obligatoria (sin duplicados de fecha+hora)
// y sincronizando cada operación con las notificaciones locales.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';

import {
  listarRecordatorios,
  crearRecordatorio,
  actualizarRecordatorio,
  eliminarRecordatorio,
  existeSolapamiento,
} from '../database/db';
import {
  programarNotificacion,
  cancelarNotificacion,
  reprogramarNotificacion,
} from '../notifications/notificationService';

export default function RemindersScreen({ config, theme }) {
  const [recordatorios, setRecordatorios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(''); // YYYY-MM-DD
  const [hora, setHora] = useState('');   // HH:mm

  const cargarRecordatorios = useCallback(async () => {
    const data = await listarRecordatorios();
    setRecordatorios(data);
  }, []);

  useEffect(() => {
    cargarRecordatorios();
  }, [cargarRecordatorios]);

  function limpiarFormulario() {
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setHora('');
    setEditandoId(null);
  }

  function abrirCrear() {
    limpiarFormulario();
    setModalVisible(true);
  }

  function abrirEditar(item) {
    setEditandoId(item.id);
    setTitulo(item.titulo);
    setDescripcion(item.descripcion);
    setFecha(item.fecha);
    setHora(item.hora);
    setModalVisible(true);
  }

  function validarFormato(fechaStr, horaStr) {
    const fechaOk = /^\d{4}-\d{2}-\d{2}$/.test(fechaStr);
    const horaOk = /^\d{2}:\d{2}$/.test(horaStr);
    return fechaOk && horaOk;
  }

  // Guarda (crea o actualiza) validando primero la solapación temporal,
  // tal como exige la REGLA DE NEGOCIO OBLIGATORIA de la guía.
  async function guardarRecordatorio() {
    if (!titulo.trim() || !fecha.trim() || !hora.trim()) {
      Alert.alert('Campos incompletos', 'Título, fecha y hora son obligatorios.');
      return;
    }

    if (!validarFormato(fecha, hora)) {
      Alert.alert(
        'Formato inválido',
        'Usa el formato de fecha AAAA-MM-DD y hora HH:mm (ej: 2026-09-15 y 10:00).'
      );
      return;
    }

    const conflicto = await existeSolapamiento(fecha, hora, editandoId);
    if (conflicto) {
      Alert.alert(
        'Conflicto de horario',
        'Ya existe un recordatorio programado exactamente en esa fecha y hora. ' +
          'Elige otro horario para continuar.'
      );
      return;
    }

    try {
      if (editandoId) {
        // Edición: reprogramar la notificación asociada.
        const anterior = recordatorios.find((r) => r.id === editandoId);
        const nuevoNotifId = await reprogramarNotificacion(anterior?.notificationId, {
          titulo,
          descripcion,
          fecha,
          hora,
          sonidoActivado: config.soundEnabled,
        });
        await actualizarRecordatorio(editandoId, {
          titulo,
          descripcion,
          fecha,
          hora,
          notificationId: nuevoNotifId,
        });
      } else {
        // Creación: programar notificación primero, luego persistir con su id.
        const notifId = await programarNotificacion({
          titulo,
          descripcion,
          fecha,
          hora,
          sonidoActivado: config.soundEnabled,
        });
        await crearRecordatorio({ titulo, descripcion, fecha, hora, notificationId: notifId });
      }

      setModalVisible(false);
      limpiarFormulario();
      cargarRecordatorios();
    } catch (e) {
      if (e.message === 'CONFLICTO_HORARIO') {
        Alert.alert('Conflicto de horario', 'Ese horario ya está ocupado por otro recordatorio.');
      } else {
        Alert.alert('Error', 'No se pudo guardar el recordatorio.');
        console.error(e);
      }
    }
  }

  async function confirmarEliminar(item) {
    Alert.alert(
      'Eliminar recordatorio',
      `¿Eliminar "${item.titulo}"? Esta acción también cancelará su notificación.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const notifId = await eliminarRecordatorio(item.id);
            await cancelarNotificacion(notifId);
            cargarRecordatorios();
          },
        },
      ]
    );
  }

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {config.username ? `Hola, ${config.username}` : 'Mis recordatorios'}
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={abrirCrear}>
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recordatorios}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No tienes recordatorios todavía. Toca "+ Nuevo" para crear el primero.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              {!!item.descripcion && <Text style={styles.cardDesc}>{item.descripcion}</Text>}
              <Text style={styles.cardDate}>
                {item.fecha} · {item.hora}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => abrirEditar(item)}>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmarEliminar(item)}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editandoId ? 'Editar recordatorio' : 'Nuevo recordatorio'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor="#888"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={styles.input}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#888"
              value={descripcion}
              onChangeText={setDescripcion}
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha (AAAA-MM-DD)"
              placeholderTextColor="#888"
              value={fecha}
              onChangeText={setFecha}
            />
            <TextInput
              style={styles.input}
              placeholder="Hora (HH:mm)"
              placeholderTextColor="#888"
              value={hora}
              onChangeText={setHora}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  limpiarFormulario();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={guardarRecordatorio}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme) {
  const dark = theme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? '#121212' : '#f5f5f7', padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: dark ? '#fff' : '#111' },
    addButton: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    addButtonText: { color: '#fff', fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 40, color: dark ? '#aaa' : '#666' },
    card: {
      backgroundColor: dark ? '#1e1e1e' : '#fff',
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    cardTitle: { fontSize: 16, fontWeight: '600', color: dark ? '#fff' : '#111' },
    cardDesc: { fontSize: 13, color: dark ? '#ccc' : '#555', marginTop: 2 },
    cardDate: { fontSize: 13, color: '#2563eb', marginTop: 6, fontWeight: '500' },
    cardActions: { alignItems: 'flex-end' },
    editText: { color: '#2563eb', marginBottom: 8, fontWeight: '600' },
    deleteText: { color: '#dc2626', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: dark ? '#1e1e1e' : '#fff',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: dark ? '#fff' : '#111' },
    input: {
      borderWidth: 1,
      borderColor: dark ? '#333' : '#ddd',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      color: dark ? '#fff' : '#111',
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginLeft: 10 },
    cancelButton: { backgroundColor: dark ? '#333' : '#eee' },
    cancelButtonText: { color: dark ? '#fff' : '#333', fontWeight: '600' },
    saveButton: { backgroundColor: '#2563eb' },
    saveButtonText: { color: '#fff', fontWeight: '600' },
  });
}
