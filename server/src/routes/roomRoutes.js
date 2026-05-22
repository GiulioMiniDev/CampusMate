const express = require("express");
const db = require("../config/database");

const router = express.Router();

// Query base usata sia per la lista delle aule sia per il dettaglio.
// La dashboard considera occupati i tavoli con prenotazioni attive non ancora terminate,
// cosi una prenotazione futura appena creata produce subito un cambiamento visibile.
const roomSelect = `
  SELECT
    sr.id,
    sr.name,
    b.name AS building,
    b.id AS building_id,
    b.code AS building_code,
    b.address,
    b.campus_area,
    b.image_url,
    b.latitude,
    b.longitude,
    b.weekday_hours,
    b.weekend_hours,
    b.services,
    sr.floor_label AS floor,
    sr.room_code,
    sr.description,
    sr.status,
    b.status AS building_status,
    COALESCE(SUM(CASE WHEN st.status = 'available' THEN st.seats_count ELSE 0 END), 0) AS total_seats,
    COALESCE(SUM(
      CASE
        WHEN st.status = 'available'
          AND blocking_reservations.study_table_id IS NULL
          AND sr.status = 'open'
          AND b.status = 'open'
        THEN st.seats_count
        ELSE 0
      END
    ), 0) AS available_seats
  FROM study_rooms sr
  INNER JOIN buildings b ON b.id = sr.building_id
  LEFT JOIN study_tables st ON st.room_id = sr.id
  LEFT JOIN (
    SELECT DISTINCT study_table_id
    FROM reservations
    WHERE status = 'active'
      AND end_time > NOW()
  ) blocking_reservations ON blocking_reservations.study_table_id = st.id
`;

function normalizeRoom(room) {
  return {
    ...room,
    total_seats: Number(room.total_seats),
    available_seats: Number(room.available_seats),
    latitude: room.latitude === null || room.latitude === undefined ? null : Number(room.latitude),
    longitude: room.longitude === null || room.longitude === undefined ? null : Number(room.longitude),
    services: normalizeServices(room.services)
  };
}

// Restituisce tutte le aule studio con edificio, stato e disponibilita
router.get("/", async (req, res, next) => {
  try {
    const [rooms] = await db.query(`
      ${roomSelect}
      GROUP BY sr.id, b.id
      ORDER BY b.name, sr.floor_label, sr.name
    `);

    res.json(rooms.map(normalizeRoom));
  } catch (error) {
    next(error);
  }
});

// Controlla la disponibilita di un'aula per uno slot orario specifico.
router.get("/:id/availability", async (req, res, next) => {
  try {
    const roomId = Number(req.params.id);
    const validationError = validateAvailabilityInput(roomId, req.query);

    if (validationError) {
      res.status(400).json({
        error: {
          message: validationError
        }
      });
      return;
    }

    const startTime = req.query.start_time;
    const endTime = req.query.end_time;
    const seatsRequested = Number(req.query.seats_requested || 1);
    const requestedTableId = req.query.study_table_id ? Number(req.query.study_table_id) : null;

    const [rooms] = await db.query(`
      SELECT sr.id
      FROM study_rooms sr
      INNER JOIN buildings b ON b.id = sr.building_id
      WHERE sr.id = :roomId
        AND sr.status = 'open'
        AND b.status = 'open'
      LIMIT 1
    `, { roomId });

    if (rooms.length === 0) {
      res.status(404).json({
        error: {
          message: "Aula non trovata o non disponibile."
        }
      });
      return;
    }

    const [tables] = await db.query(`
      SELECT
        st.id,
        st.table_code,
        st.seats_count,
        st.has_power_outlet,
        st.is_group_table,
        st.status,
        st.layout_x,
        st.layout_y,
        st.layout_width,
        st.layout_height,
        st.layout_rotation,
        CASE
          WHEN st.status = 'available'
            AND st.seats_count >= :seatsRequested
            AND conflicting_reservations.study_table_id IS NULL
          THEN TRUE
          ELSE FALSE
        END AS is_available_for_slot
      FROM study_tables st
      LEFT JOIN (
        SELECT DISTINCT study_table_id
        FROM reservations
        WHERE status = 'active'
          AND start_time < :endTime
          AND end_time > :startTime
      ) conflicting_reservations ON conflicting_reservations.study_table_id = st.id
      WHERE st.room_id = :roomId
      ORDER BY st.table_code
    `, {
      roomId,
      startTime,
      endTime,
      seatsRequested
    });

    const normalizedTables = tables.map(normalizeTable);
    const matchingTables = requestedTableId
      ? normalizedTables.filter((table) => table.id === requestedTableId)
      : normalizedTables;
    const availableTables = matchingTables.filter((table) => table.is_available_for_slot);
    const availableSeats = availableTables.reduce((sum, table) => sum + table.seats_count, 0);
    const available = availableTables.length > 0;

    res.json({
      room_id: roomId,
      available,
      available_seats: availableSeats,
      available_tables: availableTables.length,
      selected_table_id: requestedTableId,
      tables: normalizedTables,
      message: available
        ? "Disponibilita confermata per l'orario scelto."
        : "Non ci sono posti disponibili per l'aula e l'orario richiesti."
    });
  } catch (error) {
    next(error);
  }
});

