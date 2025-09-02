const { QueueEvents } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis();
connection.options.maxRetriesPerRequest = null;

const queueEvents = new QueueEvents("video_queue", { connection });

module.exports = queueEvents;
