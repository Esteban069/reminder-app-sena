// src/notifications/notificationService.js
// Encapsula todo lo relacionado con expo-notifications: permisos,
// comportamiento en primer/segundo plano, programación, cancelación
// y reprogramación de notificaciones locales.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Controla cómo se muestra una notificación cuando la app está en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Solicita permisos del sistema operativo. Debe llamarse al iniciar la app.
export async function solicitarPermisos() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return finalStatus === 'granted';
}

// Programa una notificación local para que se dispare exactamente en la
// fecha y hora del recordatorio. fecha: 'YYYY-MM-DD', hora: 'HH:mm'.
export async function programarNotificacion({ titulo, descripcion, fecha, hora, sonidoActivado }) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  const fechaDisparo = new Date(anio, mes - 1, dia, horas, minutos, 0);

  // Si la fecha ya pasó, no se programa (evita error de trigger inválido).
  if (fechaDisparo.getTime() <= Date.now()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: descripcion || 'Tienes un recordatorio programado.',
      sound: sonidoActivado ? 'default' : undefined,
    },
    trigger: fechaDisparo,
  });

  return notificationId;
}

// Cancela una notificación programada (usado al eliminar o antes de reprogramar).
export async function cancelarNotificacion(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    // Si ya no existe (por ejemplo ya se disparó), no es un error crítico.
    console.warn('No se pudo cancelar la notificación', e);
  }
}

// Reprograma: cancela la anterior (si existe) y crea una nueva.
export async function reprogramarNotificacion(notificationIdAnterior, datosNuevos) {
  await cancelarNotificacion(notificationIdAnterior);
  return await programarNotificacion(datosNuevos);
}
