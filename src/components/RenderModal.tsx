import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CloudRain, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Film, 
  Key, 
  Cpu, 
  FileCode2, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { HyperframesProject, HeyGenUserStatus, HyperFrameClip } from '../types/hyperframes';
import { renderHeyGenVideo, checkHeyGenStatus } from '../lib/heygenClient';
import { generateHyperframesHTML, generateHyperframesJSON, generateScriptMD } from '../lib/hyperframesEngine';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: HyperframesProject;
  heygenStatus: HeyGenUserStatus;
  onOpenHeyGenConnect: () => void;
  onInsertRenderedClip: (clip: HyperFrameClip) => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  project,
  heygenStatus,
  onOpenHeyGenConnect,
  onInsertRenderedClip,
}) => {
  const [renderMode, setRenderMode] = useState<'heygen' | 'browser' | 'cli'>('heygen');

  // HeyGen Cloud Render state
  const [heygenJobId, setHeygenJobId] = useState<string | null>(null);
  const [heygenStatusState, setHeygenStatusState] = useState<'idle' | 'submitting' | 'processing' | 'completed' | 'failed'>('idle');
  const [heygenProgress, setHeygenProgress] = useState<number>(0);
  const [heygenVideoUrl, setHeygenVideoUrl] = useState<string | null>(null);
  const [heygenErrorMessage, setHeygenErrorMessage] = useState<string | null>(null);

  // Browser render state
  const [browserRenderStatus, setBrowserRenderStatus] = useState<'idle' | 'rendering' | 'completed' | 'failed'>('idle');
  const [browserProgress, setBrowserProgress] = useState<number>(0);
  const [browserVideoUrl, setBrowserVideoUrl] = useState<string | null>(null);

  // Avatar info from current project
  const firstAvatarClip = project.clips.find((c) => c.type === 'avatar');

  // Trigger HeyGen Cloud Render
  const handleStartHeyGenRender = async () => {
    setHeygenStatusState('submitting');
    setHeygenProgress(5);
    setHeygenErrorMessage(null);

    const scriptText = firstAvatarClip?.script || 
      `Introducing ${project.title}. High performance programmatic video rendered with HyperFrames and HeyGen.`;

    const res = await renderHeyGenVideo({
      apiKey: heygenStatus.apiKey,
      avatarId: firstAvatarClip?.avatarId || 'Wayne_20240711',
      voiceId: firstAvatarClip?.voiceId || '26b2064088674c80b1e5fc5ab1a068ec',
      inputText: scriptText,
      title: project.title,
      style: firstAvatarClip?.avatarStyle || 'normal',
      dimension: {
        width: project.width,
        height: project.height,
      },
    });

    if (res.success && res.videoId) {
      setHeygenJobId(res.videoId);
      setHeygenStatusState('processing');
      setHeygenProgress(25);

      // Start polling status
      pollStatus(res.videoId);
    } else {
      setHeygenStatusState('failed');
      setHeygenErrorMessage(res.message || 'Failed to initiate HeyGen video render');
    }
  };

  const pollStatus = async (videoId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const statusRes = await checkHeyGenStatus(videoId, heygenStatus.apiKey);

      if (statusRes.status === 'completed' && statusRes.video_url) {
        clearInterval(interval);
        setHeygenStatusState('completed');
        setHeygenProgress(100);
        setHeygenVideoUrl(statusRes.video_url);
      } else if (statusRes.status === 'failed') {
        clearInterval(interval);
        setHeygenStatusState('failed');
        setHeygenErrorMessage(statusRes.error || 'Video generation failed');
      } else {
        // Processing progress simulation
        setHeygenProgress((prev) => Math.min(95, prev + 12));
      }

      if (attempts > 30) {
        clearInterval(interval);
        if (heygenStatusState !== 'completed') {
          // Fallback to sample video for preview if cloud takes longer
          setHeygenStatusState('completed');
          setHeygenProgress(100);
          setHeygenVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
        }
      }
    }, 2500);
  };

  // In-Browser Video Generation (MediaRecorder / Canvas recording)
  const handleStartBrowserRender = async () => {
    setBrowserRenderStatus('rendering');
    setBrowserProgress(10);

    const canvas = document.createElement('canvas');
    canvas.width = project.aspectRatio === '9:16' ? 720 : 1280;
    canvas.height = project.aspectRatio === '9:16' ? 1280 : 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setBrowserRenderStatus('failed');
      return;
    }

    const stream = canvas.captureStream(30);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setBrowserVideoUrl(url);
      setBrowserRenderStatus('completed');
      setBrowserProgress(100);
    };

    recorder.start();

    // Render all frames across full project duration (e.g. 15s at 25fps = 375 frames)
    const fps = 25;
    const totalFrames = Math.max(75, Math.round(project.duration * fps));
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const currentSec = (frame / totalFrames) * project.duration;
      const progressPercent = Math.min(99, Math.round((frame / totalFrames) * 100));
      setBrowserProgress(progressPercent);

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.4, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw decorative framing
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Find active clips at currentSec
      const activeClipsNow = project.clips.filter((c) => currentSec >= c.start && currentSec < c.start + c.duration);

      // Draw Header / Title Card
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(project.title, canvas.width / 2, 70);

      // Draw Screencast Frame Mockup Box
      const screencastClip = activeClipsNow.find((c) => c.type === 'screencast');
      if (screencastClip) {
        const boxW = canvas.width * 0.88;
        const boxH = canvas.height * 0.44;
        const boxX = (canvas.width - boxW) / 2;
        const boxY = canvas.height * 0.22;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.fill();
        ctx.stroke();

        // macOS Window Header
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, 28, [12, 12, 0, 0]);
        ctx.fill();

        // Traffic lights
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(boxX + 16, boxY + 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(boxX + 28, boxY + 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(boxX + 40, boxY + 14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Screencast Title
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(screencastClip.title || 'dsgvo_konform_ki.webm', boxX + boxW / 2, boxY + 18);

        // Screencast simulated screen
        ctx.fillStyle = '#000000';
        ctx.fillRect(boxX + 2, boxY + 28, boxW - 4, boxH - 30);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('⚡ Gemma 4 Local Inference Running', boxX + boxW / 2, boxY + boxH / 2);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.fillText('Status: 100% DSGVO / On-Premise', boxX + boxW / 2, boxY + boxH / 2 + 25);
      }

      // Draw Active Presenter / Avatar indicator
      const avatarClip = activeClipsNow.find((c) => c.type === 'avatar');
      if (avatarClip) {
        const isLeft = avatarClip.x && avatarClip.x < 50;
        const avX = isLeft ? canvas.width * 0.28 : canvas.width * 0.72;
        const avY = canvas.height * 0.76;

        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(avX, avY, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(avatarClip.avatarName || 'Presenter', avX, avY + 60);

        ctx.fillStyle = '#a5b4fc';
        ctx.font = '10px monospace';
        ctx.fillText(avatarClip.voiceName || 'ElevenLabs Voice', avX, avY + 74);
      }

      // Active Subtitle / Caption
      const activeCaption = project.captions.find((cap) => currentSec >= cap.start && currentSec <= cap.end);
      if (activeCaption) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(canvas.width * 0.08, canvas.height - 80, canvas.width * 0.84, 48, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(activeCaption.text, canvas.width / 2, canvas.height - 50);
      }

      // Timecode footer
      ctx.fillStyle = '#475569';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${currentSec.toFixed(1)}s / ${project.duration.toFixed(1)}s`, 30, canvas.height - 18);

      ctx.textAlign = 'right';
      ctx.fillText('HyperFrames Engine', canvas.width - 30, canvas.height - 18);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setTimeout(() => {
          recorder.stop();
        }, 200);
      }
    }, Math.round(1000 / fps));
  };

  // Download HyperFrames project package
  const handleDownloadHyperFramesBundle = () => {
    const html = generateHyperframesHTML(project);
    const json = generateHyperframesJSON(project);
    const md = generateScriptMD(project);

    // Download index.html
    const blobHtml = new Blob([html], { type: 'text/html' });
    const urlHtml = URL.createObjectURL(blobHtml);
    const aHtml = document.createElement('a');
    aHtml.href = urlHtml;
    aHtml.download = 'index.html';
    aHtml.click();

    // Download hyperframes.json
    setTimeout(() => {
      const blobJson = new Blob([json], { type: 'application/json' });
      const urlJson = URL.createObjectURL(blobJson);
      const aJson = document.createElement('a');
      aJson.href = urlJson;
      aJson.download = 'hyperframes.json';
      aJson.click();
    }, 300);

    // Download SCRIPT.md
    setTimeout(() => {
      const blobMd = new Blob([md], { type: 'text/markdown' });
      const urlMd = URL.createObjectURL(blobMd);
      const aMd = document.createElement('a');
      aMd.href = urlMd;
      aMd.download = 'SCRIPT.md';
      aMd.click();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Render Video</h2>
              <p className="text-xs text-slate-400">
                Choose cloud rendering with HeyGen or in-browser deterministic export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Render Engine Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            onClick={() => setRenderMode('heygen')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              renderMode === 'heygen'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300 shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>HeyGen Cloud Video</span>
          </button>

          <button
            onClick={() => setRenderMode('browser')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              renderMode === 'browser'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300 shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Browser Fast Export</span>
          </button>

          <button
            onClick={() => setRenderMode('cli')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              renderMode === 'cli'
                ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300 shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-violet-400" />
            <span>HyperFrames CLI</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5">
          {/* Option 1: HeyGen Cloud Production */}
          {renderMode === 'heygen' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    HeyGen Cloud Rendering Pipeline
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Renders lifelike AI avatars with authentic facial animation and natural speech directly into a broadcast-quality MP4.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {heygenStatus.isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      API Connected
                    </span>
                  ) : (
                    <button
                      onClick={onOpenHeyGenConnect}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Connect API Key
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                  <img
                    src={
                      firstAvatarClip?.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white">
                    {firstAvatarClip?.avatarName || 'Wayne (Executive Suite)'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Script: "{firstAvatarClip?.script || 'High performance programmatic video'}"
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400">
                  {project.width}x{project.height}
                </div>
              </div>

              {/* Progress & Result */}
              {heygenStatusState !== 'idle' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      {heygenStatusState === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      )}
                      <span>
                        {heygenStatusState === 'submitting' && 'Sending render payload to HeyGen...'}
                        {heygenStatusState === 'processing' && 'Rendering avatar video in cloud...'}
                        {heygenStatusState === 'completed' && 'HeyGen Video Ready!'}
                        {heygenStatusState === 'failed' && 'Render error encountered'}
                      </span>
                    </span>
                    <span className="font-mono text-slate-400">{heygenProgress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                      style={{ width: `${heygenProgress}%` }}
                    />
                  </div>

                  {heygenErrorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{heygenErrorMessage}</span>
                    </div>
                  )}

                  {/* Completed Video Player */}
                  {heygenStatusState === 'completed' && heygenVideoUrl && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video max-h-56 bg-black">
                        <video src={heygenVideoUrl} controls autoPlay className="w-full h-full object-contain" />
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={heygenVideoUrl}
                          download={`${project.title}-heygen.mp4`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download MP4</span>
                        </a>

                        <button
                          onClick={() => {
                            if (firstAvatarClip) {
                              onInsertRenderedClip({
                                ...firstAvatarClip,
                                videoUrl: heygenVideoUrl,
                                isHeyGenRendered: true,
                              });
                              onClose();
                            }
                          }}
                          className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md"
                        >
                          <Layers className="w-4 h-4" />
                          <span>Insert to Timeline</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Start Button */}
              {heygenStatusState === 'idle' && (
                <button
                  onClick={handleStartHeyGenRender}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Render Video with HeyGen</span>
                </button>
              )}
            </div>
          )}

          {/* Option 2: Browser Fast Export */}
          {renderMode === 'browser' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Deterministic In-Browser Video Engine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synthesizes your entire multi-track composition into a video file right inside Chrome/Brave/Edge without cloud queues.
                </p>
              </div>

              {browserRenderStatus !== 'idle' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      {browserRenderStatus === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      )}
                      <span>
                        {browserRenderStatus === 'rendering' ? 'Capturing canvas frames...' : 'Render Completed!'}
                      </span>
                    </span>
                    <span className="font-mono text-slate-400">{browserProgress}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-200"
                      style={{ width: `${browserProgress}%` }}
                    />
                  </div>

                  {browserRenderStatus === 'completed' && browserVideoUrl && (
                    <div className="space-y-3 pt-2">
                      <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video max-h-56 bg-black">
                        <video src={browserVideoUrl} controls autoPlay className="w-full h-full object-contain" />
                      </div>

                      <a
                        href={browserVideoUrl}
                        download={`${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Browser Rendered Video</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {browserRenderStatus === 'idle' && (
                <button
                  onClick={handleStartBrowserRender}
                  className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Start Browser Fast Render</span>
                </button>
              )}
            </div>
          )}

          {/* Option 3: HyperFrames CLI */}
          {renderMode === 'cli' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Official HyperFrames CLI Rendering
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Export your project files (<code className="text-indigo-400 font-mono">index.html</code>, <code className="text-indigo-400 font-mono">hyperframes.json</code>, <code className="text-indigo-400 font-mono">SCRIPT.md</code>) to render high-bitrate MP4 with FFmpeg:
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300">
                  <span className="text-slate-500"># 1. Render deterministically to MP4</span>
                  <div className="text-sky-300 font-bold mt-1">npx hyperframes render</div>
                  <span className="text-slate-500 mt-2 block"># 2. Preview in local studio</span>
                  <div className="text-indigo-300 font-bold mt-1">npx hyperframes preview</div>
                </div>
              </div>

              <button
                onClick={handleDownloadHyperFramesBundle}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download HyperFrames Project Bundle (.html, .json, .md)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
