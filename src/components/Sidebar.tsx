import React, { useState, useEffect, useRef } from 'react';
import { 
  MonitorPlay, 
  Upload, 
  Video, 
  UserCheck, 
  Mic2, 
  Palette, 
  Wand2, 
  Sparkles, 
  PlusCircle, 
  Loader2, 
  Check, 
  Play, 
  Layers, 
  MousePointer, 
  Search, 
  Radio, 
  FileVideo, 
  Tag, 
  ExternalLink,
  Maximize2,
  Columns,
  AppWindow,
  Volume2,
  RefreshCw,
  HelpCircle,
  Trash2,
  Plus
} from 'lucide-react';
import { 
  HyperframesProject, 
  HyperFrameClip, 
  HeyGenAvatar, 
  HeyGenVoice, 
  ScreencastAsset, 
  ScreencastLayout,
  ElevenLabsVoice,
  ElevenLabsStatus,
  CanvaAsset
} from '../types/hyperframes';
import { 
  getAvatars, 
  getVoices, 
  saveCustomAvatar, 
  deleteCustomAvatar 
} from '../lib/heygenClient';
import { 
  fetchScreencastAssets, 
  uploadScreencastFile, 
  startBrowserScreenCapture,
  fetchElevenLabsVoices,
  generateElevenLabsVoiceover,
  saveCustomVoice,
  deleteCustomVoice,
  fetchCanvaAssets
} from '../lib/integrationsClient';

