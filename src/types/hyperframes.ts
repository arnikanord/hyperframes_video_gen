export type AspectRatio = '16:9' | '9:16' | '1:1';

export type ClipType = 
  | 'screencast' 
  | 'avatar' 
  | 'text' 
  | 'card' 
  | 'badge' 
  | 'metric' 
  | 'media' 
  | 'shape' 
  | 'captions' 
  | 'callout';

export type AnimationType = 'slideUp' | 'fade' | 'zoomIn' | 'bounce' | 'wipe' | 'kineticText';

export type ScreencastLayout = 'fullscreen' | 'pip' | 'split' | 'window';

export interface HyperFrameClip {
  id: string;
  name: string;
  type: ClipType;
  start: number; // in seconds
  duration: number; // in seconds
  trackIndex: number; // 0: Screencast/Backdrop, 1: Avatar/Host, 2: Graphics/Cards/Callouts, 3: Audio

  // Content
  title?: string;
  subtitle?: string;
  content?: string;
  accentColor?: string;

  // Typography & Layout
  fontFamily?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  x?: number; // percentage (0-100)
  y?: number; // percentage (0-100)
  width?: number; // percentage
  height?: number; // percentage
  zIndex?: number;

  // Screencast specific
  screencastUrl?: string;
  screencastLayout?: ScreencastLayout;
  screencastZoom?: number; // 1 to 2
  screencastFileName?: string;

  // HeyGen Avatar specific
  avatarId?: string;
  avatarName?: string;
  avatarStyle?: 'normal' | 'circle' | 'close_up';
  voiceId?: string;
  voiceName?: string;
  script?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  isHeyGenRendered?: boolean;

  // Animation / GSAP
  animation?: AnimationType;
  ease?: string;
}

export interface ScreencastAsset {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'image';
  size: number;
  duration?: number;
  thumbnailUrl?: string;
  createdAt: number;
  source: 'upload' | 'screen_record' | 'preset';
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface AudioTrackConfig {
  id: string;
  name: string;
  url: string;
  volume: number; // 0 to 1
  isMuted: boolean;
  duckOnVoice: boolean;
  source?: 'elevenlabs' | 'upload' | 'preset';
}

export interface HyperframesProject {
  id: string;
  title: string;
  duration: number; // total duration in seconds
  fps: number;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  bgGradient: string;
  bgVideoUrl?: string;
  clips: HyperFrameClip[];
  captions: CaptionSegment[];
  audioTracks: AudioTrackConfig[];
}

export interface HeyGenUserStatus {
  apiKey: string;
  isConnected: boolean;
  accountEmail?: string;
  plan?: string;
  quota?: string | number;
  isGoogleLinked: boolean;
  googleUser?: {
    email: string;
    name: string;
    picture?: string;
  } | null;
}

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
  styles: string[];
  tag?: string;
  is_custom?: boolean;
  avatar_type?: string; // 'instant_avatar' | 'talking_photo' | 'custom' | 'studio'
}

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  preview_audio?: string;
  is_custom?: boolean;
  is_cloned?: boolean;
}

// Kie.ai integration
export interface KieAiStatus {
  apiKey: string;
  isConnected: boolean;
  isGoogleLinked: boolean;
  model: string; // e.g. "kling-1.5", "veo-2", "flux-pro"
  credits?: string | number;
  email?: string;
}

// ElevenLabs integration
export interface ElevenLabsStatus {
  apiKey: string;
  isConnected: boolean;
  isGoogleLinked: boolean;
  email?: string;
  googleUser?: {
    email: string;
    name: string;
    picture?: string;
  } | null;
  selectedVoiceId: string;
  quotaRemaining?: number;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  preview_url?: string;
  labels?: Record<string, string>;
  accent?: string;
  description?: string;
  is_custom?: boolean;
  is_cloned?: boolean;
}

// Canva integration
export interface CanvaStatus {
  isConnected: boolean;
  email: string;
  teamName?: string;
  syncedAssetsCount: number;
}

export interface CanvaAsset {
  id: string;
  title: string;
  thumbnailUrl: string;
  type: 'presentation' | 'video' | 'social_post' | 'banner';
  downloadUrl?: string;
  updatedAt: string;
}

export interface RenderJob {
  id: string;
  type: 'heygen_cloud' | 'browser_video' | 'hyperframes_package' | 'kie_render';
  title: string;
  status: 'idle' | 'preparing' | 'rendering' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}
