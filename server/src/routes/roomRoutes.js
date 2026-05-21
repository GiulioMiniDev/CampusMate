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
    available_seats: Number(room.available_seats)
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

    const [availabilityRows] = await db.query(`
      SELECT
        COALESCE(SUM(st.seats_count), 0) AS available_seats,
        COUNT(st.id) AS available_tables
      FROM study_tables st
      WHERE st.room_id = :roomId
        AND st.status = 'available'
        AND st.seats_count >= :seatsRequested
        AND NOT EXISTS (
          SELECT 1
          FROM reservations r
          WHERE r.study_table_id = st.id
            AND r.status = 'active'
            AND r.start_time < :endTime
            AND r.end_time > :startTime
        )
    `, {
      roomId,
      startTime,
      endTime,
      seatsRequested
    });

    const availableSeats = Number(availabilityRows[0].available_seats);
    const availableTables = Number(availabilityRows[0].available_tables);
    const available = availableTables > 0;

    res.json({
      room_id: roomId,
      available,
      available_seats: availableSeats,
      available_tables: availableTables,
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
      tables: tables.map((table) => ({
        ...table,
        is_available_now: Boolean(table.is_available_now)
      }))
    });
  } catch (error) {
    next(error);
  }
});

function validateAvailabilityInput(roomId, query) {
  const seatsRequested = Number(query.seats_requested || 1);
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

  return null;
}

module.exports = router;