// Restituisce una singola aula e, in piu, l'elenco dei tavoli al suo interno
router.get("/:id", async (req, res, next) => {
  try {
    const roomId = Number(req.params.id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      res.status(400).json({
        error: {
          message: "ID aula non valido."
        }
      });
      return;
    }

    const [rooms] = await db.query(`
      ${roomSelect}
      WHERE sr.id = :roomId
      GROUP BY sr.id, b.id
    `, { roomId });

    if (rooms.length === 0) {
      res.status(404).json({
        error: {
          message: "Aula non trovata."
        }
      });
      return;
    }

    // Controlliamo per ogni tavolo se ha una prenotazione attiva non ancora terminata.
    const [tables] = await db.query(`
      SELECT
        st.id,
        st.table_code,
        st.seats_count,
        st.has_power_outlet,
        st.is_group_table,
        st.status,
        st.layout_x,
        st.layout_y,
        st.layout_width,
        st.layout_height,
        st.layout_rotation,
        CASE
          WHEN blocking_reservations.study_table_id IS NULL THEN TRUE
          ELSE FALSE
        END AS is_available_now
      FROM study_tables st
      LEFT JOIN (
        SELECT DISTINCT study_table_id
        FROM reservations
        WHERE status = 'active'
          AND end_time > NOW()
      ) blocking_reservations ON blocking_reservations.study_table_id = st.id
      WHERE st.room_id = :roomId
      ORDER BY st.table_code
    `, { roomId });

    res.json({
      ...normalizeRoom(rooms[0]),
      tables: tables.map(normalizeTable)
    });
  } catch (error) {
    next(error);
  }
});

function validateAvailabilityInput(roomId, query) {
  const seatsRequested = Number(query.seats_requested || 1);
  const requestedTableId = query.study_table_id ? Number(query.study_table_id) : null;
  const startTime = new Date(query.start_time);
  const endTime = new Date(query.end_time);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return "ID aula non valido.";
  }

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return "start_time ed end_time sono obbligatori e devono essere date valide.";
  }

  if (endTime <= startTime) {
    return "end_time deve essere successivo a start_time.";
  }

  if (!Number.isInteger(seatsRequested) || seatsRequested <= 0) {
    return "seats_requested deve essere un numero positivo.";
  }

  if (query.study_table_id && (!Number.isInteger(requestedTableId) || requestedTableId <= 0)) {
    return "study_table_id deve essere un numero positivo.";
  }

  return null;
}

function normalizeTable(table) {
  return {
    ...table,
    id: Number(table.id),
    seats_count: Number(table.seats_count),
    has_power_outlet: Boolean(table.has_power_outlet),
    is_group_table: Boolean(table.is_group_table),
    layout_x: Number(table.layout_x),
    layout_y: Number(table.layout_y),
    layout_width: Number(table.layout_width),
    layout_height: Number(table.layout_height),
    layout_rotation: Number(table.layout_rotation),
    is_available_now: table.is_available_now === undefined ? undefined : Boolean(table.is_available_now),
    is_available_for_slot: table.is_available_for_slot === undefined ? undefined : Boolean(table.is_available_for_slot)
  };
}

function normalizeServices(services) {
  if (!services) {
    return [];
  }

  if (Array.isArray(services)) {
    return services;
  }

  try {
    return JSON.parse(services);
  } catch {
    return [];
  }
}

module.exports = router;
