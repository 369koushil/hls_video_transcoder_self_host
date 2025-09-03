"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface DragUploadProps {
  onUploadComplete: (jobId: string, fileName: string) => void;
}

export default function DragUpload({ onUploadComplete }: DragUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("video", file);

      try {
        const res = await axios.post("http://localhost:4000/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
          },
        });

        onUploadComplete(res.data.jobId, file.name);

      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
    >
      <input {...getInputProps()} />
      {uploading ? <p>Uploading... {progress}%</p> : <p>{isDragActive ? "Drop video here" : "Drag & drop or click to upload"}</p>}
    </div>
  );
}
