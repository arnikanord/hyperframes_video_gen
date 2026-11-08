import React from 'react';
import { 
  Play, 
  Download, 
  Code2, 
  Smartphone, 
  Monitor, 
  Square, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  FileCode2,
  Cpu,
  Mic2,
  Palette,
  Zap
} from 'lucide-react';
import { AspectRatio, HeyGenUserStatus, KieAiStatus, ElevenLabsStatus, CanvaStatus } from '../types/hyperframes';

interface StudioHeaderProps {
  projectTitle: string;
  onUpdateTitle: (title: string) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  showCodeView: boolean;
  onToggleCodeView: () => void;
  heygenStatus: HeyGenUserStatus;
  kieStatus: KieAiStatus;
  elevenLabsStatus: ElevenLabsStatus;
  canvaStatus: CanvaStatus;
  onOpenIntegrations: (tab?: 'heygen' | 'kie' | 'canva' | 'elevenlabs') => void;
  onOpenRenderModal: () => void;
  onExportHyperframesProject: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  projectTitle,
  onUpdateTitle,
  aspectRatio,
  onChangeAspectRatio,
  showGuides,
  onToggleGuides,
  showCodeView,
  onToggleCodeView,
  heygenStatus,
  kieStatus,
  elevenLabsStatus,
  canvaStatus,
  onOpenIntegrations,
  onOpenRenderModal,
  onExportHyperframesProject,
}) => {
  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-sky-400 to-indigo-400 text-xs tracking-tighter">HF</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white font-['Outfit']">HyperFrames</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">Studio</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Editable Title */}
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="text-sm font-medium text-slate-200 bg-transparent hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-slate-700 rounded px-2 py-1 transition-all outline-none max-w-xs truncate"
          placeholder="Untitled Screencast Project"
        />
      </div>

      {/* Center Controls: Aspect Ratio & Canvas Guides */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-lg border border-slate-800/60">
        <button
          onClick={() => onChangeAspectRatio('16:9')}
          className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
            aspectRatio === '16:9'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Landscape 16:9 (1920x1080)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>16:9</span>
        </button>
        <button
          onClick={() => onChangeAspectRatio('9:16')}
          className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
            aspectRatio === '9:16'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Portrait 9:16 (1080x1920 - Reels/Shorts)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16</span>
        </button>
        <button
          onClick={() => onChangeAspectRatio('1:1')}
          className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
            aspectRatio === '1:1'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Square 1:1 (1080x1080)"
        >
          <Square className="w-3.5 h-3.5" />
          <span>1:1</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Toggle Safe Area Guides */}
        <button
          onClick={onToggleGuides}
          className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
            showGuides
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Toggle 90% Action-Safe & 80% Title-Safe Guides"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guides</span>
        </button>

        {/* Toggle Code / Split View */}
        <button
          onClick={onToggleCodeView}
          className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
            showCodeView
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Toggle HyperFrames HTML/GSAP Code View"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Code</span>
        </button>
      </div>

      {/* Right Side: Integrations & Render CTA */}
      <div className="flex items-center gap-2">
        {/* Integrations Hub Trigger */}
        <button
          onClick={() => onOpenIntegrations('heygen')}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
          title="Manage HeyGen, Kie.ai, Canva, and ElevenLabs Connections"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">Integrations</span>

          {/* Quick status dots */}
          <div className="flex items-center gap-1 ml-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                heygenStatus.isConnected || heygenStatus.isGoogleLinked ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
              title="HeyGen"
            />
            <span
              className={`w-2 h-2 rounded-full ${
                kieStatus.isConnected ? 'bg-sky-400' : 'bg-slate-600'
              }`}
              title="Kie.ai"
            />
            <span
              className={`w-2 h-2 rounded-full ${
                canvaStatus.isConnected ? 'bg-teal-400' : 'bg-slate-600'
              }`}
              title="Canva"
            />
            <span
              className={`w-2 h-2 rounded-full ${
                elevenLabsStatus.isConnected ? 'bg-pink-400' : 'bg-slate-600'
              }`}
              title="ElevenLabs"
            />
          </div>
        </button>

        {/* Export HyperFrames Project */}
        <button
          onClick={onExportHyperframesProject}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-all"
          title="Export HyperFrames Project (index.html, hyperframes.json, SCRIPT.md)"
        >
          <FileCode2 className="w-4 h-4" />
        </button>

        {/* Primary Render Video CTA */}
        <button
          onClick={onOpenRenderModal}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center gap-2 group cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-200 group-hover:rotate-12 transition-transform" />
          <span>Render Video</span>
        </button>
      </div>
    </header>
  );
};
