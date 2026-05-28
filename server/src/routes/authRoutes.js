const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createAuthToken } = require("../utils/tokens");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const validationError = validateRegistrationInput(req.body);

  if (validationError) {
    res.status(400).json({
      error: {
        message: validationError
      }
    });
    return;
  }

  const userInput = normalizeRegistrationInput(req.body);

  try {
    const passwordHash = hashPassword(userInput.password);
    const [result] = await db.query(`
      INSERT INTO users (
        first_name,
        last_name,
        email,
        password_hash,
        role,
        student_number,
        degree_course,
        year_of_study,
        phone,
        status
      ) VALUES (
        :firstName,
        :lastName,
        :email,
        :passwordHash,
        'student',
        :studentNumber,
        :degreeCourse,
        :yearOfStudy,
        :phone,
        'active'
      )
    `, {
      firstName: userInput.firstName,
      lastName: userInput.lastName,
      email: userInput.email,
      passwordHash,
      studentNumber: userInput.studentNumber,
      degreeCourse: userInput.degreeCourse,
      yearOfStudy: userInput.yearOfStudy,
      phone: userInput.phone
    });

    const [users] = await db.query(`
      SELECT id, first_name, last_name, email, role, student_number, degree_course, year_of_study, phone
      FROM users
      WHERE id = :userId
    `, { userId: result.insertId });

    const user = await attachReceptionAssignments(toPublicUser(users[0]));

    res.status(201).json({
      user,
      token: createAuthToken(user)
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        error: {
          message: "Email o matricola gia registrate."
        }
      });
      return;
    }

    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const validationError = validateLoginInput(req.body);

  if (validationError) {
    res.status(400).json({
      error: {
        message: validationError
      }
    });
    return;
  }

  try {
    const email = String(req.body.email).trim().toLowerCase();
    const [users] = await db.query(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        password_hash,
        role,
        student_number,
        degree_course,
        year_of_study,
        phone,
        status
      FROM users
      WHERE email = :email
      LIMIT 1
    `, { email });

    if (users.length === 0 || users[0].status !== "active" || !verifyPassword(req.body.password, users[0].password_hash)) {
      res.status(401).json({
        error: {
          message: "Email o password non corretti."
        }
      });
      return;
    }

    const user = await attachReceptionAssignments(toPublicUser(users[0]));

    res.json({
      user,
      token: createAuthToken(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [users] = await db.query(`
      SELECT id, first_name, last_name, email, role, student_number, degree_course, year_of_study, phone, status
      FROM users
      WHERE id = :userId
      LIMIT 1
    `, { userId: req.auth.userId });

    if (users.length === 0 || users[0].status !== "active") {
      res.status(401).json({
        error: {
          message: "Sessione non valida."
        }
      });
      return;
    }

    res.json({
      user: await attachReceptionAssignments(toPublicUser(users[0]))
    });
  } catch (error) {
    next(error);
  }
});

function validateLoginInput(body) {
  if (!body.email || !isValidEmail(body.email)) {
    return "Inserisci un indirizzo email valido.";
  }

  if (!body.password) {
    return "Inserisci la password.";
  }

  return null;
}

function validateRegistrationInput(body) {
  if (!body.first_name || String(body.first_name).trim().length < 2) {
    return "Il nome deve contenere almeno 2 caratteri.";
  }

  if (!body.last_name || String(body.last_name).trim().length < 2) {
    return "Il cognome deve contenere almeno 2 caratteri.";
  }

  if (!body.email || !isValidEmail(body.email)) {
    return "Inserisci un indirizzo email valido.";
  }

  if (!body.password || String(body.password).length < 8) {
    return "La password deve contenere almeno 8 caratteri.";
  }

  if (body.year_of_study !== undefined && body.year_of_study !== null && body.year_of_study !== "") {
    const yearOfStudy = Number(body.year_of_study);

    if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 6) {
      return "L'anno di studio deve essere compreso tra 1 e 6.";
    }
  }

  return null;
}

function normalizeRegistrationInput(body) {
  return {
    firstName: String(body.first_name).trim(),
    lastName: String(body.last_name).trim(),
    email: String(body.email).trim().toLowerCase(),
    password: String(body.password),
    studentNumber: normalizeOptionalString(body.student_number),
    degreeCourse: normalizeOptionalString(body.degree_course),
    yearOfStudy: body.year_of_study ? Number(body.year_of_study) : null,
    phone: normalizeOptionalString(body.phone)
  };
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return null;

  const normalizedValue = String(value).trim();

  return normalizedValue || null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function toPublicUser(user) {
  return {
    id: Number(user.id),
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    student_number: user.student_number,
    degree_course: user.degree_course,
    year_of_study: user.year_of_study === null ? null : Number(user.year_of_study),
    phone: user.phone,
    assigned_buildings: []
  };
}

async function attachReceptionAssignments(user) {
  if (user.role !== "receptionist") {
    return user;
  }

  const [buildings] = await db.query(`
    SELECT b.id, b.name, b.code
    FROM receptionist_assignments ra
    INNER JOIN buildings b ON b.id = ra.building_id
    WHERE ra.user_id = :userId
    ORDER BY b.name
  `, { userId: user.id });

  return {
    ...user,
    assigned_buildings: buildings.map((building) => ({
      ...building,
      id: Number(building.id)
    }))
  };
}

module.exports = router;
