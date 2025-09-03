export type Job = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  step?: string;
  fileName?: string;
  playlistUrl?: string;
};

export type ProgressData = {
  step: string;
};

export type VideoFile = {
  format: string;
  path: string;
};

export type VideoUrl = {
  outputDir: string;
  outputFiles: VideoFile[];
};
