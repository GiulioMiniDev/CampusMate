const http = require("http");
const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const roomRoutes = require("./routes/roomRoutes");
const buildingRoutes = require("./routes/buildingRoutes");
const createReservationRoutes = require("./routes/reservationRoutes");
const createWebSocketHub = require("./websocket/hub");

const app = express();
const server = http.createServer(app);
const websocketHub = createWebSocketHub(server);

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/reservations", createReservationRoutes(websocketHub));

app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Endpoint non trovato."
    }
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    error: {
      message: "Errore interno del server."
    }
  });
});

server.listen(env.port, () => {
  console.log(`CampusMate server avviato su http://localhost:${env.port}`);
  console.log(`WebSocket disponibile su ws://localhost:${env.port}`);
});
