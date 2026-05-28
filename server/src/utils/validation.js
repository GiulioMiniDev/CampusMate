const APP_TIME_ZONE = "Europe/Rome";

function parseDateTimeValue(value) {
  if (value instanceof Date) {
    return value;
  }

  const stringValue = value === undefined || value === null ? "" : String(value);

  if (!stringValue) {
    return new Date("invalid");
  }

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(stringValue)) {
    return new Date(stringValue);
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(stringValue)) {
    return new Date(`${stringValue.replace(" ", "T")}Z`);
  }

  return new Date(stringValue);
}

function getDatePartInZone(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

function validateBookingParameters(params) {
  const roomId = Number(params.room_id);
  const requestedTableId = params.study_table_id === undefined || params.study_table_id === null ? null : Number(params.study_table_id);
  const seatsRequested = Number(params.seats_requested || 1);
  const startTime = parseDateTimeValue(params.start_time);
  const endTime = parseDateTimeValue(params.end_time);
  const reservationType = params.reservation_type;

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return "room_id � obbligatorio e deve essere un numero positivo.";
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

  if (startTime < getCurrentMinute()) {
    return "La prenotazione non puo iniziare nel passato.";
  }

  if (getLocalDatePart(params.start_time, startTime) !== getLocalDatePart(params.end_time, endTime)) {
    return "La prenotazione deve iniziare e finire nello stesso giorno.";
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

function getLocalDatePart(value, parsedDate) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  const dateMatch = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);

  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    return getDatePartInZone(parsedDate);
  }

  return dateMatch ? dateMatch[1] : "";
}

function getCurrentMinute() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

module.exports = {
  validateBookingParameters
};
