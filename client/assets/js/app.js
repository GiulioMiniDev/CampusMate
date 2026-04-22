(function () {
  const { createApp } = Vue;

  createApp({
    data() {
      return {
        apiBaseUrl: "http://localhost:8000",
        websocketUrl: "ws://localhost:9000",
        backendStatus: "in attesa",
        socketStatus: "disconnesso",
        health: null,
        socketMessages: []
      };
    },
    mounted() {
      this.loadHealth();
      this.connectWebSocket();
    },
    methods: {
      loadHealth() {
        const request = new XMLHttpRequest();
        request.open("GET", this.apiBaseUrl + "/api/health");
        request.onreadystatechange = () => {
          if (request.readyState !== 4) {
            return;
          }

          if (request.status >= 200 && request.status < 300) {
            this.health = JSON.parse(request.responseText);
            this.backendStatus = "online";
            return;
          }

          this.backendStatus = "offline";
        };
        request.onerror = () => {
          this.backendStatus = "offline";
        };
        request.send();
      },
      connectWebSocket() {
        const socket = new WebSocket(this.websocketUrl);

        socket.addEventListener("open", () => {
          this.socketStatus = "connesso";
          socket.send(JSON.stringify({ type: "hello", source: "client" }));
        });

        socket.addEventListener("message", (event) => {
          this.socketMessages.unshift(event.data);
          this.socketMessages = this.socketMessages.slice(0, 5);
        });

        socket.addEventListener("close", () => {
          this.socketStatus = "chiuso";
        });

        socket.addEventListener("error", () => {
          this.socketStatus = "errore";
        });
      }
    }
  }).mount("#app");
})();

