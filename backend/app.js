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

app.use(express.json());

queueEvents.on("active", ({ jobId }) => {
  console.log("[QueueEvent] active:", { jobId });
  io.emit("active", { jobId });
});

queueEvents.on("progress", ({ jobId, data }) => {
  console.log("[QueueEvent] progress:", { jobId, data });
  io.emit("progress", { jobId, data });
});

queueEvents.on("completed", ({ jobId, returnvalue }) => {
  console.log(
  "[ Completed]",
  JSON.stringify({ jobId, returnvalue }, null, 2)
);
  io.emit("completed", { jobId, videoUrl: returnvalue });
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log("[QueueEvent] failed:", { jobId, failedReason });
  io.emit("failed", { jobId, reason: failedReason });
});


app.use("/", router);
app.use("/outputs", express.static(path.join(__dirname,"outputs")));

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
