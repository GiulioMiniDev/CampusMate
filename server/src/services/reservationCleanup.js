const db = require("../config/database");

const DEFAULT_INTERVAL_MS = 60 * 1000;

async function completeExpiredReservations(websocketHub = null) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [expiredReservations] = await connection.query(`
      SELECT
        r.id,
        st.room_id
      FROM reservations r
      INNER JOIN study_tables st ON st.id = r.study_table_id
      WHERE r.status = 'active'
        AND r.end_time <= NOW()
      FOR UPDATE
    `);

    if (expiredReservations.length === 0) {
      await connection.commit();
      return 0;
    }

    const reservationIds = expiredReservations.map((reservation) => reservation.id);

    await connection.query(`
      UPDATE reservations
      SET status = 'completed'
      WHERE id IN (:reservationIds)
    `, { reservationIds });

    await connection.commit();

    broadcastCleanup(websocketHub, expiredReservations);
    return expiredReservations.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function startReservationCleanup(websocketHub, options = {}) {
  const intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS;
  let running = false;

  const runCleanup = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const completedCount = await completeExpiredReservations(websocketHub);

      if (completedCount > 0) {
        console.log(`Reservation cleanup completed ${completedCount} expired reservation(s).`);
      }
    } catch (error) {
      console.error("Reservation cleanup failed:", error);
    } finally {
      running = false;
    }
  };

  runCleanup();

  const timer = setInterval(runCleanup, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return timer;
}

function broadcastCleanup(websocketHub, expiredReservations) {
  if (!websocketHub) {
    return;
  }

  const roomIds = Array.from(new Set(expiredReservations.map((reservation) => reservation.room_id)));

  websocketHub.broadcast({
    type: "reservation.completed",
    payload: {
      reservation_ids: expiredReservations.map((reservation) => reservation.id)
    },
    timestamp: new Date().toISOString()
  });

  for (const roomId of roomIds) {
    websocketHub.broadcast({
      type: "room.availability.changed",
      payload: {
        room_id: roomId
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  completeExpiredReservations,
  startReservationCleanup
};
