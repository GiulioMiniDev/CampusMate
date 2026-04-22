const WebSocket = require("ws");

const PORT = 9000;
const server = new WebSocket.Server({ port: PORT });

function broadcast(payload) {
  const message = JSON.stringify(payload);

  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      type: "welcome",
      message: "Connessione WebSocket CampusMate aperta"
    })
  );

  socket.on("message", (message) => {
    const text = message.toString();
    broadcast({
      type: "echo",
      payload: text
    });
  });

  socket.on("error", (error) => {
    console.error("Errore WebSocket:", error.message);
  });
});

server.on("listening", () => {
  console.log(`CampusMate WebSocket server attivo su ws://localhost:${PORT}`);
});

