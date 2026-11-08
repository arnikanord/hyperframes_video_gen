import { HeyGenAvatar, HeyGenVoice, HeyGenUserStatus } from '../types/hyperframes';

const STORAGE_KEY_HEYGEN = 'hyperframes_heygen_credentials_v1';
const STORAGE_KEY_GOOGLE = 'hyperframes_google_auth_v1';

export function getStoredHeyGenStatus(): HeyGenUserStatus {
  try {
    const rawHeyGen = localStorage.getItem(STORAGE_KEY_HEYGEN);
    const rawGoogle = localStorage.getItem(STORAGE_KEY_GOOGLE);

    const heygenData = rawHeyGen ? JSON.parse(rawHeyGen) : null;
    const googleData = rawGoogle ? JSON.parse(rawGoogle) : null;

    return {
      apiKey: heygenData?.apiKey || '',
      isConnected: Boolean(heygenData?.apiKey),
      accountEmail: heygenData?.accountEmail || googleData?.email || '',
      plan: heygenData?.plan || (heygenData?.apiKey ? 'HeyGen Pro' : 'Explorer Plan'),
      quota: heygenData?.quota || 'Active',
      isGoogleLinked: Boolean(googleData?.email),
      googleUser: googleData || null,
    };
  } catch {
    return {
      apiKey: '',
      isConnected: false,
      isGoogleLinked: false,
      googleUser: null,
    };
  }
}

export function saveHeyGenApiKey(apiKey: string, metadata?: { email?: string; plan?: string; quota?: string | number }) {
  const current = getStoredHeyGenStatus();
  const updated = {
    apiKey: apiKey.trim(),
    accountEmail: metadata?.email || current.accountEmail || '',
    plan: metadata?.plan || 'HeyGen Pro',
    quota: metadata?.quota || 'Active',
  };
  localStorage.setItem(STORAGE_KEY_HEYGEN, JSON.stringify(updated));
}

export function clearHeyGenConnection() {
  localStorage.removeItem(STORAGE_KEY_HEYGEN);
}

export function saveGoogleUser(user: { email: string; name: string; picture?: string }) {
  localStorage.setItem(STORAGE_KEY_GOOGLE, JSON.stringify(user));
}

export function clearGoogleUser() {
  localStorage.removeItem(STORAGE_KEY_GOOGLE);
}

// 1. Verify HeyGen Connection
export async function testHeyGenConnection(apiKey: string): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    const res = await fetch('/api/heygen/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    const json = await res.json();
    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error testing HeyGen connection';
    return { success: false, message };
  }
}

const STORAGE_KEY_CUSTOM_AVATARS = 'hyperframes_custom_avatars_v1';

export function getCustomAvatars(): HeyGenAvatar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_AVATARS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomAvatar(avatar: HeyGenAvatar) {
  const current = getCustomAvatars();
  const filtered = current.filter((a) => a.avatar_id !== avatar.avatar_id);
  const updated = [{ ...avatar, is_custom: true, tag: 'My Custom Avatar' }, ...filtered];
  localStorage.setItem(STORAGE_KEY_CUSTOM_AVATARS, JSON.stringify(updated));
  return updated;
}

export function deleteCustomAvatar(avatarId: string) {
  const current = getCustomAvatars();
  const updated = current.filter((a) => a.avatar_id !== avatarId);
  localStorage.setItem(STORAGE_KEY_CUSTOM_AVATARS, JSON.stringify(updated));
  return updated;
}

// 2. Fetch Avatars (merges user's custom avatars with live account/curated avatars)
export async function getAvatars(apiKey?: string): Promise<HeyGenAvatar[]> {
  const customList = getCustomAvatars();
  try {
    const res = await fetch('/api/heygen/avatars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || '' }),
    });
    const json = await res.json();
    const fetched: HeyGenAvatar[] = json.avatars || [];

    // Deduplicate against custom avatars
    const existingIds = new Set(customList.map((a) => a.avatar_id));
    const nonDuplicates = fetched.filter((a) => !existingIds.has(a.avatar_id));

    return [...customList, ...nonDuplicates];
  } catch (e) {
    console.error('Failed to load avatars:', e);
    return customList;
  }
}

// 3. Fetch Voices
export async function getVoices(apiKey?: string): Promise<HeyGenVoice[]> {
  try {
    const res = await fetch('/api/heygen/voices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || '' }),
    });
    const json = await res.json();
    return json.voices || [];
  } catch (e) {
    console.error('Failed to load voices:', e);
    return [];
  }
}

// 4. Request Video Generation from HeyGen API
export async function renderHeyGenVideo(params: {
  apiKey?: string;
  avatarId: string;
  voiceId?: string;
  inputText: string;
  title?: string;
  style?: string;
  dimension?: { width: number; height: number };
}): Promise<{ success: boolean; videoId?: string; isLive?: boolean; message?: string; data?: unknown }> {
  try {
    const res = await fetch('/api/heygen/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to call HeyGen render API';
    return { success: false, message };
  }
}

// 5. Poll HeyGen Video Status
export async function checkHeyGenStatus(videoId: string, apiKey?: string): Promise<{
  success: boolean;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  progress?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/heygen/status/${videoId}`, {
      headers: {
        'x-api-key': apiKey || '',
      },
    });
    return await res.json();
  } catch (e) {
    return { success: false, status: 'failed', error: String(e) };
  }
}
