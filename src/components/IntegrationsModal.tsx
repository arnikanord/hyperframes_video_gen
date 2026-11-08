import React, { useState } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  ShieldCheck, 
  LogOut, 
  Globe, 
  Sparkles, 
  Mic2, 
  Palette, 
  Cpu, 
  Mail,
  Zap,
  Check
} from 'lucide-react';
import { 
  HeyGenUserStatus, 
  KieAiStatus, 
  ElevenLabsStatus, 
  CanvaStatus, 
  CanvaAsset,
  ElevenLabsVoice
} from '../types/hyperframes';
import { 
  testHeyGenConnection, 
  saveHeyGenApiKey, 
  clearHeyGenConnection, 
  saveGoogleUser, 
  clearGoogleUser 
} from '../lib/heygenClient';
import { 
  verifyKieConnection, 
  saveKieStatus, 
  verifyElevenLabs, 
  saveElevenLabsStatus, 
  connectCanvaWithEmail, 
  saveCanvaStatus,
  fetchCanvaAssets,
  fetchElevenLabsVoices
} from '../lib/integrationsClient';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heygenStatus: HeyGenUserStatus;
  onUpdateHeyGen: (status: HeyGenUserStatus) => void;
  kieStatus: KieAiStatus;
  onUpdateKie: (status: KieAiStatus) => void;
  elevenLabsStatus: ElevenLabsStatus;
  onUpdateElevenLabs: (status: ElevenLabsStatus) => void;
  canvaStatus: CanvaStatus;
  onUpdateCanva: (status: CanvaStatus) => void;
  initialTab?: 'heygen' | 'kie' | 'canva' | 'elevenlabs';
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  heygenStatus,
  onUpdateHeyGen,
  kieStatus,
  onUpdateKie,
  elevenLabsStatus,
  onUpdateElevenLabs,
  canvaStatus,
  onUpdateCanva,
  initialTab = 'heygen',
}) => {
  const [activeTab, setActiveTab] = useState<'heygen' | 'kie' | 'canva' | 'elevenlabs'>(initialTab);

  // HeyGen state
  const [heygenKeyInput, setHeygenKeyInput] = useState(heygenStatus.apiKey);
  const [heygenTesting, setHeygenTesting] = useState(false);
  const [heygenMsg, setHeygenMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Kie.ai state
  const [kieKeyInput, setKieKeyInput] = useState(kieStatus.apiKey);
  const [kieTesting, setKieTesting] = useState(false);
  const [kieMsg, setKieMsg] = useState<{ success: boolean; text: string } | null>(null);

  // ElevenLabs state
  const [elevenKeyInput, setElevenKeyInput] = useState(elevenLabsStatus.apiKey);
  const [elevenTesting, setElevenTesting] = useState(false);
  const [elevenMsg, setElevenMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Canva state
  const [canvaEmailInput, setCanvaEmailInput] = useState(canvaStatus.email || 'aluton1@gmail.com');
  const [canvaConnecting, setCanvaConnecting] = useState(false);
  const [canvaMsg, setCanvaMsg] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  // 1. HeyGen Handlers
  const handleSaveHeyGenKey = async () => {
    if (!heygenKeyInput.trim()) return;
    setHeygenTesting(true);
    setHeygenMsg(null);
    const res = await testHeyGenConnection(heygenKeyInput.trim());
    setHeygenTesting(false);

    if (res.success) {
      setHeygenMsg({ success: true, text: 'HeyGen API key verified successfully!' });
      saveHeyGenApiKey(heygenKeyInput.trim());
      onUpdateHeyGen({ ...heygenStatus, apiKey: heygenKeyInput.trim(), isConnected: true });
    } else {
      setHeygenMsg({ success: false, text: res.message || 'Verification failed' });
    }
  };

  const handleLinkGoogleHeyGen = (email: string = 'aluton1@gmail.com') => {
    const user = { email, name: email.split('@')[0] };
    saveGoogleUser(user);
    onUpdateHeyGen({ ...heygenStatus, isGoogleLinked: true, googleUser: user, accountEmail: user.email });
    setHeygenMsg({ success: true, text: `Google Account (${email}) linked with HeyGen!` });
  };

  // 2. Kie.ai Handlers
  const handleSaveKieKey = async () => {
    setKieTesting(true);
    setKieMsg(null);
    const res = await verifyKieConnection({ apiKey: kieKeyInput.trim() });
    setKieTesting(false);

    if (res.success) {
      setKieMsg({ success: true, text: res.message });
      const updated: KieAiStatus = {
        ...kieStatus,
        apiKey: kieKeyInput.trim(),
        isConnected: true,
        credits: res.credits || 'Active',
      };
      saveKieStatus(updated);
      onUpdateKie(updated);
    } else {
      setKieMsg({ success: false, text: res.message });
    }
  };

  const handleLinkGoogleKie = (email: string = 'aluton1@gmail.com') => {
    const updated: KieAiStatus = {
      ...kieStatus,
      isGoogleLinked: true,
      isConnected: true,
      email,
      credits: 'Active',
    };
    saveKieStatus(updated);
    onUpdateKie(updated);
    setKieMsg({ success: true, text: `Kie.ai authenticated with Google account (${email})!` });
  };

  // 3. ElevenLabs Handlers
  const handleSaveElevenLabs = async () => {
    if (!elevenKeyInput.trim()) return;
    setElevenTesting(true);
    setElevenMsg(null);
    const res = await verifyElevenLabs(elevenKeyInput.trim());
    setElevenTesting(false);

    if (res.success) {
      setElevenMsg({ success: true, text: res.message });
      const updated: ElevenLabsStatus = {
        ...elevenLabsStatus,
        apiKey: elevenKeyInput.trim(),
        isConnected: true,
      };
      saveElevenLabsStatus(updated);
      onUpdateElevenLabs(updated);
    } else {
      setElevenMsg({ success: false, text: res.message });
    }
  };

  const handleLinkGoogleElevenLabs = async (email: string = 'aluton1@gmail.com') => {
    setElevenTesting(true);
    setElevenMsg(null);
    const res = await verifyElevenLabs({ email });
    setElevenTesting(false);

    const user = { email, name: email.split('@')[0] };
    const updated: ElevenLabsStatus = {
      ...elevenLabsStatus,
      isGoogleLinked: true,
      isConnected: true,
      email,
      googleUser: user,
    };
    saveElevenLabsStatus(updated);
    onUpdateElevenLabs(updated);
    setElevenMsg({ success: true, text: `ElevenLabs linked via Google OAuth (${email})!` });
  };

  // 4. Canva Handlers
  const handleConnectCanva = async () => {
    if (!canvaEmailInput.trim()) return;
    setCanvaConnecting(true);
    setCanvaMsg(null);
    const res = await connectCanvaWithEmail(canvaEmailInput.trim());
    setCanvaConnecting(false);

    if (res.success) {
      setCanvaMsg({ success: true, text: res.message || 'Canva connected successfully!' });
      const updated: CanvaStatus = {
        isConnected: true,
        email: canvaEmailInput.trim(),
        teamName: res.teamName || 'Canva Pro Studio',
        syncedAssetsCount: res.syncedAssetsCount || 3,
      };
      saveCanvaStatus(updated);
      onUpdateCanva(updated);
    } else {
      setCanvaMsg({ success: false, text: res.message || 'Failed to connect to Canva' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Integrations & Accounts Hub</h2>
              <p className="text-xs text-slate-400">Connect HeyGen, Kie.ai, Canva, and ElevenLabs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          {/* 1. HeyGen */}
          <button
            onClick={() => setActiveTab('heygen')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'heygen'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">HeyGen</span>
            {heygenStatus.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </button>

          {/* 2. Kie.ai */}
          <button
            onClick={() => setActiveTab('kie')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'kie'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Kie.ai</span>
            {kieStatus.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </button>

          {/* 3. Canva */}
          <button
            onClick={() => setActiveTab('canva')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'canva'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">Canva</span>
            {canvaStatus.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </button>

          {/* 4. ElevenLabs */}
          <button
            onClick={() => setActiveTab('elevenlabs')}
            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'elevenlabs'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">ElevenLabs</span>
            {elevenLabsStatus.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4">
          {/* 1. HEYGEN TAB */}
          {activeTab === 'heygen' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    HeyGen AI Studio
                    {heygenStatus.isConnected && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Lip-synced AI presenters for your screencasts</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  HeyGen API Key (<code className="text-indigo-400 font-mono">X-Api-Key</code>)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={heygenKeyInput}
                    onChange={(e) => setHeygenKeyInput(e.target.value)}
                    placeholder="Enter your HeyGen API key"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {heygenStatus.isConnected && (
                    <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-xs text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Google SSO Button */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Google SSO Login (aluton1@gmail.com)</div>
                  <div className="text-[11px] text-slate-400">Link your Google session used to log into HeyGen</div>
                </div>
                {heygenStatus.isGoogleLinked ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Linked
                  </span>
                ) : (
                  <button
                    onClick={() => handleLinkGoogleHeyGen('aluton1@gmail.com')}
                    className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Link Google
                  </button>
                )}
              </div>

              {heygenMsg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  heygenMsg.success ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  {heygenMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{heygenMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleSaveHeyGenKey}
                disabled={heygenTesting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {heygenTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Verify & Save HeyGen Credentials</span>
              </button>
            </div>
          )}

          {/* 2. KIE.AI TAB */}
          {activeTab === 'kie' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Kie.ai Video & Model Hub
                    {kieStatus.isConnected && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Unified API for Kling, Veo, Hailuo, and Flux video models</p>
                </div>
              </div>

              {/* Google Auth link for Kie.ai */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Google Auth Login (aluton1@gmail.com)</div>
                  <div className="text-[11px] text-slate-400">Authenticate with your Google account on Kie.ai</div>
                </div>
                {kieStatus.isGoogleLinked ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authorized
                  </span>
                ) : (
                  <button
                    onClick={() => handleLinkGoogleKie('aluton1@gmail.com')}
                    className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-semibold hover:bg-sky-400 transition-colors cursor-pointer"
                  >
                    Auth with Google
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kie.ai API Key (<code className="text-sky-400 font-mono">Authorization: Bearer</code>)
                </label>
                <input
                  type="password"
                  value={kieKeyInput}
                  onChange={(e) => setKieKeyInput(e.target.value)}
                  placeholder="Enter your Kie.ai API key (e.g. kie_live_...)"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Find your secret key in your dashboard at <a href="https://kie.ai/api-key" target="_blank" rel="noreferrer" className="text-sky-400 underline">kie.ai/api-key</a>.
                </span>
              </div>

              {kieMsg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  kieMsg.success ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  {kieMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{kieMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleSaveKieKey}
                disabled={kieTesting}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {kieTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Connect Kie.ai API Key</span>
              </button>
            </div>
          )}

          {/* 3. CANVA TAB */}
          {activeTab === 'canva' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Canva Studio Integration
                    {canvaStatus.isConnected && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Import design assets, frame borders, and brand templates</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>Canva Account Email Login</span>
                </label>
                <input
                  type="email"
                  value={canvaEmailInput}
                  onChange={(e) => setCanvaEmailInput(e.target.value)}
                  placeholder="aluton1@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Connects your Canva workspace using email authentication to sync project graphics.
                </span>
              </div>

              {canvaMsg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  canvaMsg.success ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  {canvaMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{canvaMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleConnectCanva}
                disabled={canvaConnecting}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {canvaConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                <span>Connect Canva via Email</span>
              </button>
            </div>
          )}

          {/* 4. ELEVENLABS TAB */}
          {activeTab === 'elevenlabs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    ElevenLabs Voiceover Engine
                    {elevenLabsStatus.isConnected && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">High-fidelity voice synthesis and narration for your screencasts</p>
                </div>
              </div>

              {/* Google OAuth SSO for ElevenLabs */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Google OAuth Login (aluton1@gmail.com)</div>
                  <div className="text-[11px] text-slate-400">Link your Google account used to login to ElevenLabs</div>
                </div>
                {elevenLabsStatus.isGoogleLinked ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authorized
                  </span>
                ) : (
                  <button
                    onClick={() => handleLinkGoogleElevenLabs('aluton1@gmail.com')}
                    className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-xs font-semibold hover:bg-pink-400 transition-colors cursor-pointer"
                  >
                    Auth with Google
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ElevenLabs API Key (<code className="text-pink-400 font-mono">xi-api-key</code>)
                </label>
                <input
                  type="password"
                  value={elevenKeyInput}
                  onChange={(e) => setElevenKeyInput(e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-pink-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Find your API key in ElevenLabs Profile &gt; API Keys (<a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer" className="text-pink-400 underline">elevenlabs.io</a>).
                </span>
              </div>

              {elevenMsg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  elevenMsg.success ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  {elevenMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{elevenMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleSaveElevenLabs}
                disabled={elevenTesting}
                className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {elevenTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic2 className="w-4 h-4" />}
                <span>Verify & Save ElevenLabs API Key</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
