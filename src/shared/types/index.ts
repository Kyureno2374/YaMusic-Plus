export interface ModSettings {
  downloadPath?: string;
  enableDiscordRPC?: boolean;
  audioQuality?: 'low' | 'medium' | 'high' | 'lossless';
}

export interface PatcherConfig {
  targetPath: string;
  outputPath: string;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artists: string[];
  album?: string;
  duration: number;
  coverUrl?: string;
}

