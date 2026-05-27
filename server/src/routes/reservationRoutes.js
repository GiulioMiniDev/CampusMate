const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

function createReservationRoutes(websocketHub) {
  const router = express.Router();

  // Lista delle prenotazioni con qualche dato leggibile in più su utente, aula, edificio e tavolo
  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const visibilityFilter = req.auth.role === "admin" ? "" : "WHERE r.user_id = :userId";
      const [reservations] = await db.query(`
        SELECT
          r.id,
          r.user_id,
          CONCAT(u.first_name, ' ', u.last_name) AS user_name,
          u.email AS user_email,
          st.id AS study_table_id,
          st.table_code,
          sr.id AS room_id,
          sr.name AS room_name,
          b.name AS building_name,
          r.start_time,
          r.end_time,
          r.reservation_type,
          r.seats_requested,
          r.status,
          r.notes,
          r.created_at,
          r.updated_at
        FROM reservations r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN study_tables st ON st.id = r.study_table_id
        INNER JOIN study_rooms sr ON sr.id = st.room_id
        INNER JOIN buildings b ON b.id = sr.building_id
        ${visibilityFilter}
        ORDER BY r.start_time DESC, r.id DESC
      `, { userId: req.auth.userId });

      res.json(reservations);
    } catch (error) {
      next(error);
    }
  });

  // Crea una prenotazione scegliendo un tavolo libero nell'aula richiesta
  router.post("/", requireAuth, async (req, res, next) => {
    const validationError = validateBookingParameters(req.body);

    if (validationError) {
      res.status(400).json({
        error: {
          message: validationError
        }
      });
      return;
    }

    const {
      room_id: roomId,
      study_table_id: requestedTableId,
      start_time: startTime,
      end_time: endTime,
      reservation_type: reservationType = "individual",
      seats_requested: seatsRequested = 1,
      notes = null
    } = req.body;
    const userId = req.auth.userId;

    // Uso una transazione per evitare prenotazioni doppie sullo stesso tavolo
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Prima controllo che l'utente esista e sia attivo
      const [users] = await connection.query(
        "SELECT id FROM users WHERE id = :userId AND status = 'active'",
        { userId }
      );

      if (users.length === 0) {
        await connection.rollback();
        res.status(404).json({
          error: {
            message: "Utente non trovato o non attivo."
          }
        });
        return;
      }

      // Poi controllo che l'aula esista e che sia aperta
      const [rooms] = await connection.query(`
        SELECT sr.id
        FROM study_rooms sr
        INNER JOIN buildings b ON b.id = sr.building_id
        WHERE sr.id = :roomId
          AND sr.status = 'open'
          AND b.status = 'open'
      `, { roomId });

      if (rooms.length === 0) {
        await connection.rollback();
        res.status(404).json({
          error: {
            message: "Aula non trovata o non disponibile."
          }
        });
        return;
      }

      const tableFilters = {
        roomId,
        requestedTableId: requestedTableId || null,
        startTime,
        endTime,
        seatsRequested
      };

      // Cerco un tavolo con abbastanza posti e senza prenotazioni sovrapposte
      const [tables] = await connection.query(`
        SELECT st.id
        FROM study_tables st
        WHERE st.room_id = :roomId
          AND st.status = 'available'
          AND st.seats_count >= :seatsRequested
          AND (:requestedTableId IS NULL OR st.id = :requestedTableId)
          AND NOT EXISTS (
            SELECT 1
            FROM reservations r
            WHERE r.study_table_id = st.id
              AND r.status = 'active'
              AND r.start_time < :endTime
              AND r.end_time > :startTime
          )
        ORDER BY
          CASE WHEN st.is_group_table = TRUE THEN 1 ELSE 0 END,
          st.seats_count,
          st.id
        LIMIT 1
        FOR UPDATE
      `, tableFilters);

      if (tables.length === 0) {
        await connection.rollback();
        res.status(409).json({
          error: {
            message: "Non ci sono tavoli disponibili per l'aula e l'orario richiesti."
          }
        });
        return;
      }

      const studyTableId = tables[0].id;

      // Se ho trovato un tavolo valido, salvo la prenotazione
      const [result] = await connection.query(`
        INSERT INTO reservations (
          user_id,
          study_table_id,
          start_time,
          end_time,
          reservation_type,
          seats_requested,
          notes
        ) VALUES (
          :userId,
          :studyTableId,
          :startTime,
          :endTime,
          :reservationType,
          :seatsRequested,
          :notes
        )
      `, {
        userId,
        studyTableId,
        startTime,
        endTime,
        reservationType,
        seatsRequested,
        notes
      });

      const [createdRows] = await connection.query(`
        SELECT
          r.id,
          r.user_id,
          st.id AS study_table_id,
          st.table_code,
          sr.id AS room_id,
          sr.name AS room_name,
          r.start_time,
          r.end_time,
          r.reservation_type,
          r.seats_requested,
          r.status,
          r.notes,
          r.created_at
        FROM reservations r
        INNER JOIN study_tables st ON st.id = r.study_table_id
        INNER JOIN study_rooms sr ON sr.id = st.room_id
        WHERE r.id = :reservationId
      `, { reservationId: result.insertId });

      await connection.commit();

      const reservation = createdRows[0];

      // Avviso i client collegati via WebSocket che qualcosa e cambiato
      websocketHub.broadcast({
        type: "reservation.created",
        payload: reservation,
        timestamp: new Date().toISOString()
      });

      websocketHub.broadcast({
        type: "room.availability.changed",
        payload: {
          room_id: roomId
        },
        timestamp: new Date().toISOString()
      });

      res.status(201).json(reservation);
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  });

  return router;
}

// Validazione base dei dati ricevuti dal client


module.exports = createReservationRoutes;
