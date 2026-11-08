import React, { useState } from 'react';
import { 
  Sliders, 
  Code2, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Sparkles, 
  Palette, 
  Move, 
  Download,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { HyperframesProject, HyperFrameClip, AnimationType } from '../types/hyperframes';
import { generateHyperframesHTML } from '../lib/hyperframesEngine';

interface InspectorPanelProps {
  project: HyperframesProject;
  selectedClip: HyperFrameClip | null;
  onUpdateClip: (clip: HyperFrameClip) => void;
  onDeleteClip: (clipId: string) => void;
  showCodeView: boolean;
  onCloseCodeView: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  project,
  selectedClip,
  onUpdateClip,
  onDeleteClip,
  showCodeView,
  onCloseCodeView,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'code'>(showCodeView ? 'code' : 'properties');

  const generatedHTML = generateHyperframesHTML(project);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedHTML);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-index.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colorPresets = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24', '#c084fc', '#ffffff'];

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col z-20 shrink-0 select-none">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'properties'
              ? 'bg-slate-800 text-indigo-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'code'
              ? 'bg-slate-800 text-indigo-400 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>HyperFrames HTML</span>
        </button>
      </div>

      {/* Tab 1: Properties */}
      {activeTab === 'properties' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedClip ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {selectedClip.name || 'Clip Settings'}
                  </h3>
                  <span className="text-[10px] text-slate-400 capitalize">
                    Type: {selectedClip.type} · Track {selectedClip.trackIndex}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteClip(selectedClip.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg transition-colors"
                  title="Delete Clip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timing & Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Timeline Timing (Seconds)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Start Time (s)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={project.duration}
                      value={selectedClip.start}
                      onChange={(e) =>
                        onUpdateClip({ ...selectedClip, start: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Duration (s)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={selectedClip.duration}
                      onChange={(e) =>
                        onUpdateClip({ ...selectedClip, duration: parseFloat(e.target.value) || 1 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Content Fields */}
              {selectedClip.title !== undefined && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Title / Headline
                  </label>
                  <input
                    type="text"
                    value={selectedClip.title}
                    onChange={(e) => onUpdateClip({ ...selectedClip, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              )}

              {selectedClip.subtitle !== undefined && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={selectedClip.subtitle}
                    onChange={(e) => onUpdateClip({ ...selectedClip, subtitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              )}

              {selectedClip.content !== undefined && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Body Content
                  </label>
                  <textarea
                    rows={3}
                    value={selectedClip.content}
                    onChange={(e) => onUpdateClip({ ...selectedClip, content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Screencast Layout Options */}
              {selectedClip.type === 'screencast' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Screencast Frame & Layout
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['window', 'split', 'fullscreen'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          onUpdateClip({
                            ...selectedClip,
                            screencastLayout: mode,
                            width: mode === 'fullscreen' ? 100 : mode === 'split' ? 58 : 78,
                            height: mode === 'fullscreen' ? 100 : mode === 'split' ? 75 : 80,
                            x: mode === 'split' ? 34 : 50,
                            y: 50,
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold capitalize transition-all ${
                          selectedClip.screencastLayout === mode
                            ? 'border-sky-500 bg-sky-950/60 text-sky-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'window' ? 'macOS Frame' : mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Avatar Script */}
              {selectedClip.type === 'avatar' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Avatar Speech Script
                  </label>
                  <textarea
                    rows={3}
                    value={selectedClip.script || ''}
                    onChange={(e) => onUpdateClip({ ...selectedClip, script: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Animation Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>GSAP Seekable Animation</span>
                </label>
                <select
                  value={selectedClip.animation || 'slideUp'}
                  onChange={(e) =>
                    onUpdateClip({ ...selectedClip, animation: e.target.value as AnimationType })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 capitalize"
                >
                  <option value="slideUp">Slide Up (Power3.out)</option>
                  <option value="zoomIn">Zoom In (Back.out)</option>
                  <option value="bounce">Bounce (Elastic.out)</option>
                  <option value="fade">Smooth Fade</option>
                </select>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Accent Color</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdateClip({ ...selectedClip, accentColor: color })}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        selectedClip.accentColor === color
                          ? 'scale-125 ring-2 ring-white border-white'
                          : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Layout Coordinates */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Position & Scale (%)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Center X (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedClip.x !== undefined ? selectedClip.x : 50}
                      onChange={(e) =>
                        onUpdateClip({ ...selectedClip, x: parseInt(e.target.value, 10) || 50 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Center Y (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedClip.y !== undefined ? selectedClip.y : 50}
                      onChange={(e) =>
                        onUpdateClip({ ...selectedClip, y: parseInt(e.target.value, 10) || 50 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                <Sliders className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-400 mb-1">No Clip Selected</p>
              <p className="text-[11px] text-slate-500">
                Click any clip on the canvas or timeline to inspect and edit its properties.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: HyperFrames Code View */}
      {activeTab === 'code' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Code Toolbar */}
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>index.html</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1"
                title="Copy HyperFrames HTML"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadHTML}
                className="p-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                title="Download index.html"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* HyperFrames Contract Notice */}
          <div className="p-3 bg-indigo-950/30 border-b border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Deterministic frame seeking registers to <code className="text-indigo-300 font-mono">window.__timelines["root"] = tl</code> for frame-accurate MP4 rendering.
            </span>
          </div>

          {/* Code Editor Content */}
          <div className="flex-1 overflow-auto p-3 font-mono text-[11px] text-slate-300 bg-slate-950 leading-relaxed whitespace-pre select-text">
            {generatedHTML}
          </div>
        </div>
      )}
    </aside>
  );
};
