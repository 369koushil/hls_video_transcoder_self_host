const redis=require('ioredis')
const {Queue}=require('bullmq')

const connection=new redis()

const videoQueue=new Queue("video_queue",{connection})

module.exports = {videoQueue};

