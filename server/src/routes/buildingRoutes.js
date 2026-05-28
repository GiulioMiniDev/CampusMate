const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [buildings] = await db.query(`
      SELECT id, name, code, address, campus_area, image_url, latitude, longitude,
             weekday_hours, weekend_hours, services, opening_time, closing_time, status
      FROM buildings 
      ORDER BY name
    `);
    res.json(buildings.map((building) => ({
      ...building,
      latitude: building.latitude === null || building.latitude === undefined ? null : Number(building.latitude),
      longitude: building.longitude === null || building.longitude === undefined ? null : Number(building.longitude),
      services: normalizeServices(building.services)
    })));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: { message: "Non autorizzato" } });
  }

  let { name, code, address, campus_area, image_url, latitude, longitude, weekday_hours, weekend_hours, services, opening_time, closing_time, status } = req.body;
  
  try {
    // Se c'è un indirizzo ma non le coordinate, usiamo Nominatim API (OpenStreetMap) per il geocoding
    if (address && (!latitude || !longitude)) {
      try {
        const query = encodeURIComponent(address);
        const geocr = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
          headers: { 'User-Agent': 'CampusMateApp/1.0' }
        });
        const geodata = await geocr.json();
        if (geodata && geodata.length > 0) {
          latitude = parseFloat(geodata[0].lat);
          longitude = parseFloat(geodata[0].lon);
        }
      } catch (geoError) {
        console.error("Geocoding fallito, continuo senza coordinate:", geoError);
      }
    }

    // Se non troviamo le coordinate, un fallback generico su Roma o Cassino per non far sparire l'edificio dalla mappa
    if (latitude == null || longitude == null) {
      if (address && address.toLowerCase().includes("cassino")) {
        latitude = 41.4925;
        longitude = 13.8300;
      } else {
        latitude = 41.8900;
        longitude = 12.5100;
      }
    }

    // Convertiamo eventuali stringhe vuote in null per il DB
    latitude = latitude || null;
    longitude = longitude || null;
    image_url = image_url || null;
    campus_area = campus_area || null;
    weekday_hours = weekday_hours || null;
    weekend_hours = weekend_hours || null;
    opening_time = opening_time || null;
    closing_time = closing_time || null;

    const [result] = await db.query(`
      INSERT INTO buildings (name, code, address, campus_area, image_url, latitude, longitude, weekday_hours, weekend_hours, services, opening_time, closing_time)
      VALUES (:name, :code, :address, :campus_area, :image_url, :latitude, :longitude, :weekday_hours, :weekend_hours, :services, :opening_time, :closing_time)
    `, { 
      name, 
      code, 
      address, 
      campus_area, 
      image_url, 
      latitude, 
      longitude, 
      weekday_hours, 
      weekend_hours, 
      services: services ? JSON.stringify(services) : null, 
      opening_time, 
      closing_time 
    });

    res.status(201).json({ id: result.insertId, message: "Edificio creato con successo." });
  } catch (error) {
    next(error);
  }
});

async function updateBuilding(req, res, next) {
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: { message: "Non autorizzato" } });
  }

  const buildingId = req.params.id;
  let { name, code, address, campus_area, image_url, latitude, longitude, weekday_hours, weekend_hours, services, opening_time, closing_time, status } = req.body;

  try {
    if (address && (!latitude || !longitude)) {
      try {
        const query = encodeURIComponent(address);
        const geocr = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
          headers: { 'User-Agent': 'CampusMateApp/1.0' }
        });
        const geodata = await geocr.json();
        if (geodata && geodata.length > 0) {
          latitude = parseFloat(geodata[0].lat);
          longitude = parseFloat(geodata[0].lon);
        }
      } catch (geoError) {
        console.error("Geocoding fallito, continuo senza coordinate:", geoError);
      }
    }

    if (latitude == null || longitude == null) {
      if (address && address.toLowerCase().includes("cassino")) {
        latitude = 41.4925;
        longitude = 13.8300;
      } else {
        latitude = 41.8900;
        longitude = 12.5100;
      }
    }

    latitude = latitude || null;
    longitude = longitude || null;
    image_url = image_url || null;
    campus_area = campus_area || null;
    weekday_hours = weekday_hours || null;
    weekend_hours = weekend_hours || null;
    opening_time = opening_time || null;
    closing_time = closing_time || null;

    await db.query(`
      UPDATE buildings 
      SET name = :name, code = :code, address = :address, campus_area = :campus_area, 
          image_url = :image_url, latitude = :latitude, longitude = :longitude, 
          weekday_hours = :weekday_hours, weekend_hours = :weekend_hours, 
          services = :services, opening_time = :opening_time, closing_time = :closing_time,
          status = :status
      WHERE id = :id
    `, {
      id: buildingId,
      name, code, address, campus_area, image_url, latitude, longitude, weekday_hours, weekend_hours,
      services: services ? JSON.stringify(services) : null,
      opening_time, closing_time,
      status: status || "open"
    });

    res.json({ message: "Edificio aggiornato con successo." });
  } catch (error) {
    next(error);
  }
}

router.put("/:id", requireAuth, updateBuilding);
router.post("/:id", requireAuth, updateBuilding);

module.exports = router;

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
