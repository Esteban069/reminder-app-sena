// src/database/db.js
// Capa de persistencia con expo-sqlite.
// Se elige SQLite (y no AsyncStorage) porque los recordatorios son datos
// estructurados que deben consultarse por fecha/hora exacta para poder
// detectar solapamientos, tal como lo exige la regla de negocio de la guía.

import * as SQLite from 'expo-sqlite';

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('recordatorios.db');
  }
  return dbInstance;
}

// Crea la tabla si no existe. La restricción UNIQUE sobre (fecha, hora)
// refuerza a nivel de motor la regla "no se puede crear ni actualizar un
// recordatorio si ya existe otro en la misma fecha y hora exacta".
export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS recordatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT NOT NULL,        -- formato YYYY-MM-DD
      hora TEXT NOT NULL,         -- formato HH:mm
      notificationId TEXT,        -- id devuelto por expo-notifications
      creadoEn TEXT NOT NULL,
      UNIQUE(fecha, hora)
    );
  `);
}

// Devuelve todos los recordatorios ordenados por fecha/hora ascendente.
export async function listarRecordatorios() {
  const db = await getDb();
  return await db.getAllAsync(
    'SELECT * FROM recordatorios ORDER BY fecha ASC, hora ASC;'
  );
}

// Verifica si ya existe un recordatorio en la misma fecha y hora.
// excludeId se usa al editar, para no comparar el registro contra sí mismo.
export async function existeSolapamiento(fecha, hora, excludeId = null) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    excludeId
      ? 'SELECT id FROM recordatorios WHERE fecha = ? AND hora = ? AND id != ?;'
      : 'SELECT id FROM recordatorios WHERE fecha = ? AND hora = ?;',
    excludeId ? [fecha, hora, excludeId] : [fecha, hora]
  );
  return !!row;
}

// Inserta un recordatorio nuevo. Lanza un error controlado si hay conflicto
// de horario (doble seguridad: se valida antes en la UI y aquí por el UNIQUE).
export async function crearRecordatorio({ titulo, descripcion, fecha, hora, notificationId }) {
  const db = await getDb();
  try {
    const result = await db.runAsync(
      `INSERT INTO recordatorios (titulo, descripcion, fecha, hora, notificationId, creadoEn)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [titulo, descripcion || '', fecha, hora, notificationId || null, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (e) {
    if (String(e).includes('UNIQUE')) {
      throw new Error('CONFLICTO_HORARIO');
    }
    throw e;
  }
}

// Actualiza un recordatorio existente.
export async function actualizarRecordatorio(id, { titulo, descripcion, fecha, hora, notificationId }) {
  const db = await getDb();
  try {
    await db.runAsync(
      `UPDATE recordatorios
       SET titulo = ?, descripcion = ?, fecha = ?, hora = ?, notificationId = ?
       WHERE id = ?;`,
      [titulo, descripcion || '', fecha, hora, notificationId || null, id]
    );
  } catch (e) {
    if (String(e).includes('UNIQUE')) {
      throw new Error('CONFLICTO_HORARIO');
    }
    throw e;
  }
}

// Elimina un recordatorio y devuelve su notificationId para poder
// cancelar la notificación programada asociada.
export async function eliminarRecordatorio(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT notificationId FROM recordatorios WHERE id = ?;', [id]);
  await db.runAsync('DELETE FROM recordatorios WHERE id = ?;', [id]);
  return row ? row.notificationId : null;
}
