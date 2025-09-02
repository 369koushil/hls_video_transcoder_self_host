const express = require("express");
const router = require("./routes/video.route");
const queueEvents = require("./services/queueEvents");
const { createServer } = require("node:http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});


app.use(cors({
  origin: "*"
}));


io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);
});


server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
