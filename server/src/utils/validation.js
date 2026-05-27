function validateBookingParameters(params) {
  const roomId = Number(params.room_id);
  const requestedTableId = params.study_table_id === undefined || params.study_table_id === null ? null : Number(params.study_table_id);
  const seatsRequested = Number(params.seats_requested || 1);
  const startTime = new Date(params.start_time);
  const endTime = new Date(params.end_time);
  const reservationType = params.reservation_type;

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return "room_id è obbligatorio e deve essere un numero positivo.";
  }

  if (requestedTableId !== null && (!Number.isInteger(requestedTableId) || requestedTableId <= 0)) {
    return "study_table_id deve essere un numero positivo.";
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

  if (reservationType !== undefined) {
    if (!["individual", "group"].includes(reservationType)) {
      return "reservation_type deve essere individual oppure group.";
    }

    if (reservationType === "individual" && seatsRequested !== 1) {
      return "Una prenotazione individuale deve richiedere 1 posto.";
    }
  }

  return null;
}

module.exports = {
  validateBookingParameters
};
