/**
 * Voice Roleplay — live Grok Voice Agent sessions for recruiting practice.
 * Uses agent_id from xAI Voice Agent builder; browser auth via ephemeral client secret.
 */
(function () {
  'use strict';

  const AGENT_ID =
    (typeof window !== 'undefined' && window.RECRUITING_VOICE_AGENT_ID) ||
    'agent_dPytnYBuJKo5KrKQ';
  const SAMPLE_RATE = 24000;
  const HISTORY_KEY = 'recruitingVoiceRoleplayHistory';

  let ws = null;
  let mediaStream = null;
  let audioContext = null;
  let processor = null;
  let sourceNode = null;
  let isLive = false;
  let playbackTime = 0;
  let sessionStartedAt = null;
  let partialUser = '';
  let partialAssistant = '';

  const el = (id) => document.getElementById(id);

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
    else console.log('[voice-roleplay]', msg);
  }

  function setStatus(text, tone) {
    const s = el('voice-roleplay-status');
    if (!s) return;
    s.textContent = text;
    s.className =
      'text-sm font-semibold ' +
      (tone === 'live'
        ? 'text-[#00A89D]'
        : tone === 'error'
          ? 'text-red-500'
          : tone === 'warn'
            ? 'text-amber-600'
            : 'text-gray-500');
  }

  function setLiveUi(live) {
    isLive = live;
    const start = el('voice-roleplay-start');
    const stop = el('voice-roleplay-stop');
    if (start) {
      start.disabled = live;
      start.classList.toggle('opacity-50', live);
    }
    if (stop) {
      stop.disabled = !live;
      stop.classList.toggle('opacity-50', !live);
    }
    const pulse = el('voice-roleplay-pulse');
    if (pulse) {
      pulse.classList.toggle('hidden', !live);
      pulse.classList.toggle('flex', live);
    }
  }

  function appendTranscript(role, text, opts) {
    const box = el('voice-roleplay-transcript');
    if (!box || !text) return;
    const final = opts && opts.final;
    const id = opts && opts.id;
    let line = id ? box.querySelector(`[data-line-id="${id}"]`) : null;
    if (!line) {
      line = document.createElement('div');
      line.className =
        'rounded-2xl px-4 py-3 text-sm leading-relaxed ' +
        (role === 'user'
          ? 'bg-[#002B5C]/5 border border-[#002B5C]/15 text-[#002B5C] dark:text-gray-100'
          : 'bg-[#00A89D]/10 border border-[#00A89D]/25 text-gray-800 dark:text-gray-100');
      if (id) line.setAttribute('data-line-id', id);
      const label = document.createElement('div');
      label.className = 'text-[10px] font-bold uppercase tracking-wider mb-1 ' + (role === 'user' ? 'text-[#002B5C]/70' : 'text-[#00A89D]');
      label.textContent = role === 'user' ? 'You (recruiter)' : 'LO prospect (agent)';
      line.appendChild(label);
      const body = document.createElement('div');
      body.className = 'voice-line-body';
      line.appendChild(body);
      box.appendChild(line);
    }
    const body = line.querySelector('.voice-line-body');
    if (body) body.textContent = text;
    if (final) line.dataset.final = '1';
    box.scrollTop = box.scrollHeight;
  }

  function floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function base64ToInt16(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Int16Array(bytes.buffer);
  }

  function playPcm16(int16) {
    if (!audioContext || !int16 || !int16.length) return;
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    const buf = audioContext.createBuffer(1, float32.length, SAMPLE_RATE);
    buf.copyToChannel(float32, 0);
    const src = audioContext.createBufferSource();
    src.buffer = buf;
    src.connect(audioContext.destination);
    const now = audioContext.currentTime;
    if (playbackTime < now) playbackTime = now + 0.02;
    src.start(playbackTime);
    playbackTime += buf.duration;
  }

  async function startMicCapture() {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    // Some browsers ignore requested sampleRate — resample if needed
    const actualRate = audioContext.sampleRate;
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    // ScriptProcessor is deprecated but widely supported without worklet bundling
    const bufferSize = 4096;
    processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!ws || ws.readyState !== WebSocket.OPEN || !isLive) return;
      let input = e.inputBuffer.getChannelData(0);
      // Naive downsample if context rate differs
      if (actualRate !== SAMPLE_RATE && actualRate > 0) {
        const ratio = actualRate / SAMPLE_RATE;
        const newLen = Math.floor(input.length / ratio);
        const resampled = new Float32Array(newLen);
        for (let i = 0; i < newLen; i++) {
          resampled[i] = input[Math.floor(i * ratio)] || 0;
        }
        input = resampled;
      }
      const pcm = floatTo16BitPCM(input);
      const b64 = arrayBufferToBase64(pcm);
      try {
        ws.send(
          JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: b64
          })
        );
      } catch (err) {
        console.warn('[voice] append failed', err);
      }
    };
    sourceNode.connect(processor);
    processor.connect(audioContext.destination);
    playbackTime = audioContext.currentTime;
  }

  function stopMicCapture() {
    try {
      if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
      }
      if (sourceNode) sourceNode.disconnect();
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    } catch (e) {}
    processor = null;
    sourceNode = null;
    mediaStream = null;
    audioContext = null;
  }

  function handleServerEvent(event) {
    if (!event || !event.type) return;
    const t = event.type;

    if (t === 'error' || t === 'session.error') {
      const msg = event.error?.message || event.message || JSON.stringify(event).slice(0, 200);
      setStatus('Error: ' + msg, 'error');
      toast(msg, 'error');
      return;
    }

    if (t === 'session.created' || t === 'session.updated') {
      setStatus('Connected — speak when ready (agent is listening)', 'live');
      return;
    }

    // Transcripts (naming variants across API revisions)
    if (
      t === 'conversation.item.input_audio_transcription.delta' ||
      t === 'input_audio_transcription.delta' ||
      t === 'response.input_audio_transcription.delta'
    ) {
      partialUser += event.delta || event.text || '';
      appendTranscript('user', partialUser, { id: 'live-user' });
      return;
    }
    if (
      t === 'conversation.item.input_audio_transcription.completed' ||
      t === 'input_audio_transcription.completed'
    ) {
      const text = event.transcript || event.text || partialUser;
      partialUser = '';
      if (text) appendTranscript('user', text, { id: 'user-' + Date.now(), final: true });
      const live = el('voice-roleplay-transcript')?.querySelector('[data-line-id="live-user"]');
      live?.remove();
      return;
    }

    if (t === 'response.output_audio_transcript.delta' || t === 'response.audio_transcript.delta') {
      partialAssistant += event.delta || '';
      appendTranscript('assistant', partialAssistant, { id: 'live-assistant' });
      return;
    }
    if (t === 'response.output_audio_transcript.done' || t === 'response.audio_transcript.done') {
      const text = event.transcript || partialAssistant;
      partialAssistant = '';
      if (text) appendTranscript('assistant', text, { id: 'asst-' + Date.now(), final: true });
      const live = el('voice-roleplay-transcript')?.querySelector('[data-line-id="live-assistant"]');
      live?.remove();
      return;
    }

    if (t === 'response.output_audio.delta' || t === 'response.audio.delta') {
      const b64 = event.delta || event.audio;
      if (b64) {
        try {
          playPcm16(base64ToInt16(b64));
        } catch (e) {
          console.warn('[voice] playback decode failed', e);
        }
      }
      return;
    }

    if (t === 'response.done' || t === 'response.completed') {
      partialAssistant = '';
    }
  }

  async function startSession() {
    if (isLive) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      toast('Microphone API not available in this browser.', 'error');
      return;
    }

    setStatus('Requesting secure voice token…', 'warn');
    setLiveUi(false);

    try {
      if (typeof window.fetchVoiceClientSecret !== 'function') {
        throw new Error('Voice API helper not loaded');
      }
      const secret = await window.fetchVoiceClientSecret({ expiresSeconds: 600 });
      const agentId = secret.agent_id || AGENT_ID;
      const token = secret.value;

      setStatus('Connecting to Grok Voice Agent…', 'warn');
      await startMicCapture();

      const url = `wss://api.x.ai/v1/realtime?agent_id=${encodeURIComponent(agentId)}`;
      // Browser cannot set Authorization headers on WebSocket — use protocol subprotocol
      ws = new WebSocket(url, [`xai-client-secret.${token}`]);

      ws.onopen = () => {
        sessionStartedAt = Date.now();
        setLiveUi(true);
        setStatus('Live — practice your recruiting conversation', 'live');
        // Prefer server-side agent config; soft audio format hint for browser PCM
        try {
          ws.send(
            JSON.stringify({
              type: 'session.update',
              session: {
                turn_detection: { type: 'server_vad' },
                audio: {
                  input: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
                  output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } }
                }
              }
            })
          );
        } catch (e) {
          console.warn('[voice] session.update optional', e);
        }
        toast('Voice roleplay started — speak naturally', 'success');
      };

      ws.onmessage = (msg) => {
        try {
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : null;
          if (data) handleServerEvent(data);
        } catch (e) {
          console.warn('[voice] bad event', e);
        }
      };

      ws.onerror = () => {
        setStatus('WebSocket error — check API key / Voice access on the server', 'error');
      };

      ws.onclose = (ev) => {
        const reason = ev.reason || `code ${ev.code}`;
        if (isLive) setStatus('Session ended (' + reason + ')', 'warn');
        cleanupSession(false);
      };
    } catch (err) {
      console.error('[voice] start failed', err);
      setStatus(err.message || 'Failed to start', 'error');
      toast(err.message || 'Failed to start voice session', 'error');
      cleanupSession(false);
    }
  }

  function saveSessionSummary() {
    const box = el('voice-roleplay-transcript');
    if (!box) return;
    const lines = Array.from(box.querySelectorAll('.voice-line-body'))
      .map((n) => n.textContent)
      .filter(Boolean);
    if (!lines.length) return;
    try {
      const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      hist.unshift({
        id: 'vr-' + Date.now(),
        at: new Date().toISOString(),
        durationSec: sessionStartedAt ? Math.round((Date.now() - sessionStartedAt) / 1000) : 0,
        preview: lines.slice(0, 4).join(' · ').slice(0, 240),
        transcriptHtml: box.innerHTML
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 20)));
      renderHistory();
    } catch (e) {}
  }

  function cleanupSession(save) {
    if (save) saveSessionSummary();
    try {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    } catch (e) {}
    ws = null;
    stopMicCapture();
    setLiveUi(false);
    partialUser = '';
    partialAssistant = '';
    sessionStartedAt = null;
  }

  function stopSession() {
    if (!isLive && !ws) return;
    setStatus('Ending session…', 'warn');
    cleanupSession(true);
    setStatus('Session saved in this browser', 'warn');
    toast('Roleplay ended — transcript kept in history', 'info');
  }

  function clearTranscript() {
    const box = el('voice-roleplay-transcript');
    if (box) box.innerHTML = '';
  }

  function renderHistory() {
    const host = el('voice-roleplay-history');
    if (!host) return;
    let hist = [];
    try {
      hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (e) {}
    if (!hist.length) {
      host.innerHTML = '<p class="text-sm text-gray-500 m-0">No past sessions yet. Complete a roleplay to save a summary here.</p>';
      return;
    }
    host.innerHTML = hist
      .slice(0, 8)
      .map(
        (h) => `
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm">
        <div class="flex justify-between gap-2 text-xs text-gray-500 mb-1">
          <span>${new Date(h.at).toLocaleString()}</span>
          <span>${h.durationSec || 0}s</span>
        </div>
        <p class="m-0 text-gray-700 dark:text-gray-300 line-clamp-2">${escapeHtml(h.preview || '')}</p>
      </div>`
      )
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function wire() {
    el('voice-roleplay-start')?.addEventListener('click', () => startSession());
    el('voice-roleplay-stop')?.addEventListener('click', () => stopSession());
    el('voice-roleplay-clear')?.addEventListener('click', () => clearTranscript());
    renderHistory();
    setStatus('Ready — click Start Roleplay (mic permission required)', 'warn');
    setLiveUi(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  window.startVoiceRoleplay = startSession;
  window.stopVoiceRoleplay = stopSession;

  console.log('%c[voice-roleplay] Grok Voice Agent roleplay ready', 'color:#00A89D');
})();
