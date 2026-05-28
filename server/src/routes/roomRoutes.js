const express = require("express");
const db = require("../config/database");
const { validateOpeningHours } = require("../utils/openingHours");
const { validateBookingParameters } = require("../utils/validation");
const { optionalAuth, requireAuth } = require("../middleware/auth"); // Assuming this exists

const router = express.Router();

// Query base usata sia per la lista delle aule sia per il dettaglio.
// La dashboard scala i posti prenotati, non l'intera capienza del tavolo.
function getReservationOverlapClause(hasSlot) {
  if (hasSlot) {
    return `
      AND start_time < :endTime
      AND end_time > :startTime
    `;
  }

  return `
      AND start_time <= NOW()
      AND end_time > NOW()
    `;
}

function getRoomSelect(hasSlot = false) {
  return `
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
    b.opening_time,
    b.closing_time,
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
          AND sr.status = 'open'
          AND b.status = 'open'
        THEN GREATEST(st.seats_count - COALESCE(active_reservations.seats_reserved, 0), 0)
        ELSE 0
      END
    ), 0) AS available_seats
  FROM study_rooms sr
  INNER JOIN buildings b ON b.id = sr.building_id
  LEFT JOIN study_tables st ON st.room_id = sr.id
  LEFT JOIN (
    SELECT study_table_id, SUM(seats_requested) AS seats_reserved
    FROM reservations
    WHERE status = 'active'
      ${getReservationOverlapClause(hasSlot)}
    GROUP BY study_table_id
  ) active_reservations ON active_reservations.study_table_id = st.id
`;
}

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

// Restituisce tutte le aule studio con edificio, stato e disponibilità
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const slot = getAvailabilitySlot(req.query);
    const scope = getReceptionRoomScope(req);
    const [rooms] = await db.query(`
      ${getRoomSelect(Boolean(slot))}
      ${scope.where}
      GROUP BY sr.id, b.id
      ORDER BY b.name, sr.floor_label, sr.name
    `, { ...(slot || {}), ...scope.params });

    res.json(rooms.map((room) => normalizeRoomForSlot(room, slot)));
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({
        error: {
          message: error.message
        }
      });
      return;
    }

    next(error);
  }
});

