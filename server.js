const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ STATIC FILE
app.use(express.static(__dirname));

// ✅ FORCE INDEX LOAD
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let waitingUser = null;

io.on("connection", (socket) => {

  function matchUser() {
    if (waitingUser && waitingUser !== socket) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched", { role: "caller" });
      waitingUser.emit("matched", { role: "receiver" });

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  }

  socket.on("start", () => {
    matchUser();
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }

    socket.partner = null;
    matchUser();
  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("offer", (offer) => {
    if (socket.partner) {
      socket.partner.emit("offer", offer);
    }
  });

  socket.on("answer", (answer) => {
    if (socket.partner) {
      socket.partner.emit("answer", answer);
    }
  });

  socket.on("ice-candidate", (candidate) => {
    if (socket.partner) {
      socket.partner.emit("ice-candidate", candidate);
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

// ✅ PORT PEHLE DEFINE
const PORT = process.env.PORT || 5000;

// ✅ SERVER START
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
