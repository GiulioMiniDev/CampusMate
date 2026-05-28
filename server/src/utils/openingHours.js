function getTimeMinutes(value) {
  const match = String(value || "").match(/(\d{1,2})[:.](\d{2})/);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function getTimeRangeMinutes(text) {
  const matches = String(text || "").match(/\d{1,2}[:.]\d{2}/g);

  if (!matches || matches.length < 2) {
    return null;
  }

  return {
    opens: getTimeMinutes(matches[0]),
    closes: getTimeMinutes(matches[1])
  };
}

function getDatePart(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : "";
}

function getOpeningWindow(building, startTime) {
  const datePart = getDatePart(startTime);

  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    const weekendHours = building.weekend_hours || "";
    const normalizedWeekend = weekendHours.toLowerCase();

    if (!weekendHours || normalizedWeekend.includes("chiuso")) {
      return { closed: true };
    }

    if (dayOfWeek === 6 && normalizedWeekend.includes("domenica") && !normalizedWeekend.includes("sabato")) {
      return { closed: true };
    }

    if (dayOfWeek === 0 && normalizedWeekend.includes("sabato") && !normalizedWeekend.includes("domenica")) {
      return { closed: true };
    }

    return getTimeRangeMinutes(weekendHours) || getDefaultOpeningWindow(building);
  }

  return getTimeRangeMinutes(building.weekday_hours) || getDefaultOpeningWindow(building);
}

function getDefaultOpeningWindow(building) {
  const opens = getTimeMinutes(building.opening_time);
  const closes = getTimeMinutes(building.closing_time);

  if (opens === null || closes === null) {
    return null;
  }

  return { opens, closes };
}

function formatMinutes(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");

  return `${hours}:${mins}`;
}

function validateOpeningHours(building, startTime, endTime) {
  const window = getOpeningWindow(building, startTime);

  if (!window) {
    return null;
  }

  if (window.closed) {
    return "L'aula studio risulta chiusa nel giorno selezionato.";
  }

  const startMinutes = getTimeMinutes(startTime);
  const endMinutes = getTimeMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  if (startMinutes < window.opens || endMinutes > window.closes) {
    return `L'aula studio è aperta dalle ${formatMinutes(window.opens)} alle ${formatMinutes(window.closes)}.`;
  }

  return null;
}

module.exports = {
  validateOpeningHours
};
