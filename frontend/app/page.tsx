"use client";

import { useState } from "react";
import DragUpload from "@/components/DragUpload";
import VideoPlayer from "@/components/VideoPlayer";
import { connectSocket, disconnectSocket } from "../utils/socket";
import { ProgressData, VideoUrl } from "../utils/types";

export default function Page() {
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
    console.log(message);
  };

  const handleUploadComplete = (jobId: string, fileName: string) => {
    addLog(`Upload complete, creating job: ${jobId} ${fileName}`);

    const socket = connectSocket();

    socket.on("active", ({ jobId: id }) => {
      addLog(`[socket event] active: ${id}`);
    });

    socket.on("progress", ({ jobId: id, data }: { jobId: string; data: ProgressData }) => {
      addLog(`[socket event] progress: ${id} - ${data.step}`);
    });

    socket.on("completed", ({ jobId: id, videoUrl }: { jobId: string; videoUrl: VideoUrl }) => {
      addLog(`[socket event] completed: ${id}`);

      const master = videoUrl.outputFiles.find((f) => f.format === "hls_master");
      if (master?.path) {
        addLog(`Master playlist found: ${master.path}`);
        const url = master.path
          .replace(/\\/g, "/")
          .split("/outputs")[1];
        setSelectedVideo(`http://localhost:4000/outputs${url}`);
      }

      disconnectSocket();
    });


    socket.on("failed", ({ jobId: id, reason }: { jobId: string; reason: string }) => {
      addLog(`[socket event] failed: ${id} - ${reason}`);
      disconnectSocket();
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Video Transcoder</h1>

      <DragUpload onUploadComplete={handleUploadComplete} />

      <div className="mt-4 p-4 bg-gray-100 rounded h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">No events yet...</p>
        ) : (
          logs.map((log, index) => (
            <p key={index} className="text-sm font-mono mb-1">
              {log}
            </p>
          ))
        )}
      </div>

      {selectedVideo && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Video Player</h2>
          <VideoPlayer playlistUrl={selectedVideo} />
        </div>
      )}
    </div>
  );
}
