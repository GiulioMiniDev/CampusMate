(function () {
  const { createApp } = Vue;

  createApp({
    data() {
      return {
        apiBaseUrl: "http://localhost:8000",
        websocketUrl: "ws://localhost:8000",
        backendStatus: "offline",
        socketStatus: "disconnesso",
        health: null,
        socketMessages: [],
        rooms: [
          {
            id: 1,
            name: "Studio Principale",
            building: "Edificio A",
            floor: 1,
            total_seats: 24,
            available_seats: 13
          },
          {
            id: 2,
            name: "Zona Collaborativa",
            building: "Edificio A",
            floor: 2,
            total_seats: 18,
            available_seats: 3
          }
        ],
        loadingRooms: false,
        totalRooms: 2,
        availableSeats: 16
      };
    },
    mounted() {
      this.loadHealth();
      this.connectWebSocket();
      this.loadRooms();
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
      loadRooms() {
        this.loadingRooms = true;
        const request = new XMLHttpRequest();
        request.open("GET", this.apiBaseUrl + "/api/rooms");
        request.onreadystatechange = () => {
          if (request.readyState !== 4) {
            return;
          }

          this.loadingRooms = false;

          if (request.status >= 200 && request.status < 300) {
            this.rooms = JSON.parse(request.responseText);
            this.calculateStats();
            return;
          }
        };
        request.onerror = () => {
          this.loadingRooms = false;
        };
        request.send();
      },
      calculateStats() {
        this.totalRooms = this.rooms.length;
        this.availableSeats = this.rooms.reduce((sum, room) => sum + (room.available_seats || 0), 0);
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