// Controlla la disponibilita di un'aula per uno slot orario specifico.
router.get("/:id/availability", optionalAuth, async (req, res, next) => {
  try {
    const roomId = Number(req.params.id);
    const validationError = validateBookingParameters({ room_id: roomId, ...req.query });

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
    const scope = getReceptionRoomScope(req);

    const [rooms] = await db.query(`
      SELECT
        sr.id,
        b.weekday_hours,
        b.weekend_hours,
        b.opening_time,
        b.closing_time
      FROM study_rooms sr
      INNER JOIN buildings b ON b.id = sr.building_id
      WHERE sr.id = :roomId
        AND sr.status = 'open'
        AND b.status = 'open'
        ${scope.and}
      LIMIT 1
    `, { roomId, ...scope.params });

    if (rooms.length === 0) {
      res.status(404).json({
        error: {
          message: "Aula non trovata o non disponibile."
        }
      });
      return;
    }

    const openingError = validateOpeningHours(rooms[0], startTime, endTime);

    if (openingError) {
      res.status(400).json({
        error: {
          message: openingError
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
        GREATEST(st.seats_count - COALESCE(conflicting_reservations.seats_reserved, 0), 0) AS available_seats_for_slot,
        CASE
          WHEN st.status = 'available'
            AND GREATEST(st.seats_count - COALESCE(conflicting_reservations.seats_reserved, 0), 0) >= :seatsRequested
          THEN TRUE
          ELSE FALSE
        END AS is_available_for_slot
      FROM study_tables st
      LEFT JOIN (
        SELECT study_table_id, SUM(seats_requested) AS seats_reserved
        FROM reservations
        WHERE status = 'active'
          AND start_time < :endTime
          AND end_time > :startTime
        GROUP BY study_table_id
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
    const availableSeats = availableTables.reduce((sum, table) => sum + table.available_seats_for_slot, 0);
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
router.get("/:id", optionalAuth, async (req, res, next) => {
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

    const scope = getReceptionRoomScope(req);
    const [rooms] = await db.query(`
      ${getRoomSelect()}
      WHERE sr.id = :roomId
        ${scope.and}
      GROUP BY sr.id, b.id
    `, { roomId, ...scope.params });

    if (rooms.length === 0) {
      res.status(404).json({
        error: {
          message: "Aula non trovata."
        }
      });
      return;
    }

    // Controlliamo per ogni tavolo quanti posti sono ancora liberi.
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
        GREATEST(st.seats_count - COALESCE(active_reservations.seats_reserved, 0), 0) AS available_seats_now,
        CASE
          WHEN st.status = 'available'
            AND GREATEST(st.seats_count - COALESCE(active_reservations.seats_reserved, 0), 0) > 0
          THEN TRUE
          ELSE FALSE
        END AS is_available_now
      FROM study_tables st
      LEFT JOIN (
        SELECT study_table_id, SUM(seats_requested) AS seats_reserved
        FROM reservations
        WHERE status = 'active'
          AND start_time <= NOW()
          AND end_time > NOW()
        GROUP BY study_table_id
      ) active_reservations ON active_reservations.study_table_id = st.id
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

router.post("/", requireAuth, async (req, res, next) => {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: { message: "Non autorizzato" } });
  }

  const { building_id, name, floor_label, room_code, description } = req.body;
  
  try {
    const [result] = await db.query(`
      INSERT INTO study_rooms (building_id, name, floor_label, room_code, description)
      VALUES (:building_id, :name, :floor_label, :room_code, :description)
    `, { building_id, name, floor_label, room_code, description });

    res.status(201).json({ id: result.insertId, message: "Aula creata con successo." });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/tables", requireAuth, async (req, res, next) => {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: { message: "Non autorizzato" } });
  }

  const roomId = Number(req.params.id);
  const { table_code, seats_count, has_power_outlet, is_group_table, layout_x, layout_y, layout_width, layout_height, layout_rotation } = req.body;
  
  try {
    const [result] = await db.query(`
      INSERT INTO study_tables (room_id, table_code, seats_count, has_power_outlet, is_group_table, layout_x, layout_y, layout_width, layout_height, layout_rotation)
      VALUES (:roomId, :table_code, :seats_count, :has_power_outlet, :is_group_table, :layout_x, :layout_y, :layout_width, :layout_height, :layout_rotation)
    `, { roomId, table_code, seats_count, has_power_outlet, is_group_table, layout_x, layout_y, layout_width, layout_height, layout_rotation });

    res.status(201).json({ id: result.insertId, message: "Tavolo creato con successo." });
  } catch (error) {
    next(error);
  }
});

async function updateTable(req, res, next) {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: { message: "Non autorizzato" } });
  }

  const tableId = req.params.tableId;
  const { table_code, seats_count, has_power_outlet, is_group_table, layout_x, layout_y, layout_width, layout_height, layout_rotation, status } = req.body;

  try {
    await db.query(`
      UPDATE study_tables 
      SET table_code = :table_code, seats_count = :seats_count, has_power_outlet = :has_power_outlet, 
          is_group_table = :is_group_table, layout_x = :layout_x, layout_y = :layout_y, 
          layout_width = :layout_width, layout_height = :layout_height, layout_rotation = :layout_rotation,
          status = :status
      WHERE id = :id
    `, {
      id: tableId,
      table_code,
      seats_count: Number(seats_count),
      has_power_outlet: Boolean(has_power_outlet) ? 1 : 0,
      is_group_table: Boolean(is_group_table) ? 1 : 0,
      layout_x: Number(layout_x),
      layout_y: Number(layout_y),
      layout_width: Number(layout_width),
      layout_height: Number(layout_height),
      layout_rotation: Number(layout_rotation),
      status: status || "available"
    });

    res.json({ message: "Tavolo aggiornato con successo." });
  } catch (error) {
    next(error);
  }
}

router.put("/tables/:tableId", requireAuth, updateTable);
router.put("/:id/tables/:tableId", requireAuth, updateTable);
router.post("/tables/:tableId", requireAuth, updateTable);
router.post("/:id/tables/:tableId", requireAuth, updateTable);

async function updateRoom(req, res, next) {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: { message: "Non autorizzato" } });
  }

  const roomId = req.params.id;
  const { name, room_code, floor_label, description, status } = req.body;

  try {
    await db.query(`
      UPDATE study_rooms 
      SET name = :name, room_code = :room_code, floor_label = :floor_label, description = :description,
          status = :status
      WHERE id = :id
    `, {
      id: roomId,
      name,
      room_code,
      floor_label,
      description: description || null,
      status: status || "open"
    });

    res.json({ message: "Aula aggiornata con successo." });
  } catch (error) {
    next(error);
  }
}

router.put("/:id", requireAuth, updateRoom);
router.post("/:id", requireAuth, updateRoom);

module.exports = router;

function getAvailabilitySlot(query) {
  const startTime = query.start_time;
  const endTime = query.end_time;

  if (!startTime && !endTime) {
    return null;
  }

  const validationError = validateBookingParameters({
    room_id: 1,
    start_time: startTime,
    end_time: endTime,
    seats_requested: 1
  });

  if (validationError) {
    const error = new Error(validationError);
    error.status = 400;
    throw error;
  }

  return {
    startTime,
    endTime
  };
}

function normalizeRoomForSlot(room, slot) {
  const normalizedRoom = normalizeRoom(room);

  if (slot && validateOpeningHours(normalizedRoom, slot.startTime, slot.endTime)) {
    return {
      ...normalizedRoom,
      available_seats: 0
    };
  }

  return normalizedRoom;
}

function normalizeTable(table) {
  return {
    ...table,
    id: Number(table.id),
    seats_count: Number(table.seats_count),
    available_seats_now: table.available_seats_now === undefined ? undefined : Number(table.available_seats_now),
    available_seats_for_slot: table.available_seats_for_slot === undefined ? undefined : Number(table.available_seats_for_slot),
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

function getReceptionRoomScope(req) {
  if (req.auth?.role !== "receptionist") {
    return {
      where: "",
      and: "",
      params: {}
    };
  }

  const subquery = `
    b.id IN (
      SELECT building_id
      FROM receptionist_assignments
      WHERE user_id = :receptionUserId
    )
  `;

  return {
    where: `WHERE ${subquery}`,
    and: `AND ${subquery}`,
    params: {
      receptionUserId: req.auth.userId
    }
  };
}
