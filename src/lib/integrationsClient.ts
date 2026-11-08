import { 
  ScreencastAsset, 
  KieAiStatus, 
  ElevenLabsStatus, 
  ElevenLabsVoice, 
  CanvaStatus, 
  CanvaAsset 
} from '../types/hyperframes';

const KEY_KIE = 'hyperframes_kie_status_v1';
const KEY_ELEVENLABS = 'hyperframes_elevenlabs_status_v1';
const KEY_CANVA = 'hyperframes_canva_status_v1';

// ==========================================
// 1. SCREENCAST ASSET UPLOAD & RECORDING
// ==========================================

export async function fetchScreencastAssets(): Promise<ScreencastAsset[]> {
  try {
    const res = await fetch('/api/uploads');
    const json = await res.json();
    return json.assets || [];
  } catch (err) {
    console.error('Failed to fetch screencast uploads:', err);
    return [];
  }
}

export async function uploadScreencastFile(file: File): Promise<ScreencastAsset | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            data: base64Data,
            type: file.type,
          }),
        });
        const json = await res.json();
        if (json.success && json.asset) {
          resolve(json.asset);
        } else {
          reject(new Error(json.message || 'Upload failed'));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// In-Browser Screen Recording Helper
export async function startBrowserScreenCapture(): Promise<{ stream: MediaStream; stop: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: true,
  });

  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start();

  const stop = (): Promise<Blob> => {
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    });
  };

  return { stream, stop };
}

// ==========================================
// 2. KIE.AI CLIENT
// ==========================================

export function getStoredKieStatus(): KieAiStatus {
  try {
    const raw = localStorage.getItem(KEY_KIE);
    return raw ? JSON.parse(raw) : {
      apiKey: '',
      isConnected: false,
      isGoogleLinked: false,
      model: 'veo-2',
      credits: '100 Credits',
    };
  } catch {
    return {
      apiKey: '',
      isConnected: false,
      isGoogleLinked: false,
      model: 'veo-2',
    };
  }
}

export function saveKieStatus(status: KieAiStatus) {
  localStorage.setItem(KEY_KIE, JSON.stringify(status));
}

export async function verifyKieConnection(params: { apiKey?: string; email?: string }): Promise<{
  success: boolean;
  message: string;
  credits?: string;
  models?: string[];
}> {
  try {
    const res = await fetch('/api/kie/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

// ==========================================
// 3. ELEVENLABS CLIENT FOR VOICEOVER
// ==========================================

export function getStoredElevenLabsStatus(): ElevenLabsStatus {
  try {
    const raw = localStorage.getItem(KEY_ELEVENLABS);
    return raw ? JSON.parse(raw) : {
      apiKey: '',
      isConnected: false,
      isGoogleLinked: false,
      selectedVoiceId: '21m00Tcm4TlvDq8ikWAM',
    };
  } catch {
    return {
      apiKey: '',
      isConnected: false,
      isGoogleLinked: false,
      selectedVoiceId: '21m00Tcm4TlvDq8ikWAM',
    };
  }
}

export function saveElevenLabsStatus(status: ElevenLabsStatus) {
  localStorage.setItem(KEY_ELEVENLABS, JSON.stringify(status));
}

export async function verifyElevenLabs(params: { apiKey?: string; email?: string } | string): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const payload = typeof params === 'string' ? { apiKey: params } : params;
    const res = await fetch('/api/elevenlabs/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

const KEY_CUSTOM_VOICES = 'hyperframes_custom_voices_v1';

export function getCustomVoices(): ElevenLabsVoice[] {
  try {
    const raw = localStorage.getItem(KEY_CUSTOM_VOICES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomVoice(voice: ElevenLabsVoice) {
  const current = getCustomVoices();
  const filtered = current.filter((v) => v.voice_id !== voice.voice_id);
  const updated = [{ ...voice, is_custom: true, is_cloned: true, category: 'My Cloned Voice' }, ...filtered];
  localStorage.setItem(KEY_CUSTOM_VOICES, JSON.stringify(updated));
  return updated;
}

export function deleteCustomVoice(voiceId: string) {
  const current = getCustomVoices();
  const updated = current.filter((v) => v.voice_id !== voiceId);
  localStorage.setItem(KEY_CUSTOM_VOICES, JSON.stringify(updated));
  return updated;
}

export async function fetchElevenLabsVoices(apiKey?: string): Promise<ElevenLabsVoice[]> {
  const customList = getCustomVoices();
  try {
    const res = await fetch('/api/elevenlabs/voices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || '' }),
    });
    const json = await res.json();
    const fetched: ElevenLabsVoice[] = json.voices || [];

    const existingIds = new Set(customList.map((v) => v.voice_id));
    const nonDuplicates = fetched.filter((v) => !existingIds.has(v.voice_id));

    return [...customList, ...nonDuplicates];
  } catch (e) {
    console.error('Failed to fetch ElevenLabs voices:', e);
    return customList;
  }
}

export async function generateElevenLabsVoiceover(text: string, voiceId?: string, apiKey?: string): Promise<{
  success: boolean;
  audioUrl?: string;
  name?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/elevenlabs/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, apiKey }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, message: String(e) };
  }
}

// ==========================================
// 4. CANVA CLIENT
// ==========================================

export function getStoredCanvaStatus(): CanvaStatus {
  try {
    const raw = localStorage.getItem(KEY_CANVA);
    return raw ? JSON.parse(raw) : {
      isConnected: false,
      email: '',
      syncedAssetsCount: 0,
    };
  } catch {
    return {
      isConnected: false,
      email: '',
      syncedAssetsCount: 0,
    };
  }
}

export function saveCanvaStatus(status: CanvaStatus) {
  localStorage.setItem(KEY_CANVA, JSON.stringify(status));
}

export async function connectCanvaWithEmail(email: string): Promise<{
  success: boolean;
  email?: string;
  teamName?: string;
  syncedAssetsCount?: number;
  message?: string;
}> {
  try {
    const res = await fetch('/api/canva/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, message: String(e) };
  }
}

export async function fetchCanvaAssets(): Promise<CanvaAsset[]> {
  try {
    const res = await fetch('/api/canva/assets');
    const json = await res.json();
    return json.assets || [];
  } catch (e) {
    console.error('Failed to fetch Canva assets:', e);
    return [];
  }
}
