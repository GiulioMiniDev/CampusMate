const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

function createReceptionRoutes(websocketHub) {
  const router = express.Router();

  router.use(requireAuth);
  router.use(requireReceptionAccess);

  router.get("/overview", async (req, res, next) => {
    try {
      const scope = await getReceptionScope(req);

      if (!scope.canAccess) {
        res.status(403).json({ error: { message: "Reception non assegnata ad alcun edificio." } });
        return;
      }

      const [buildings] = await db.query(`
        SELECT id, name, code, address, campus_area
        FROM buildings
        WHERE ${scope.whereClause("id")}
        ORDER BY name
      `, scope.params);

      const [present] = await db.query(`
        ${getReceptionReservationSelect()}
        WHERE r.status = 'active'
          AND r.checked_in_at IS NOT NULL
          AND r.checked_out_at IS NULL
          AND r.end_time > UTC_TIMESTAMP()
          AND ${scope.whereClause("b.id")}
        ORDER BY b.name, sr.name, st.table_code, r.checked_in_at
      `, scope.params);

      const [expected] = await db.query(`
        ${getReceptionReservationSelect()}
        WHERE r.status = 'active'
          AND r.checked_in_at IS NULL
          AND r.start_time <= UTC_TIMESTAMP()
          AND r.end_time > UTC_TIMESTAMP()
          AND ${scope.whereClause("b.id")}
        ORDER BY r.start_time, b.name, sr.name, st.table_code
      `, scope.params);

      res.json({
        buildings,
        present: present.map(normalizeReceptionReservation),
        expected: expected.map(normalizeReceptionReservation)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/check-in", async (req, res, next) => {
    const reservationId = getReservationIdFromBody(req.body);

    if (!reservationId) {
      res.status(400).json({ error: { message: "QR non valido o ID prenotazione mancante." } });
      return;
    }

    const connection = await db.getConnection();

    try {
      const scope = await getReceptionScope(req, connection);

      if (!scope.canAccess) {
        res.status(403).json({ error: { message: "Reception non assegnata ad alcun edificio." } });
        return;
      }

      await connection.beginTransaction();

      const [reservations] = await connection.query(`
        ${getReceptionReservationSelect()}
        WHERE r.id = :reservationId
          AND ${scope.whereClause("b.id")}
        FOR UPDATE
      `, {
        ...scope.params,
        reservationId
      });

      if (reservations.length === 0) {
        await connection.rollback();
        res.status(404).json({ error: { message: "Prenotazione non trovata per questa reception." } });
        return;
      }

      const reservation = reservations[0];
      const validationError = validateCheckIn(reservation);

      if (validationError) {
        await connection.rollback();
        res.status(409).json({ error: { message: validationError } });
        return;
      }

      await connection.query(`
        UPDATE reservations
        SET checked_in_at = UTC_TIMESTAMP(),
            checked_in_by = :userId,
            checked_out_at = NULL,
            checked_out_by = NULL
        WHERE id = :reservationId
      `, {
        reservationId,
        userId: req.auth.userId
      });

      await connection.commit();

      const checkedInReservation = await getReceptionReservationById(reservationId);
      broadcastReceptionUpdate(websocketHub, "reception.checkin", checkedInReservation);

      res.json({
        message: "Check-in registrato.",
        reservation: normalizeReceptionReservation(checkedInReservation)
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  });

  router.post("/check-out/:id", async (req, res, next) => {
    const reservationId = Number(req.params.id);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      res.status(400).json({ error: { message: "ID prenotazione non valido." } });
      return;
    }

    const connection = await db.getConnection();

    try {
      const scope = await getReceptionScope(req, connection);

      if (!scope.canAccess) {
        res.status(403).json({ error: { message: "Reception non assegnata ad alcun edificio." } });
        return;
      }

      await connection.beginTransaction();

      const [reservations] = await connection.query(`
        ${getReceptionReservationSelect()}
        WHERE r.id = :reservationId
          AND ${scope.whereClause("b.id")}
        FOR UPDATE
      `, {
        ...scope.params,
        reservationId
      });

      if (reservations.length === 0) {
        await connection.rollback();
        res.status(404).json({ error: { message: "Prenotazione non trovata per questa reception." } });
        return;
      }

      if (!reservations[0].checked_in_at || reservations[0].checked_out_at) {
        await connection.rollback();
        res.status(409).json({ error: { message: "La prenotazione non risulta attualmente presente." } });
        return;
      }

      await connection.query(`
        UPDATE reservations
        SET checked_out_at = UTC_TIMESTAMP(),
            checked_out_by = :userId
        WHERE id = :reservationId
      `, {
        reservationId,
        userId: req.auth.userId
      });

      await connection.commit();

      const checkedOutReservation = await getReceptionReservationById(reservationId);
      broadcastReceptionUpdate(websocketHub, "reception.checkout", checkedOutReservation);

      res.json({
        message: "Check-out registrato.",
        reservation: normalizeReceptionReservation(checkedOutReservation)
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  });

  return router;
}

function requireReceptionAccess(req, res, next) {
  if (req.auth.role !== "receptionist") {
    res.status(403).json({ error: { message: "Accesso riservato alla reception." } });
    return;
  }

  next();
}

async function getReceptionScope(req, connection = db) {
  const [assignments] = await connection.query(`
    SELECT building_id
    FROM receptionist_assignments
    WHERE user_id = :userId
  `, { userId: req.auth.userId });

  const buildingIds = assignments.map((assignment) => Number(assignment.building_id));

  return {
    canAccess: buildingIds.length > 0,
    params: { buildingIds },
    whereClause(columnName) {
      return `${columnName} IN (:buildingIds)`;
    }
  };
}

function getReceptionReservationSelect() {
  return `
    SELECT
      r.id,
      r.user_id,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name,
      u.email AS user_email,
      u.student_number,
      r.study_table_id,
      st.table_code,
      st.seats_count,
      sr.id AS room_id,
      sr.name AS room_name,
      sr.room_code,
      b.id AS building_id,
      b.name AS building_name,
      b.code AS building_code,
      r.start_time,
      r.end_time,
      r.reservation_type,
      r.seats_requested,
      r.status,
      r.checked_in_at,
      r.checked_out_at,
      r.checked_in_by,
      r.checked_out_by,
      r.notes
    FROM reservations r
    INNER JOIN users u ON u.id = r.user_id
    INNER JOIN study_tables st ON st.id = r.study_table_id
    INNER JOIN study_rooms sr ON sr.id = st.room_id
    INNER JOIN buildings b ON b.id = sr.building_id
  `;
}

function getReservationIdFromBody(body) {
  if (body?.reservation_id) {
    const reservationId = Number(body.reservation_id);
    return Number.isInteger(reservationId) && reservationId > 0 ? reservationId : null;
  }

  const rawPayload = body?.qr_payload || body?.payload || body?.code;

  if (!rawPayload) {
    return null;
  }

  try {
    const payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
    const reservationId = Number(payload.reservation_id || payload.id);

    if (payload.type && payload.type !== "campusmate.reservation") {
      return null;
    }

    return Number.isInteger(reservationId) && reservationId > 0 ? reservationId : null;
  } catch {
    const reservationId = Number(rawPayload);
    return Number.isInteger(reservationId) && reservationId > 0 ? reservationId : null;
  }
}

function validateCheckIn(reservation) {
  if (reservation.status !== "active") {
    return "La prenotazione non e attiva.";
  }

  if (reservation.checked_in_at && !reservation.checked_out_at) {
    return "Check-in gia registrato.";
  }

  const now = Date.now();
  const start = parseUtcDateTime(reservation.start_time);
  const end = parseUtcDateTime(reservation.end_time);
  const earlyToleranceMs = 15 * 60 * 1000;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "Orari della prenotazione non validi.";
  }

  if (now < start - earlyToleranceMs) {
    return "La prenotazione non e ancora nella finestra di check-in.";
  }

  if (now > end) {
    return "La prenotazione e gia terminata.";
  }

  return null;
}

function parseUtcDateTime(value) {
  if (!value) {
    return Number.NaN;
  }

  const normalized = String(value).replace(" ", "T");
  const withTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;

  return new Date(withTimezone).getTime();
}

async function getReceptionReservationById(reservationId) {
  const [reservations] = await db.query(`
    ${getReceptionReservationSelect()}
    WHERE r.id = :reservationId
    LIMIT 1
  `, { reservationId });

  return reservations[0] || null;
}

function normalizeReceptionReservation(reservation) {
  if (!reservation) {
    return null;
  }

  return {
    ...reservation,
    id: Number(reservation.id),
    user_id: Number(reservation.user_id),
    study_table_id: Number(reservation.study_table_id),
    room_id: Number(reservation.room_id),
    building_id: Number(reservation.building_id),
    seats_count: Number(reservation.seats_count),
    seats_requested: Number(reservation.seats_requested)
  };
}

function broadcastReceptionUpdate(websocketHub, type, reservation) {
  websocketHub.broadcast({
    type,
    payload: normalizeReceptionReservation(reservation),
    timestamp: new Date().toISOString()
  });
}

module.exports = createReceptionRoutes;
