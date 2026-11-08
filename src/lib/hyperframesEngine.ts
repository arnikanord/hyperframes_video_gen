import { HyperframesProject, HyperFrameClip } from '../types/hyperframes';

/**
 * Generates the official HyperFrames HTML composition
 * matching the specifications from github.com/heygen-com/hyperframes
 */
export function generateHyperframesHTML(project: HyperframesProject): string {
  const clipsHTML = project.clips
    .sort((a, b) => a.trackIndex - b.trackIndex || a.start - b.start)
    .map((clip) => {
      let contentMarkup = '';
      if (clip.type === 'screencast') {
        const isWindow = clip.screencastLayout === 'window';
        if (isWindow) {
          contentMarkup = `
      <div class="w-full h-full bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        <div class="h-8 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-rose-500"></div>
            <div class="w-3 h-3 rounded-full bg-amber-500"></div>
            <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <span class="text-xs font-mono text-slate-400">${clip.title || 'Screencast Demo'}</span>
          <div class="w-12"></div>
        </div>
        <div class="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <video id="${clip.id}_video" src="${clip.screencastUrl || clip.videoUrl || ''}" class="w-full h-full object-contain" muted playsinline data-has-audio="false"></video>
        </div>
      </div>`;
        } else {
          contentMarkup = `
      <div class="w-full h-full rounded-2xl border border-slate-700 shadow-2xl overflow-hidden bg-black flex items-center justify-center">
        <video id="${clip.id}_video" src="${clip.screencastUrl || clip.videoUrl || ''}" class="w-full h-full object-cover" muted playsinline data-has-audio="false"></video>
      </div>`;
        }
      } else if (clip.type === 'callout') {
        contentMarkup = `
      <div class="flex items-center gap-2.5">
        <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg text-white" style="background-color: ${clip.accentColor || '#38bdf8'}">
          <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
        </div>
        ${clip.title ? `<div class="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-xl backdrop-blur-md" style="background-color: ${clip.accentColor || '#38bdf8'}cc">${clip.title}</div>` : ''}
      </div>`;
      } else if (clip.type === 'avatar') {
        const styleClass = clip.avatarStyle === 'circle' ? 'rounded-full border-4 border-indigo-500 shadow-2xl object-cover' : 'rounded-2xl shadow-2xl object-cover';
        contentMarkup = `
      <div class="avatar-container flex flex-col items-center justify-center w-full h-full p-4">
        <div class="relative w-full h-full flex items-center justify-center">
          <video 
            id="${clip.id}_video" 
            src="${clip.videoUrl || ''}" 
            class="${styleClass} w-full h-full max-h-[85vh] object-cover" 
            muted 
            playsinline 
            data-has-audio="false"
          ></video>
          <div class="absolute bottom-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/60 text-xs font-semibold text-slate-200 shadow-lg flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ${clip.avatarName || 'HeyGen AI Presenter'}
          </div>
        </div>
      </div>`;
      } else if (clip.type === 'badge') {
        contentMarkup = `
      <div class="flex items-center justify-center w-full h-full">
        <div class="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-xl border border-white/20"
             style="background: ${clip.accentColor || '#38bdf8'}33; border-color: ${clip.accentColor || '#38bdf8'}; color: ${clip.accentColor || '#38bdf8'}; backdrop-filter: blur(12px);">
          <span class="w-2 h-2 rounded-full" style="background: ${clip.accentColor || '#38bdf8'}"></span>
          ${clip.title || 'HYPERFRAMES'}
        </div>
      </div>`;
      } else if (clip.type === 'card') {
        contentMarkup = `
      <div class="flex items-center justify-center w-full h-full p-6">
        <div class="w-full max-w-lg p-8 rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 shadow-2xl text-left transform transition-all"
             style="border-top: 3px solid ${clip.accentColor || '#6366f1'};">
          <h3 class="text-2xl font-extrabold text-white mb-3 tracking-tight">${clip.title || ''}</h3>
          <p class="text-slate-300 text-base leading-relaxed font-normal">${clip.content || ''}</p>
        </div>
      </div>`;
      } else if (clip.type === 'metric') {
        contentMarkup = `
      <div class="flex flex-col items-center justify-center w-full h-full p-6 text-center">
        <div class="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl flex flex-col items-center">
          <span class="text-6xl font-black tracking-tight mb-2" style="color: ${clip.accentColor || '#34d399'}">${clip.content || '10x'}</span>
          <h3 class="text-2xl font-bold text-white mb-1">${clip.title || ''}</h3>
          <p class="text-slate-400 text-sm">${clip.subtitle || ''}</p>
        </div>
      </div>`;
      } else {
        // Default text clip
        contentMarkup = `
      <div class="flex flex-col items-center justify-center w-full h-full p-8 text-center">
        <h2 class="font-black text-white tracking-tight leading-tight max-w-4xl" style="font-size: ${clip.fontSize || 52}px; text-shadow: 0 4px 20px rgba(0,0,0,0.6);">
          ${clip.title || ''}
        </h2>
        ${clip.subtitle ? `<p class="mt-4 text-xl md:text-2xl font-medium text-slate-300 max-w-2xl">${clip.subtitle}</p>` : ''}
      </div>`;
      }

      const stylePos = `
        position: absolute;
        left: ${clip.x !== undefined ? clip.x : 50}%;
        top: ${clip.y !== undefined ? clip.y : 50}%;
        transform: translate(-50%, -50%);
        width: ${clip.width ? `${clip.width}%` : 'auto'};
        height: ${clip.height ? `${clip.height}%` : 'auto'};
        z-index: ${clip.trackIndex * 10 + 10};
      `;

      return `    <!-- Clip: ${clip.name} (${clip.type}) -->
    <div id="${clip.id}" 
         class="clip" 
         data-start="${clip.start}" 
         data-duration="${clip.duration}" 
         data-track-index="${clip.trackIndex}"
         style="${stylePos}">
      ${contentMarkup}
    </div>`;
    })
    .join('\n\n');

  // GSAP animation script adhering to HyperFrames window.__timelines registration
  const gsapTweens = project.clips
    .map((clip) => {
      let tween = '';
      if (clip.animation === 'slideUp') {
        tween = `  tl.fromTo("#${clip.id}", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, ${clip.start});
  tl.to("#${clip.id}", { y: -30, opacity: 0, duration: 0.6, ease: "power2.in" }, ${clip.start + clip.duration - 0.6});`;
      } else if (clip.animation === 'zoomIn') {
        tween = `  tl.fromTo("#${clip.id}", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.4)" }, ${clip.start});
  tl.to("#${clip.id}", { scale: 1.05, opacity: 0, duration: 0.5, ease: "power2.in" }, ${clip.start + clip.duration - 0.5});`;
      } else if (clip.animation === 'bounce') {
        tween = `  tl.fromTo("#${clip.id}", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: "elastic.out(1, 0.5)" }, ${clip.start});
  tl.to("#${clip.id}", { opacity: 0, scale: 0.9, duration: 0.5 }, ${clip.start + clip.duration - 0.5});`;
      } else {
        // Standard fade
        tween = `  tl.fromTo("#${clip.id}", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, ${clip.start});
  tl.to("#${clip.id}", { opacity: 0, duration: 0.5, ease: "power2.in" }, ${clip.start + clip.duration - 0.5});`;
      }
      return tween;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title} - HyperFrames Composition</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      background: #000;
    }
    #root {
      position: relative;
      width: ${project.width}px;
      height: ${project.height}px;
      background: ${project.bgGradient};
      overflow: hidden;
    }
    .clip {
      visibility: hidden;
      will-change: transform, opacity;
    }
    .action-safe {
      position: absolute;
      inset: 5%;
      border: 1px dashed rgba(255,255,255,0.15);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <!-- HyperFrames Root Composition Contract -->
  <div id="root" data-composition-id="root" data-fps="${project.fps}" data-duration="${project.duration}">
${clipsHTML}
  </div>

  <script>
    // HyperFrames Seekable Timeline Contract: window.__timelines
    window.__timelines = window.__timelines || {};
    
    // Create master paused timeline
    const tl = gsap.timeline({ paused: true });
    
    // Register clips visibility range
    const clips = document.querySelectorAll('.clip');
    clips.forEach(clip => {
      const start = parseFloat(clip.dataset.start);
      const duration = parseFloat(clip.dataset.duration);
      tl.set(clip, { visibility: 'visible' }, start);
      tl.set(clip, { visibility: 'hidden' }, start + duration);
    });

${gsapTweens}

    // Expose root timeline to HyperFrames runner & Studio
    window.__timelines["root"] = tl;
    window.__seekTo = function(time) {
      tl.time(time);
      // Synchronize HTML5 video elements if present
      document.querySelectorAll('video').forEach(v => {
        const clipEl = v.closest('.clip');
        if (clipEl) {
          const cStart = parseFloat(clipEl.dataset.start);
          const cDuration = parseFloat(clipEl.dataset.duration);
          if (time >= cStart && time <= cStart + cDuration) {
            v.currentTime = (time - cStart) % (v.duration || 1);
          }
        }
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Generates the official hyperframes.json project file
 */
export function generateHyperframesJSON(project: HyperframesProject): string {
  return JSON.stringify(
    {
      name: project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      version: '1.0.0',
      description: 'Programmatic video generated with HyperFrames Studio',
      width: project.width,
      height: project.height,
      fps: project.fps,
      duration: project.duration,
      aspectRatio: project.aspectRatio,
      compositions: [
        {
          id: 'root',
          src: 'index.html',
          fps: project.fps,
          duration: project.duration,
        },
      ],
      heygen: {
        avatars: project.clips.filter((c) => c.type === 'avatar').map((c) => ({ id: c.avatarId, name: c.avatarName, voice: c.voiceName })),
      },
    },
    null,
    2
  );
}

/**
 * Generates SCRIPT.md voiceover narration document
 */
export function generateScriptMD(project: HyperframesProject): string {
  const avatarClips = project.clips.filter((c) => c.type === 'avatar' && c.script);
  return `# Voiceover & Narration Script: ${project.title}

Duration: ${project.duration}s | Aspect Ratio: ${project.aspectRatio} | FPS: ${project.fps}

## Narration Timeline
${avatarClips
  .map(
    (c, i) => `### Scene ${i + 1} (${c.start.toFixed(1)}s - ${(c.start + c.duration).toFixed(1)}s)
- **Character**: ${c.avatarName || 'HeyGen Avatar'} (${c.avatarId || 'default'})
- **Voice**: ${c.voiceName || 'Default Voice'}
- **Script**:
> "${c.script}"
`
  )
  .join('\n')}

## Captions
${project.captions.map((cap) => `- [${cap.start.toFixed(1)}s - ${cap.end.toFixed(1)}s]: ${cap.text}`).join('\n')}
`;
}
