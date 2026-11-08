import React, { useRef, useEffect } from 'react';
import { AspectRatio, HyperframesProject, HyperFrameClip } from '../types/hyperframes';
import { MousePointer, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface VideoCanvasProps {
  project: HyperframesProject;
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  showGuides: boolean;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  project,
  currentTime,
  isPlaying,
  selectedClipId,
  onSelectClip,
  showGuides,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter active clips at current time
  const activeClips = project.clips.filter((clip) => {
    return currentTime >= clip.start && currentTime < clip.start + clip.duration;
  });

  // Find active caption
  const activeCaption = project.captions.find(
    (cap) => currentTime >= cap.start && currentTime <= cap.end
  );

  // Sync video elements (screencasts and avatars) to exact frame
  useEffect(() => {
    const videoElements = containerRef.current?.querySelectorAll('video');
    if (!videoElements) return;

    videoElements.forEach((video) => {
      const clipId = video.getAttribute('data-clip-id');
      const clip = project.clips.find((c) => c.id === clipId);
      if (clip) {
        const localTime = Math.max(0, currentTime - clip.start);
        const clipDuration = clip.duration || 10;
        const targetTime = localTime % clipDuration;

        // Only seek if significantly out of sync or scrubbing (avoids frame stutter during smooth playback)
        if (!isPlaying || Math.abs(video.currentTime - targetTime) > 0.4) {
          if (isFinite(targetTime) && video.readyState >= 1) {
            video.currentTime = targetTime;
          }
        }

        if (isPlaying && video.paused) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      }
    });
  }, [currentTime, isPlaying, project.clips]);

  // Sync audio elements (voiceovers & background audio tracks)
  useEffect(() => {
    const audioElements = containerRef.current?.querySelectorAll('audio');
    if (!audioElements) return;

    audioElements.forEach((audio) => {
      const trackId = audio.getAttribute('data-track-id');
      const audioTrack = project.audioTracks.find((t) => t.id === trackId);
      if (audioTrack) {
        audio.volume = audioTrack.isMuted ? 0 : audioTrack.volume;
        if (!isPlaying || Math.abs(audio.currentTime - currentTime) > 0.4) {
          if (isFinite(currentTime) && audio.readyState >= 1) {
            audio.currentTime = Math.min(currentTime, audio.duration || currentTime);
          }
        }
        if (isPlaying && audio.paused && !audioTrack.isMuted) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else if (!isPlaying && !audio.paused) {
          audio.pause();
        }
      }
    });
  }, [currentTime, isPlaying, project.audioTracks]);

  // Compute aspect ratio dimensions
  const getAspectRatioClasses = (ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[82vh] max-w-[46vh]';
      case '1:1':
        return 'aspect-square max-h-[80vh] max-w-[80vh]';
      case '16:9':
      default:
        return 'aspect-video max-h-[78vh] w-full max-w-[1200px]';
    }
  };

  // Compute animation transformation factor based on clip progress
  const getClipAnimationStyle = (clip: HyperFrameClip) => {
    const entranceDuration = 0.5;
    const exitDuration = 0.4;
    const timeSinceStart = currentTime - clip.start;
    const timeUntilEnd = clip.start + clip.duration - currentTime;

    let opacity = 1;
    let transform = 'translate(-50%, -50%)';

    // Entrance animation
    if (timeSinceStart < entranceDuration) {
      const enterProgress = Math.min(1, timeSinceStart / entranceDuration);
      if (clip.animation === 'slideUp') {
        const yOffset = 35 * (1 - enterProgress);
        transform = `translate(-50%, calc(-50% + ${yOffset}px))`;
        opacity = enterProgress;
      } else if (clip.animation === 'zoomIn') {
        const scale = 0.75 + 0.25 * enterProgress;
        transform = `translate(-50%, -50%) scale(${scale})`;
        opacity = enterProgress;
      } else if (clip.animation === 'bounce') {
        const scale = 0.6 + 0.4 * enterProgress;
        transform = `translate(-50%, -50%) scale(${scale})`;
        opacity = enterProgress;
      } else {
        opacity = enterProgress;
      }
    }

    // Exit animation
    if (timeUntilEnd < exitDuration) {
      const exitProgress = Math.max(0, timeUntilEnd / exitDuration);
      opacity = Math.min(opacity, exitProgress);
      if (clip.animation === 'slideUp') {
        transform += ` translateY(-${(1 - exitProgress) * 20}px)`;
      } else if (clip.animation === 'zoomIn') {
        transform += ` scale(${1 + (1 - exitProgress) * 0.05})`;
      }
    }

    return {
      opacity,
      transform,
      left: `${clip.x !== undefined ? clip.x : 50}%`,
      top: `${clip.y !== undefined ? clip.y : 50}%`,
      width: clip.width ? `${clip.width}%` : 'auto',
      height: clip.height ? `${clip.height}%` : 'auto',
      zIndex: (clip.trackIndex || 0) * 10 + 10,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
      onClick={() => onSelectClip(null)}
    >
      {/* Background Grid Accent */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Video Frame */}
      <div
        className={`relative ${getAspectRatioClasses(
          project.aspectRatio
        )} rounded-2xl shadow-2xl overflow-hidden border border-slate-800 transition-all duration-300`}
        style={{
          background: project.bgGradient,
        }}
      >
        {/* Safe-Area Guides Overlay (HyperFrames Standard) */}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {/* 90% Action Safe Area */}
            <div className="absolute inset-[5%] border border-dashed border-emerald-400/40 rounded-lg">
              <span className="absolute top-1 left-2 text-[9px] uppercase tracking-wider font-mono text-emerald-400/70 font-bold bg-slate-950/70 px-1 rounded">
                90% Action Safe
              </span>
            </div>
            {/* 80% Title Safe Area */}
            <div className="absolute inset-[10%] border border-dashed border-amber-400/40 rounded-lg">
              <span className="absolute top-1 left-2 text-[9px] uppercase tracking-wider font-mono text-amber-400/70 font-bold bg-slate-950/70 px-1 rounded">
                80% Title Safe
              </span>
            </div>
          </div>
        )}

        {/* Render Active Clips */}
        {activeClips.map((clip) => {
          const isSelected = selectedClipId === clip.id;
          const animStyle = getClipAnimationStyle(clip);

          return (
            <div
              key={clip.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectClip(clip.id);
              }}
              className={`absolute cursor-pointer transition-shadow rounded-xl ${
                isSelected
                  ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 shadow-2xl'
                  : 'hover:ring-1 hover:ring-indigo-400/50'
              }`}
              style={animStyle}
            >
              {/* Type 1: Screencast Primary Asset */}
              {clip.type === 'screencast' && (
                <div className="w-full h-full flex flex-col justify-center">
                  {clip.screencastLayout === 'window' ? (
                    // macOS styled Window Mockup Frame
                    <div className="w-full h-full bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
                      {/* Window Header */}
                      <div className="h-7 px-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                          {clip.title || clip.screencastFileName || 'screencast-demo.mp4'}
                        </span>
                        <div className="w-10"></div>
                      </div>
                      {/* Video Player Container */}
                      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                        <video
                          data-clip-id={clip.id}
                          src={clip.screencastUrl || clip.videoUrl}
                          className="w-full h-full object-contain"
                          playsInline
                          muted
                          loop
                        />
                      </div>
                    </div>
                  ) : clip.screencastLayout === 'split' ? (
                    // Split Stage Frame
                    <div className="w-full h-full rounded-2xl border-2 border-indigo-500/40 shadow-2xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        data-clip-id={clip.id}
                        src={clip.screencastUrl || clip.videoUrl}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        loop
                      />
                    </div>
                  ) : (
                    // Fullscreen or PiP Screencast
                    <div className="w-full h-full rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        data-clip-id={clip.id}
                        src={clip.screencastUrl || clip.videoUrl}
                        className="w-full h-full object-contain"
                        playsInline
                        muted
                        loop
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Type 2: Screencast Callout / Click Indicator */}
              {clip.type === 'callout' && (
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="relative flex items-center justify-center">
                    <span 
                      className="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-75"
                      style={{ backgroundColor: clip.accentColor || '#38bdf8' }}
                    />
                    <div 
                      className="relative w-6 h-6 rounded-full flex items-center justify-center shadow-lg text-white"
                      style={{ backgroundColor: clip.accentColor || '#38bdf8' }}
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  {clip.title && (
                    <div 
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-xl backdrop-blur-md border border-white/20 whitespace-nowrap"
                      style={{ backgroundColor: `${clip.accentColor || '#38bdf8'}cc` }}
                    >
                      {clip.title}
                    </div>
                  )}
                </div>
              )}

              {/* Type 3: HeyGen Avatar Clip */}
              {clip.type === 'avatar' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                  <div
                    className={`relative w-full h-full overflow-hidden ${
                      clip.avatarStyle === 'circle'
                        ? 'rounded-full aspect-square border-4 border-indigo-500 shadow-2xl'
                        : 'rounded-2xl border border-slate-700/60 shadow-2xl'
                    }`}
                  >
                    {clip.videoUrl ? (
                      <video
                        data-clip-id={clip.id}
                        src={clip.videoUrl}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={clip.thumbnailUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'}
                        alt={clip.avatarName}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 text-[10px] font-semibold text-slate-200 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{clip.avatarName || 'HeyGen Avatar'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Type 4: Badge Clip */}
              {clip.type === 'badge' && (
                <div className="flex items-center justify-center">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-xl border backdrop-blur-md"
                    style={{
                      backgroundColor: `${clip.accentColor || '#38bdf8'}25`,
                      borderColor: clip.accentColor || '#38bdf8',
                      color: clip.accentColor || '#38bdf8',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: clip.accentColor || '#38bdf8' }}
                    ></span>
                    {clip.title}
                  </div>
                </div>
              )}

              {/* Type 5: Card Clip */}
              {clip.type === 'card' && (
                <div
                  className="w-full h-full p-6 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-left"
                  style={{
                    borderTop: `3px solid ${clip.accentColor || '#6366f1'}`,
                  }}
                >
                  <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                    {clip.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed font-normal">
                    {clip.content}
                  </p>
                </div>
              )}

              {/* Type 6: Metric Stat */}
              {clip.type === 'metric' && (
                <div className="p-6 rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl flex flex-col items-center text-center">
                  <span
                    className="text-5xl font-black tracking-tight mb-1"
                    style={{ color: clip.accentColor || '#34d399' }}
                  >
                    {clip.content || '10x'}
                  </span>
                  <h4 className="text-lg font-bold text-white">{clip.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{clip.subtitle}</p>
                </div>
              )}

              {/* Type 7: Title / Kinetic Text */}
              {clip.type === 'text' && (
                <div className="text-center p-4">
                  <h2
                    className="font-black text-white tracking-tight leading-snug drop-shadow-lg"
                    style={{
                      fontSize: `${Math.max(22, (clip.fontSize || 48) * (project.aspectRatio === '9:16' ? 0.7 : 0.85))}px`,
                    }}
                  >
                    {clip.title}
                  </h2>
                  {clip.subtitle && (
                    <p className="mt-2 text-sm sm:text-base font-medium text-slate-300 drop-shadow">
                      {clip.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Captions Track Subtitles */}
        {activeCaption && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[85%] z-40 animate-in fade-in duration-150">
            <div className="bg-slate-950/85 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-700/50 shadow-2xl text-center">
              <span className="text-sm md:text-base font-bold text-white tracking-wide">
                {activeCaption.text}
              </span>
            </div>
          </div>
        )}

        {/* Frame Info Watermark */}
        <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none z-30 flex items-center gap-2">
          <span>{project.width}x{project.height} @ {project.fps}fps</span>
        </div>

        {/* Hidden Audio Elements for Project Audio Tracks */}
        {project.audioTracks.map((track) => (
          <audio
            key={track.id}
            data-track-id={track.id}
            src={track.url}
            preload="auto"
            className="hidden"
          />
        ))}
      </div>
    </div>
  );
};