interface SidebarProps {
  currentProject: HyperframesProject;
  onLoadTemplate: (template: HyperframesProject) => void;
  onAddClip: (clip: HyperFrameClip) => void;
  currentTime: number;
  heygenApiKey: string;
  elevenLabsApiKey?: string;
  elevenLabsStatus?: ElevenLabsStatus;
  onOpenIntegrations: (tab: 'heygen' | 'kie' | 'canva' | 'elevenlabs') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
  onLoadTemplate,
  onAddClip,
  currentTime,
  heygenApiKey,
  elevenLabsApiKey,
  elevenLabsStatus,
  onOpenIntegrations,
}) => {
  const [activeTab, setActiveTab] = useState<'screencasts' | 'avatars' | 'voiceover' | 'canva' | 'ai'>('screencasts');
  
  // Screencast Assets state
  const [screencasts, setScreencasts] = useState<ScreencastAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingScreen, setIsRecordingScreen] = useState(false);
  const [selectedScreencast, setSelectedScreencast] = useState<ScreencastAsset | null>(null);
  const [screencastLayout, setScreencastLayout] = useState<ScreencastLayout>('window');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HeyGen Avatars state
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
  const [heygenVoices, setHeygenVoices] = useState<HeyGenVoice[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<HeyGenAvatar | null>(null);
  const [selectedHeygenVoice, setSelectedHeygenVoice] = useState<HeyGenVoice | null>(null);
  const [avatarScript, setAvatarScript] = useState<string>(
    'In this screencast, let us explore the workflow and key features step by step.'
  );
  const [avatarStyle, setAvatarStyle] = useState<'normal' | 'circle' | 'close_up'>('circle');
  const [avatarFilter, setAvatarFilter] = useState<'all' | 'custom' | 'stock'>('all');
  const [isAddingAvatar, setIsAddingAvatar] = useState(false);
  const [customAvatarName, setCustomAvatarName] = useState('');
  const [customAvatarId, setCustomAvatarId] = useState('');
  const [customAvatarPhoto, setCustomAvatarPhoto] = useState('');
  const [isSyncingHeyGen, setIsSyncingHeyGen] = useState(false);

  // ElevenLabs Voiceover state
  const [elevenVoices, setElevenVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedElevenVoiceId, setSelectedElevenVoiceId] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [voScript, setVoScript] = useState<string>(
    'Here is the complete demo of our system in action, showcasing live updates and speed.'
  );
  const [isGeneratingVO, setIsGeneratingVO] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'custom' | 'premade'>('all');
  const [isAddingVoice, setIsAddingVoice] = useState(false);
  const [customVoiceName, setCustomVoiceName] = useState('');
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [isSyncingEleven, setIsSyncingEleven] = useState(false);

  // Canva state
  const [canvaAssets, setCanvaAssets] = useState<CanvaAsset[]>([]);

  // AI Prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Load screencasts on mount
  useEffect(() => {
    let isMounted = true;
    const loadAssets = async () => {
      const [scList, avList, hvList, evList, cvList] = await Promise.all([
        fetchScreencastAssets(),
        getAvatars(heygenApiKey),
        getVoices(heygenApiKey),
        fetchElevenLabsVoices(elevenLabsApiKey),
        fetchCanvaAssets(),
      ]);

      if (isMounted) {
        setScreencasts(scList);
        if (scList.length > 0) setSelectedScreencast(scList[0]);
        setAvatars(avList);
        if (avList.length > 0) setSelectedAvatar(avList[0]);
        setHeygenVoices(hvList);
        if (hvList.length > 0) setSelectedHeygenVoice(hvList[0]);
        setElevenVoices(evList);
        if (evList.length > 0) setSelectedElevenVoiceId(evList[0].voice_id);
        setCanvaAssets(cvList);
      }
    };
    loadAssets();
    return () => { isMounted = false; };
  }, [heygenApiKey, elevenLabsApiKey]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newAsset = await uploadScreencastFile(file);
      if (newAsset) {
        setScreencasts((prev) => [newAsset, ...prev]);
        setSelectedScreencast(newAsset);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Live Browser Screen Recording
  const handleToggleScreenRecord = async () => {
    if (isRecordingScreen) return;

    try {
      setIsRecordingScreen(true);
      const { stream, stop } = await startBrowserScreenCapture();

      // Listen for stream stop by user browser bar
      stream.getVideoTracks()[0].onended = async () => {
        const recordedBlob = await stop();
        setIsRecordingScreen(false);
        const file = new File([recordedBlob], `screencast_rec_${Date.now()}.webm`, { type: 'video/webm' });
        const newAsset = await uploadScreencastFile(file);
        if (newAsset) {
          setScreencasts((prev) => [newAsset, ...prev]);
          setSelectedScreencast(newAsset);
        }
      };
    } catch (err) {
      setIsRecordingScreen(false);
      console.error('Screen recording cancelled or failed:', err);
    }
  };

  // Insert Screencast into Timeline
  const handleInsertScreencast = () => {
    if (!selectedScreencast) return;

    const timestamp = Date.now();
    let width = 75;
    let height = 75;
    let x = 50;
    let y = 50;

    if (screencastLayout === 'split') {
      width = 58;
      height = 75;
      x = 34;
      y = 50;
    } else if (screencastLayout === 'fullscreen') {
      width = 100;
      height = 100;
      x = 50;
      y = 50;
    } else if (screencastLayout === 'window') {
      width = 78;
      height = 80;
      x = 50;
      y = 50;
    }

    const screencastClip: HyperFrameClip = {
      id: `sc_${timestamp}`,
      name: selectedScreencast.name,
      type: 'screencast',
      start: Math.round(currentTime * 10) / 10,
      duration: selectedScreencast.duration || 10.0,
      trackIndex: 0,
      title: selectedScreencast.name,
      screencastUrl: selectedScreencast.url,
      screencastFileName: selectedScreencast.name,
      screencastLayout: screencastLayout,
      animation: 'zoomIn',
      x,
      y,
      width,
      height,
    };

    onAddClip(screencastClip);

    // If split layout or window layout, also add an avatar presenter in the corner to make it engaging!
    if (selectedAvatar && (screencastLayout === 'split' || screencastLayout === 'window')) {
      const avatarClip: HyperFrameClip = {
        id: `avatar_${timestamp}`,
        name: `${selectedAvatar.avatar_name} (Explaining)`,
        type: 'avatar',
        start: Math.round(currentTime * 10) / 10,
        duration: Math.min(8.0, selectedScreencast.duration || 10.0),
        trackIndex: 1,
        avatarId: selectedAvatar.avatar_id,
        avatarName: selectedAvatar.avatar_name,
        avatarStyle: 'circle',
        voiceId: selectedHeygenVoice?.voice_id || '26b2064088674c80b1e5fc5ab1a068ec',
        voiceName: selectedHeygenVoice?.name || 'Rex',
        script: avatarScript,
        videoUrl: selectedAvatar.preview_video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: selectedAvatar.preview_image_url,
        animation: 'slideUp',
        x: screencastLayout === 'split' ? 82 : 82,
        y: screencastLayout === 'split' ? 50 : 75,
        width: screencastLayout === 'split' ? 32 : 28,
        height: screencastLayout === 'split' ? 55 : 38,
      };
      setTimeout(() => onAddClip(avatarClip), 100);
    }
  };

  // Add Screencast Callout (Click ripple or pointer)
  const handleAddCallout = (label: string, color: string) => {
    const calloutClip: HyperFrameClip = {
      id: `callout_${Date.now()}`,
      name: `Callout: ${label}`,
      type: 'callout',
      start: Math.round(currentTime * 10) / 10,
      duration: 3.0,
      trackIndex: 2,
      title: label,
      accentColor: color,
      animation: 'bounce',
      x: 50,
      y: 40,
    };
    onAddClip(calloutClip);
  };

  // Generate Voiceover with ElevenLabs
  const handleGenerateElevenLabsVO = async () => {
    if (!voScript.trim()) return;
    setIsGeneratingVO(true);

    try {
      const res = await generateElevenLabsVoiceover(voScript, selectedElevenVoiceId, elevenLabsApiKey);
      if (res.success && res.audioUrl) {
        // Add VO audio to composition track
        const newClip: HyperFrameClip = {
          id: `vo_${Date.now()}`,
          name: res.name || 'ElevenLabs Voiceover',
          type: 'text',
          start: Math.round(currentTime * 10) / 10,
          duration: 6.0,
          trackIndex: 2,
          title: 'ElevenLabs VO Active',
          subtitle: voScript.slice(0, 45) + '...',
          accentColor: '#ec4899',
          animation: 'fade',
          x: 50,
          y: 15,
        };
        onAddClip(newClip);
      }
    } catch (e) {
      console.error('VO generation error:', e);
    } finally {
      setIsGeneratingVO(false);
    }
  };

  return (
    <aside className="w-84 border-r border-slate-800 bg-slate-950 flex flex-col z-20 shrink-0 select-none">
      {/* Primary Tabs */}
      <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-900/60 p-1">
        {/* 1. Screencasts */}
        <button
          onClick={() => setActiveTab('screencasts')}
          className={`py-2 px-1 text-[11px] font-semibold rounded-md flex flex-col items-center gap-1 transition-all ${
            activeTab === 'screencasts'
              ? 'bg-slate-800 text-sky-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Screencast Assets & Uploads"
        >
          <MonitorPlay className="w-4 h-4 text-sky-400" />
          <span>Screen</span>
        </button>

        {/* 2. HeyGen Avatars */}
        <button
          onClick={() => setActiveTab('avatars')}
          className={`py-2 px-1 text-[11px] font-semibold rounded-md flex flex-col items-center gap-1 transition-all ${
            activeTab === 'avatars'
              ? 'bg-slate-800 text-indigo-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="HeyGen Avatars"
        >
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span>Avatars</span>
        </button>

        {/* 3. ElevenLabs VO */}
        <button
          onClick={() => setActiveTab('voiceover')}
          className={`py-2 px-1 text-[11px] font-semibold rounded-md flex flex-col items-center gap-1 transition-all ${
            activeTab === 'voiceover'
              ? 'bg-slate-800 text-pink-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="ElevenLabs Voiceover"
        >
          <Mic2 className="w-4 h-4 text-pink-400" />
          <span>VO</span>
        </button>

        {/* 4. Canva Graphics */}
        <button
          onClick={() => setActiveTab('canva')}
          className={`py-2 px-1 text-[11px] font-semibold rounded-md flex flex-col items-center gap-1 transition-all ${
            activeTab === 'canva'
              ? 'bg-slate-800 text-teal-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Canva Design Assets"
        >
          <Palette className="w-4 h-4 text-teal-400" />
          <span>Canva</span>
        </button>

        {/* 5. AI Storyboard */}
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-2 px-1 text-[11px] font-semibold rounded-md flex flex-col items-center gap-1 transition-all ${
            activeTab === 'ai'
              ? 'bg-slate-800 text-violet-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="AI Director"
        >
          <Wand2 className="w-4 h-4 text-violet-400" />
          <span>AI Plan</span>
        </button>
      </div>

      {/* TAB 1: SCREENCASTS & UPLOADS */}
      {activeTab === 'screencasts' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header & Upload Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileVideo className="w-3.5 h-3.5 text-sky-400" />
                <span>Screencasts (Assets Folder)</span>
              </span>
              <span className="text-[10px] text-slate-400">{screencasts.length} files</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Upload Screencast File */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="py-2.5 px-3 rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Upload Cast</span>
              </button>

              {/* Record Screen in Browser */}
              <button
                onClick={handleToggleScreenRecord}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isRecordingScreen
                    ? 'border-rose-500 bg-rose-950 text-rose-300 animate-pulse'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <Radio className="w-4 h-4 text-rose-400" />
                <span>{isRecordingScreen ? 'Recording...' : 'Record Screen'}</span>
              </button>
            </div>
          </div>

          {/* Screencast Folder Asset Grid */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400">Select Screencast File</div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {screencasts.map((sc) => {
                const isSelected = selectedScreencast?.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScreencast(sc)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/40 shadow-md'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-black">
                      <img src={sc.thumbnailUrl} alt={sc.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{sc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {(sc.size / 1024 / 1024).toFixed(1)} MB · {sc.duration ? `${sc.duration}s` : 'Video'}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Screencast Layout Preset Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Screencast Layout & Frame
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setScreencastLayout('window')}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  screencastLayout === 'window'
                    ? 'border-sky-500 bg-sky-950/50 text-sky-300'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400'
                }`}
              >
                <AppWindow className="w-4 h-4" />
                <span>macOS Window</span>
              </button>

              <button
                onClick={() => setScreencastLayout('split')}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  screencastLayout === 'split'
                    ? 'border-sky-500 bg-sky-950/50 text-sky-300'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400'
                }`}
              >
                <Columns className="w-4 h-4" />
                <span>Split + Host</span>
              </button>

              <button
                onClick={() => setScreencastLayout('fullscreen')}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  screencastLayout === 'fullscreen'
                    ? 'border-sky-500 bg-sky-950/50 text-sky-300'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                <span>Hero Backdrop</span>
              </button>
            </div>
          </div>

          {/* Insert Screencast CTA */}
          <button
            onClick={handleInsertScreencast}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Screencast to Timeline</span>
          </button>

          {/* Interactive Callouts */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Screencast Callouts & Spotlights
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddCallout('Click Here', '#38bdf8')}
                className="p-2 rounded-xl border border-slate-800 hover:border-sky-500 bg-slate-900 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <MousePointer className="w-3.5 h-3.5 text-sky-400" />
                <span>Click Ripple</span>
              </button>
              <button
                onClick={() => handleAddCallout('Key Feature', '#10b981')}
                className="p-2 rounded-xl border border-slate-800 hover:border-emerald-500 bg-slate-900 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Feature Pill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HEYGEN AVATARS */}
      {activeTab === 'avatars' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Header & Sync */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                HeyGen AI Avatars
              </span>
              <span className="text-[10px] text-slate-400">
                {avatars.filter((a) => a.is_custom).length} Custom · {avatars.length} Total
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={async () => {
                  setIsSyncingHeyGen(true);
                  const fresh = await getAvatars(heygenApiKey);
                  setAvatars(fresh);
                  setIsSyncingHeyGen(false);
                }}
                disabled={isSyncingHeyGen}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition-all"
                title="Sync and refresh avatars from HeyGen account"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingHeyGen ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="text-[10px] hidden sm:inline">Sync</span>
              </button>

              <button
                onClick={() => setIsAddingAvatar((v) => !v)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isAddingAvatar
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
                title="Add Custom Avatar / Instant Avatar ID"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px]">Add Custom</span>
              </button>
            </div>
          </div>

          {/* Add Custom Avatar Form (Collapsible) */}
          {isAddingAvatar && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/40 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Add My Custom Avatar</span>
                <button onClick={() => setIsAddingAvatar(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-0.5">Avatar / Look Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Custom Digital Twin"
                  value={customAvatarName}
                  onChange={(e) => setCustomAvatarName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-0.5">
                  HeyGen Avatar ID or Look ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. avatar_look_xxxx or custom_twin_1"
                  value={customAvatarId}
                  onChange={(e) => setCustomAvatarId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-indigo-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-0.5">Photo Preview URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={customAvatarPhoto}
                  onChange={(e) => setCustomAvatarPhoto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (!customAvatarId.trim()) return;
                    const newAvatar: HeyGenAvatar = {
                      avatar_id: customAvatarId.trim(),
                      avatar_name: customAvatarName.trim() || 'My Custom Avatar',
                      gender: 'custom',
                      preview_image_url: customAvatarPhoto.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
                      preview_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                      styles: ['normal', 'circle', 'close_up'],
                      is_custom: true,
                      tag: 'My Custom Avatar',
                    };
                    const updated = saveCustomAvatar(newAvatar);
                    setAvatars(updated);
                    setSelectedAvatar(newAvatar);
                    setIsAddingAvatar(false);
                    setCustomAvatarName('');
                    setCustomAvatarId('');
                    setCustomAvatarPhoto('');
                  }}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                >
                  Save to My Avatars
                </button>
              </div>

              <p className="text-[9px] text-slate-400">
                Tip: Copy the Avatar ID or Look ID from your HeyGen dashboard under <em>Avatars &gt; Instant Avatars</em>.
              </p>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setAvatarFilter('all')}
              className={`flex-1 py-1 text-[10px] font-semibold rounded transition-all ${
                avatarFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({avatars.length})
            </button>
            <button
              onClick={() => setAvatarFilter('custom')}
              className={`flex-1 py-1 text-[10px] font-semibold rounded flex items-center justify-center gap-1 transition-all ${
                avatarFilter === 'custom' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>★ My Custom</span>
              <span className="text-[9px] opacity-75">({avatars.filter((a) => a.is_custom).length})</span>
            </button>
            <button
              onClick={() => setAvatarFilter('stock')}
              className={`flex-1 py-1 text-[10px] font-semibold rounded transition-all ${
                avatarFilter === 'stock' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stock
            </button>
          </div>

          {/* Avatars Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {avatars
              .filter((a) => {
                if (avatarFilter === 'custom') return a.is_custom;
                if (avatarFilter === 'stock') return !a.is_custom;
                return true;
              })
              .map((avatar) => {
                const isSelected = selectedAvatar?.avatar_id === avatar.avatar_id;
                return (
                  <div
                    key={avatar.avatar_id}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center relative group ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 shadow-lg'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    {avatar.is_custom && (
                      <span className="absolute top-1.5 left-1.5 bg-indigo-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow">
                        Custom
                      </span>
                    )}

                    {avatar.is_custom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = deleteCustomAvatar(avatar.avatar_id);
                          setAvatars(updated);
                          if (selectedAvatar?.avatar_id === avatar.avatar_id) {
                            setSelectedAvatar(updated[0] || null);
                          }
                        }}
                        className="absolute top-1.5 right-1.5 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove custom avatar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-700 mb-1 mt-1">
                      <img src={avatar.preview_image_url} alt={avatar.avatar_name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-white truncate w-full">
                      {avatar.avatar_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                      {avatar.avatar_id.slice(0, 14)}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Script Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Presenter Narration Script
            </label>
            <textarea
              rows={3}
              value={avatarScript}
              onChange={(e) => setAvatarScript(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 resize-none leading-relaxed"
              placeholder="What should the avatar explain about this screencast?"
            />
          </div>

          <button
            onClick={() => {
              if (!selectedAvatar) return;
              const avatarClip: HyperFrameClip = {
                id: `avatar_${Date.now()}`,
                name: selectedAvatar.avatar_name,
                type: 'avatar',
                start: Math.round(currentTime * 10) / 10,
                duration: 6.0,
                trackIndex: 1,
                avatarId: selectedAvatar.avatar_id,
                avatarName: selectedAvatar.avatar_name,
                avatarStyle: avatarStyle,
                voiceId: selectedHeygenVoice?.voice_id || '26b2064088674c80b1e5fc5ab1a068ec',
                script: avatarScript,
                videoUrl: selectedAvatar.preview_video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                thumbnailUrl: selectedAvatar.preview_image_url,
                animation: 'zoomIn',
                x: 80,
                y: 75,
                width: 32,
                height: 40,
              };
              onAddClip(avatarClip);
            }}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Avatar Overlay</span>
          </button>
        </div>
      )}

      {/* TAB 3: ELEVENLABS VOICEOVER */}
      {activeTab === 'voiceover' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Header & Sync */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                ElevenLabs Voiceover
              </span>
              <span className="text-[10px] text-slate-400">
                {elevenVoices.filter((v) => v.is_cloned || v.category === 'cloned').length} Cloned · {elevenVoices.length} Total
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={async () => {
                  setIsSyncingEleven(true);
                  const fresh = await fetchElevenLabsVoices(elevenLabsApiKey);
                  setElevenVoices(fresh);
                  setIsSyncingEleven(false);
                }}
                disabled={isSyncingEleven}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition-all"
                title="Sync and refresh cloned voices from ElevenLabs account"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEleven ? 'animate-spin text-pink-400' : ''}`} />
                <span className="text-[10px] hidden sm:inline">Sync</span>
              </button>

              <button
                onClick={() => setIsAddingVoice((v) => !v)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isAddingVoice
                    ? 'border-pink-500 bg-pink-950/60 text-pink-300'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
                title="Add Cloned Voice ID from ElevenLabs VoiceLab"
              >
                <Plus className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px]">Add Cloned</span>
              </button>

              <button
                onClick={() => onOpenIntegrations('elevenlabs')}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                  elevenLabsStatus?.isGoogleLinked || elevenLabsStatus?.isConnected
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                    : 'text-pink-400 bg-pink-950/40 border-pink-800/40 hover:underline'
                }`}
              >
                {elevenLabsStatus?.isGoogleLinked ? 'Linked' : elevenLabsStatus?.isConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>

          {/* Collapsible Add Custom Voice Box */}
          {isAddingVoice && (
            <div className="p-3 rounded-xl border border-pink-500/40 bg-pink-950/20 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Add Cloned Voice ID</span>
                </span>
                <span className="text-[10px] text-pink-400/80">VoiceLab Clone</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Copy your custom Voice ID from{' '}
                <a
                  href="https://elevenlabs.io/app/voice-lab"
                  target="_blank"
                  rel="noreferrer"
                  className="text-pink-400 hover:underline inline-flex items-center gap-0.5"
                >
                  ElevenLabs VoiceLab <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                and paste below:
              </p>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Voice Name</label>
                <input
                  type="text"
                  value={customVoiceName}
                  onChange={(e) => setCustomVoiceName(e.target.value)}
                  placeholder="e.g. My Cloned Studio Voice"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Voice ID (20+ chars)</label>
                <input
                  type="text"
                  value={customVoiceId}
                  onChange={(e) => setCustomVoiceId(e.target.value)}
                  placeholder="e.g. 21m00Tcm4TlvDq8ikWAM or custom ID"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsAddingVoice(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!customVoiceName.trim() || !customVoiceId.trim()) return;
                    const updated = saveCustomVoice({
                      name: customVoiceName.trim(),
                      voice_id: customVoiceId.trim(),
                      category: 'cloned',
                      description: 'My VoiceLab Cloned Voice',
                      is_cloned: true,
                    });
                    setElevenVoices(updated);
                    setSelectedElevenVoiceId(customVoiceId.trim());
                    setCustomVoiceName('');
                    setCustomVoiceId('');
                    setIsAddingVoice(false);
                  }}
                  className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                >
                  Save Cloned Voice
                </button>
              </div>
            </div>
          )}

          {/* Voice Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setVoiceFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                voiceFilter === 'all'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({elevenVoices.length})
            </button>
            <button
              onClick={() => setVoiceFilter('custom')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                voiceFilter === 'custom'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>★ My Cloned Voices</span>
              <span className="text-[10px] px-1 py-0.2 bg-pink-900/60 rounded-full">
                {elevenVoices.filter((v) => v.is_cloned || v.category === 'cloned').length}
              </span>
            </button>
            <button
              onClick={() => setVoiceFilter('premade')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                voiceFilter === 'premade'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Premade ({elevenVoices.filter((v) => !v.is_cloned && v.category !== 'cloned').length})
            </button>
          </div>

          {/* Voices Visual Grid / Selector */}
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {elevenVoices
              .filter((v) => {
                if (voiceFilter === 'custom') return v.is_cloned || v.category === 'cloned';
                if (voiceFilter === 'premade') return !v.is_cloned && v.category !== 'cloned';
                return true;
              })
              .map((voice) => {
                const isSelected = selectedElevenVoiceId === voice.voice_id;
                const isCloned = voice.is_cloned || voice.category === 'cloned';
                return (
                  <div
                    key={voice.voice_id}
                    onClick={() => setSelectedElevenVoiceId(voice.voice_id)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all relative group flex flex-col justify-between ${
                      isSelected
                        ? 'border-pink-500 bg-pink-950/40 shadow-md ring-1 ring-pink-500/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    {isCloned && (
                      <span className="absolute top-1.5 right-1.5 bg-pink-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow">
                        Cloned
                      </span>
                    )}

                    {voice.is_cloned && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = deleteCustomVoice(voice.voice_id);
                          setElevenVoices(updated);
                          if (selectedElevenVoiceId === voice.voice_id) {
                            setSelectedElevenVoiceId(updated[0]?.voice_id || '');
                          }
                        }}
                        className="absolute bottom-1.5 right-1.5 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove custom voice"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Volume2 className={`w-3.5 h-3.5 ${isSelected ? 'text-pink-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">
                          {voice.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {voice.category} {voice.accent ? `· ${voice.accent}` : ''}
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-slate-500 truncate mt-1">
                      {voice.voice_id.slice(0, 12)}...
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Voiceover Script */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Voiceover Narration Script
            </label>
            <textarea
              rows={3}
              value={voScript}
              onChange={(e) => setVoScript(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 resize-none leading-relaxed"
              placeholder="Enter voiceover script for ElevenLabs TTS..."
            />
          </div>

          <button
            onClick={handleGenerateElevenLabsVO}
            disabled={isGeneratingVO}
            className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGeneratingVO ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing VO with ElevenLabs...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Generate Voiceover Audio</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* TAB 4: CANVA GRAPHICS */}
      {activeTab === 'canva' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-400" />
              <span>Canva Design Assets</span>
            </label>
            <button
              onClick={() => onOpenIntegrations('canva')}
              className="text-[10px] text-teal-400 hover:underline"
            >
              Connect Email &gt;
            </button>
          </div>

          <div className="space-y-2.5">
            {canvaAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  const clip: HyperFrameClip = {
                    id: `canva_${Date.now()}`,
                    name: asset.title,
                    type: 'card',
                    start: Math.round(currentTime * 10) / 10,
                    duration: 4.0,
                    trackIndex: 2,
                    title: asset.title,
                    content: 'Imported from Canva Studio',
                    accentColor: '#14b8a6',
                    animation: 'slideUp',
                    x: 50,
                    y: 78,
                    width: 70,
                    height: 25,
                  };
                  onAddClip(clip);
                }}
                className="p-2.5 rounded-xl border border-slate-800 hover:border-teal-500/50 bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-all flex items-center gap-3 group"
              >
                <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                  <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white group-hover:text-teal-300 truncate">
                    {asset.title}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{asset.type}</div>
                </div>
                <PlusCircle className="w-4 h-4 text-slate-500 group-hover:text-teal-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI DIRECTOR */}
      {activeTab === 'ai' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gradient-to-br from-indigo-950/60 to-violet-950/60 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Screencast Director</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Describe what happens in your screencast. Gemini AI will structure the scene transitions, avatar talking points, and kinetic callouts.
            </p>

            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. My screencast shows how to build a Next.js app in 2 minutes. Add an energetic AI avatar intro and a callout highlighting the terminal."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 resize-none leading-relaxed mb-3"
            />

            <button
              onClick={async () => {
                if (!aiPrompt.trim()) return;
                setIsGeneratingAI(true);
                try {
                  const res = await fetch('/api/ai/generate-composition', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: aiPrompt, duration: currentProject.duration }),
                  });
                  const data = await res.json();
                  if (data.success && data.composition) {
                    onLoadTemplate({
                      ...currentProject,
                      title: data.composition.title || currentProject.title,
                      clips: (data.composition.clips || []).map((c: any, i: number) => ({
                        id: `ai_${i}_${Date.now()}`,
                        name: c.title || `Scene ${i + 1}`,
                        type: c.type || 'text',
                        start: c.start || i * 3.5,
                        duration: c.duration || 4,
                        trackIndex: c.track || 0,
                        title: c.title,
                        content: c.content,
                        accentColor: c.accentColor || '#38bdf8',
                        animation: c.animation || 'slideUp',
                        x: 50,
                        y: 50,
                      })),
                    });
                  }
                } finally {
                  setIsGeneratingAI(false);
                }
              }}
              disabled={isGeneratingAI || !aiPrompt.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span>Generate Storyboard</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
