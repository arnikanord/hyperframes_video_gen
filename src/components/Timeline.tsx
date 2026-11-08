import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  ChevronLeft, 
  ChevronRight, 
  Repeat, 
  ZoomIn, 
  ZoomOut, 
  Video, 
  Sparkles, 
  Subtitles, 
  Volume2, 
  Plus, 
  Trash2,
  Clock
} from 'lucide-react';
import { HyperframesProject, HyperFrameClip } from '../types/hyperframes';

interface TimelineProps {
  project: HyperframesProject;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStepFrame: (direction: 'forward' | 'backward') => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clip: HyperFrameClip) => void;
  onDeleteClip: (clipId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  onStepFrame,
  isLooping,
  onToggleLoop,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(60); // pixels per second
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragAction, setDragAction] = useState<'move' | 'trim-start' | 'trim-end' | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragOrigStart, setDragOrigStart] = useState<number>(0);
  const [dragOrigDuration, setDragOrigDuration] = useState<number>(0);

  const duration = project.duration;
  const timelineWidth = Math.max(800, duration * zoomLevel);

  // Format time (MM:SS.ms)
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const frames = Math.floor((sec % 1) * project.fps);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  // Ruler click / scrub handling
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    setIsScrubbing(true);
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, clickX / zoomLevel));
    onSeek(newTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = Math.max(0, Math.min(duration, clickX / zoomLevel));
        onSeek(newTime);
      } else if (draggingClipId && dragAction) {
        const deltaSec = (e.clientX - dragStartX) / zoomLevel;
        const clip = project.clips.find((c) => c.id === draggingClipId);
        if (!clip) return;

        if (dragAction === 'move') {
          const newStart = Math.max(0, Math.min(duration - clip.duration, dragOrigStart + deltaSec));
          onUpdateClip({ ...clip, start: Math.round(newStart * 10) / 10 });
        } else if (dragAction === 'trim-start') {
          const newStart = Math.max(0, Math.min(dragOrigStart + dragOrigDuration - 0.5, dragOrigStart + deltaSec));
          const newDuration = dragOrigDuration - (newStart - dragOrigStart);
          onUpdateClip({ ...clip, start: Math.round(newStart * 10) / 10, duration: Math.round(newDuration * 10) / 10 });
        } else if (dragAction === 'trim-end') {
          const newDuration = Math.max(0.5, Math.min(duration - dragOrigStart, dragOrigDuration + deltaSec));
          onUpdateClip({ ...clip, duration: Math.round(newDuration * 10) / 10 });
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggingClipId(null);
      setDragAction(null);
    };

    if (isScrubbing || draggingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggingClipId, dragAction, dragStartX, dragOrigStart, dragOrigDuration, zoomLevel, duration, onSeek, onUpdateClip, project.clips]);

  // Track definitions
  const tracks = [
    { index: 0, name: 'Video & Avatar', icon: Video, color: 'border-indigo-500/30' },
    { index: 1, name: 'Graphics & Text', icon: Sparkles, color: 'border-violet-500/30' },
    { index: 2, name: 'Captions / Subs', icon: Subtitles, color: 'border-amber-500/30' },
    { index: 3, name: 'Audio & Music', icon: Volume2, color: 'border-emerald-500/30' },
  ];

  // Clip color helper
  const getClipBgColor = (clip: HyperFrameClip) => {
    switch (clip.type) {
      case 'avatar':
        return 'bg-gradient-to-r from-indigo-900/90 to-indigo-800/90 border-indigo-500/70 text-indigo-200';
      case 'text':
        return 'bg-gradient-to-r from-sky-900/90 to-sky-800/90 border-sky-500/70 text-sky-200';
      case 'card':
        return 'bg-gradient-to-r from-violet-900/90 to-violet-800/90 border-violet-500/70 text-violet-200';
      case 'metric':
        return 'bg-gradient-to-r from-emerald-900/90 to-emerald-800/90 border-emerald-500/70 text-emerald-200';
      case 'badge':
        return 'bg-gradient-to-r from-pink-900/90 to-pink-800/90 border-pink-500/70 text-pink-200';
      default:
        return 'bg-slate-800 border-slate-600 text-slate-200';
    }
  };

  return (
    <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col select-none">
      {/* Timeline Controls Toolbar */}
      <div className="h-11 px-4 border-b border-slate-800/80 bg-slate-900/70 flex items-center justify-between">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Jump to start */}
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Jump to Start (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Previous Frame */}
          <button
            onClick={() => onStepFrame('backward')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Step Back 1 Frame (-1/30s)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary */}
          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Next Frame */}
          <button
            onClick={() => onStepFrame('forward')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Step Forward 1 Frame (+1/30s)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded transition-colors ${
              isLooping
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Loop Playback"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Timecode display */}
          <div className="ml-3 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">{formatTimecode(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTimecode(duration)}</span>
          </div>
        </div>

        {/* Right: Selected Clip Actions & Zoom */}
        <div className="flex items-center gap-3">
          {selectedClipId && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs text-slate-400 font-medium">Selected clip:</span>
              <button
                onClick={() => onDeleteClip(selectedClipId)}
                className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/40 rounded flex items-center gap-1 transition-all"
                title="Delete Clip"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-slate-800"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(30, z - 15))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1">{zoomLevel}px/s</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Workspace (Track Headers on Left + Scrollable Lanes on Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left column) */}
        <div className="w-48 shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col z-20">
          {/* Ruler Corner Header */}
          <div className="h-7 border-b border-slate-800/60 bg-slate-900/40 flex items-center px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Tracks</span>
          </div>

          {/* Track Labels */}
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.index}
                className="h-12 border-b border-slate-800/60 px-3 flex items-center justify-between text-xs font-medium text-slate-300 bg-slate-950"
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{track.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">T{track.index}</span>
              </div>
            );
          })}
        </div>

        {/* Scrollable Timeline Area (Ruler + Tracks Lanes) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-950" ref={rulerRef}>
          <div style={{ width: `${timelineWidth}px` }} className="relative h-full flex flex-col">
            {/* Time Ruler Bar */}
            <div
              className="h-7 border-b border-slate-800/80 bg-slate-900/50 relative cursor-pointer"
              onMouseDown={handleRulerMouseDown}
            >
              {/* Seconds notches */}
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-slate-800 flex flex-col justify-end"
                  style={{ left: `${i * zoomLevel}px` }}
                >
                  <span className="text-[9px] font-mono text-slate-400 pl-1 pb-0.5 select-none">
                    {i}s
                  </span>
                </div>
              ))}
            </div>

            {/* Track Lanes */}
            {tracks.map((track) => {
              // Clips on this track
              const trackClips = project.clips.filter((c) => c.trackIndex === track.index);

              return (
                <div
                  key={track.index}
                  className="h-12 border-b border-slate-800/40 relative bg-slate-950/40"
                >
                  {/* Grid Lines */}
                  {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-slate-900/60 pointer-events-none"
                      style={{ left: `${i * zoomLevel}px` }}
                    />
                  ))}

                  {/* Render clips on this track */}
                  {trackClips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const left = clip.start * zoomLevel;
                    const width = Math.max(20, clip.duration * zoomLevel);

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                          setDraggingClipId(clip.id);
                          setDragAction('move');
                          setDragStartX(e.clientX);
                          setDragOrigStart(clip.start);
                          setDragOrigDuration(clip.duration);
                        }}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-lg border px-2.5 flex items-center justify-between text-xs font-semibold cursor-grab active:cursor-grabbing transition-shadow overflow-hidden group select-none shadow-md ${getClipBgColor(
                          clip
                        )} ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950 border-white shadow-xl z-20'
                            : 'hover:brightness-110 z-10'
                        }`}
                      >
                        {/* Trim Handle Left */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingClipId(clip.id);
                            setDragAction('trim-start');
                            setDragStartX(e.clientX);
                            setDragOrigStart(clip.start);
                            setDragOrigDuration(clip.duration);
                          }}
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-white/40 group-hover:block transition-colors"
                        />

                        {/* Clip Content */}
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="truncate">{clip.name || clip.title || 'Clip'}</span>
                          <span className="text-[10px] font-mono opacity-70">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>

                        {/* Trim Handle Right */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingClipId(clip.id);
                            setDragAction('trim-end');
                            setDragStartX(e.clientX);
                            setDragOrigStart(clip.start);
                            setDragOrigDuration(clip.duration);
                          }}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-white/40 group-hover:block transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Red Playhead Line and Scrubber Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-30 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              <div className="w-3.5 h-3.5 bg-rose-500 rounded-b-sm -translate-x-[6px] flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
