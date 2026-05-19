const express = require("express");
const db = require("../config/database");

const router = express.Router();

// Query base usata sia per la lista delle aule sia per il dettaglio 
// (calcola anche i posti totali e quelli liberi in questo momento)
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
          AND current_reservations.id IS NULL
          AND sr.status = 'open'
          AND b.status = 'open'
        THEN st.seats_count
        ELSE 0
      END
    ), 0) AS available_seats
  FROM study_rooms sr
  INNER JOIN buildings b ON b.id = sr.building_id
  LEFT JOIN study_tables st ON st.room_id = sr.id
  LEFT JOIN reservations current_reservations
    ON current_reservations.study_table_id = st.id
    AND current_reservations.status = 'active'
    AND current_reservations.start_time < NOW()
    AND current_reservations.end_time > NOW()
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

    // Controlliamo per ogni tavolo se ha una prenotazione attiva adesso
    const [tables] = await db.query(`
      SELECT
        st.id,
        st.table_code,
        st.seats_count,
        st.has_power_outlet,
        st.is_group_table,
        st.status,
        CASE
          WHEN active_reservations.id IS NULL THEN TRUE
          ELSE FALSE
        END AS is_available_now
      FROM study_tables st
      LEFT JOIN reservations active_reservations
        ON active_reservations.study_table_id = st.id
        AND active_reservations.status = 'active'
        AND active_reservations.start_time < NOW()
        AND active_reservations.end_time > NOW()
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

module.exports = router;
