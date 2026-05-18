const { WebSocketServer } = require("ws");

function createWebSocketHub(server) {
  const wss = new WebSocketServer({ server });

  function broadcast(message) {
    const data = JSON.stringify(message);

    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  }

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({
      type: "connection.ready",
      payload: {
        message: "WebSocket CampusMate connesso"
      },
      timestamp: new Date().toISOString()
    }));

    socket.on("message", (rawMessage) => {
      socket.send(JSON.stringify({
        type: "connection.echo",
        payload: {
          message: rawMessage.toString()
        },
        timestamp: new Date().toISOString()
      }));
    });
  });

  return {
    broadcast
  };
}

module.exports = createWebSocketHub;
