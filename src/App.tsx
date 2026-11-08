/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { Sidebar } from './components/Sidebar';
import { VideoCanvas } from './components/VideoCanvas';
import { Timeline } from './components/Timeline';
import { InspectorPanel } from './components/InspectorPanel';
import { IntegrationsModal } from './components/IntegrationsModal';
import { RenderModal } from './components/RenderModal';
import { STARTER_PROJECTS } from './lib/templates';
import { 
  HyperframesProject, 
  HyperFrameClip, 
  AspectRatio, 
  HeyGenUserStatus,
  KieAiStatus,
  ElevenLabsStatus,
  CanvaStatus
} from './types/hyperframes';
import { getStoredHeyGenStatus } from './lib/heygenClient';
import { 
  getStoredKieStatus, 
  getStoredElevenLabsStatus, 
  getStoredCanvaStatus 
} from './lib/integrationsClient';
import { generateHyperframesHTML, generateHyperframesJSON, generateScriptMD } from './lib/hyperframesEngine';

export default function App() {
  const [project, setProject] = useState<HyperframesProject>(STARTER_PROJECTS[0]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_screencast_dsgvo');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showCodeView, setShowCodeView] = useState<boolean>(false);

  // Integrations state
  const [heygenStatus, setHeygenStatus] = useState<HeyGenUserStatus>(getStoredHeyGenStatus());
  const [kieStatus, setKieStatus] = useState<KieAiStatus>(getStoredKieStatus());
  const [elevenLabsStatus, setElevenLabsStatus] = useState<ElevenLabsStatus>(getStoredElevenLabsStatus());
  const [canvaStatus, setCanvaStatus] = useState<CanvaStatus>(getStoredCanvaStatus());

  // Modals state
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState<boolean>(false);
  const [integrationsInitialTab, setIntegrationsInitialTab] = useState<'heygen' | 'kie' | 'canva' | 'elevenlabs'>('heygen');
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false);

  // Animation frame reference for deterministic timeline playback
  const lastTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((t) => Math.max(0, t - 1 / project.fps));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((t) => Math.min(project.duration, t + 1 / project.fps));
      } else if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      } else if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipId) {
        e.preventDefault();
        handleDeleteClip(selectedClipId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.duration, project.fps, selectedClipId]);

  // Main playback animation loop
  const animate = useCallback(
    (time: number) => {
      if (isPlaying) {
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        setCurrentTime((prevTime) => {
          const nextTime = prevTime + delta;
          if (nextTime >= project.duration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return project.duration;
            }
          }
          return nextTime;
        });

        requestRef.current = requestAnimationFrame(animate);
      }
    },
    [isPlaying, isLooping, project.duration]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // Handlers
  const handleSeek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(project.duration, time)));
  };

  const handleStepFrame = (direction: 'forward' | 'backward') => {
    const frameStep = 1 / project.fps;
    if (direction === 'forward') {
      setCurrentTime((t) => Math.min(project.duration, t + frameStep));
    } else {
      setCurrentTime((t) => Math.max(0, t - frameStep));
    }
  };

  const handleUpdateClip = (updatedClip: HyperFrameClip) => {
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
    }));
  };

  const handleDeleteClip = (clipId: string) => {
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== clipId),
    }));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const handleAddClip = (newClip: HyperFrameClip) => {
    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
    }));
    setSelectedClipId(newClip.id);
  };

  const handleLoadTemplate = (newTemplate: HyperframesProject) => {
    setProject(newTemplate);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(newTemplate.clips[0]?.id || null);
  };

  const handleChangeAspectRatio = (ratio: AspectRatio) => {
    let width = 1920;
    let height = 1080;
    if (ratio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (ratio === '1:1') {
      width = 1080;
      height = 1080;
    }

    setProject((prev) => ({
      ...prev,
      aspectRatio: ratio,
      width,
      height,
    }));
  };

  const handleOpenIntegrationsTab = (tab: 'heygen' | 'kie' | 'canva' | 'elevenlabs' = 'heygen') => {
    setIntegrationsInitialTab(tab);
    setIsIntegrationsModalOpen(true);
  };

  const handleExportHyperframesProject = () => {
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
    }, 200);

    // Download SCRIPT.md
    setTimeout(() => {
      const blobMd = new Blob([md], { type: 'text/markdown' });
      const urlMd = URL.createObjectURL(blobMd);
      const aMd = document.createElement('a');
      aMd.href = urlMd;
      aMd.download = 'SCRIPT.md';
      aMd.click();
    }, 400);
  };

  const selectedClip = project.clips.find((c) => c.id === selectedClipId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-['Inter']">
      {/* Top Studio Header */}
      <StudioHeader
        projectTitle={project.title}
        onUpdateTitle={(title) => setProject((p) => ({ ...p, title }))}
        aspectRatio={project.aspectRatio}
        onChangeAspectRatio={handleChangeAspectRatio}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides((prev) => !prev)}
        showCodeView={showCodeView}
        onToggleCodeView={() => setShowCodeView((prev) => !prev)}
        heygenStatus={heygenStatus}
        kieStatus={kieStatus}
        elevenLabsStatus={elevenLabsStatus}
        canvaStatus={canvaStatus}
        onOpenIntegrations={handleOpenIntegrationsTab}
        onOpenRenderModal={() => setIsRenderModalOpen(true)}
        onExportHyperframesProject={handleExportHyperframesProject}
      />

      {/* Main Studio Body: Sidebar + Stage + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbox: Screencasts + Avatars + VO + Canva */}
        <Sidebar
          currentProject={project}
          onLoadTemplate={handleLoadTemplate}
          onAddClip={handleAddClip}
          currentTime={currentTime}
          heygenApiKey={heygenStatus.apiKey}
          elevenLabsApiKey={elevenLabsStatus.apiKey}
          elevenLabsStatus={elevenLabsStatus}
          onOpenIntegrations={handleOpenIntegrationsTab}
        />

        {/* Center Presentation Stage */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden relative">
          <VideoCanvas
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            selectedClipId={selectedClipId}
            onSelectClip={setSelectedClipId}
            showGuides={showGuides}
          />

          {/* Bottom Multi-Track Timeline */}
          <Timeline
            project={project}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onSeek={handleSeek}
            onStepFrame={handleStepFrame}
            isLooping={isLooping}
            onToggleLoop={() => setIsLooping((l) => !l)}
            selectedClipId={selectedClipId}
            onSelectClip={setSelectedClipId}
            onUpdateClip={handleUpdateClip}
            onDeleteClip={handleDeleteClip}
          />
        </main>

        {/* Right Inspector & Code Panel */}
        <InspectorPanel
          project={project}
          selectedClip={selectedClip}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          showCodeView={showCodeView}
          onCloseCodeView={() => setShowCodeView(false)}
        />
      </div>

      {/* Integrations & Accounts Hub (HeyGen, Kie.ai, Canva, ElevenLabs) */}
      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        heygenStatus={heygenStatus}
        onUpdateHeyGen={setHeygenStatus}
        kieStatus={kieStatus}
        onUpdateKie={setKieStatus}
        elevenLabsStatus={elevenLabsStatus}
        onUpdateElevenLabs={setElevenLabsStatus}
        canvaStatus={canvaStatus}
        onUpdateCanva={setCanvaStatus}
        initialTab={integrationsInitialTab}
      />

      {/* Video Rendering Modal */}
      <RenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        project={project}
        heygenStatus={heygenStatus}
        onOpenHeyGenConnect={() => {
          setIsRenderModalOpen(false);
          handleOpenIntegrationsTab('heygen');
        }}
        onInsertRenderedClip={(clip) => {
          handleUpdateClip(clip);
        }}
      />
    </div>
  );
}
