/* ============================================
   ARLEN LLC — Mascot TTS Engine
   Gemini Neural TTS with Web Audio API
   Voice: Enceladus (friendly, warm male) for a dog mascot
   ============================================ */

const ArlenTTS = (() => {
  const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
  const VOICE_NAME = 'Enceladus'; // Warm, friendly — perfect for an adorable mascot
  let apiKey = null;
  let isSpeaking = false;
  let queue = [];
  let muted = localStorage.getItem('arlen-tts-muted') === 'true';
  let audioCtx = null;
  let currentSource = null;

  // Pre-written greetings the mascot says
  const GREETINGS = {
    welcome: "Hey there! Welcome to Arlen! I'm your friendly guide. Need a free quote, want to explore our services, or just have a question? I'm here to help!",
    quote: "Great choice! Let me take you to our quote page where Dylan can get you set up with a custom lighting plan.",
    services: "We've got five amazing services! Holiday lighting, permanent LED systems, landscape lighting, window cleaning, and drone roof inspections. Which one catches your eye?",
    merch: "Check out the Arlen gear! We've got t-shirts, hoodies, hats, and more coming soon. Looking good while supporting the team!",
    drone: "Our drone service is awesome! We can do aerial roof inspections and even create 3D digital twins of your property. Pretty cool, right?",
    goodbye: "Thanks for stopping by! Don't hesitate to reach out if you need anything. Brilliance in Every Detail!"
  };

  function setApiKey(key) {
    apiKey = key;
  }

  async function speak(textOrKey) {
    if (muted) return;
    const text = GREETINGS[textOrKey] || textOrKey;
    queue.push(text);
    if (queue.length === 1) processQueue();
  }

  async function processQueue() {
    if (queue.length === 0) {
      isSpeaking = false;
      updateSpeakingUI(false);
      return;
    }

    isSpeaking = true;
    updateSpeakingUI(true);
    const text = queue[0];

    try {
      if (!apiKey) {
        // No API key — just show the text, no voice
        await simulateSpeaking(text);
      } else {
        await generateAndPlay(text);
      }
    } catch (err) {
      console.warn('TTS Error:', err);
    }

    queue.shift();
    processQueue();
  }

  async function generateAndPlay(text) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } }
            }
          }
        })
      }
    );

    const data = await response.json();
    const audioPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (audioPart) {
      await playLiveAudio(audioPart.inlineData);
    }
  }

  function playLiveAudio(inlineData) {
    return new Promise(async (resolve) => {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const raw = atob(inlineData.data);
      const pcmBytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) pcmBytes[i] = raw.charCodeAt(i);

      const mime = inlineData.mimeType || '';
      const rateMatch = mime.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;

      // Build WAV header
      const dataSize = pcmBytes.length;
      const wavBuffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(wavBuffer);
      const writeStr = (off, s) => {
        for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, dataSize, true);
      new Uint8Array(wavBuffer, 44).set(pcmBytes);

      const audioBuffer = await audioCtx.decodeAudioData(wavBuffer);
      currentSource = audioCtx.createBufferSource();
      currentSource.buffer = audioBuffer;
      currentSource.connect(audioCtx.destination);

      currentSource.onended = () => {
        audioCtx.close();
        audioCtx = null;
        currentSource = null;
        resolve();
      };
      currentSource.start();
    });
  }

  // Fallback: type out text without audio
  function simulateSpeaking(text) {
    return new Promise((resolve) => {
      const greeting = document.querySelector('.mascot-widget__greeting');
      if (!greeting) return resolve();

      greeting.innerHTML = '';
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          greeting.textContent += text[i];
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(resolve, 500);
        }
      }, 30);
    });
  }

  function stop() {
    queue = [];
    if (currentSource) {
      try { currentSource.stop(); } catch (e) {}
    }
    isSpeaking = false;
    updateSpeakingUI(false);
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem('arlen-tts-muted', muted);
    if (muted) stop();
    updateMuteUI();
    return muted;
  }

  function updateSpeakingUI(speaking) {
    const bubble = document.querySelector('.mascot-widget__bubble');
    if (bubble) {
      bubble.classList.toggle('speaking', speaking);
    }
  }

  function updateMuteUI() {
    const badge = document.querySelector('.mascot-widget__voice-badge');
    if (badge) {
      badge.textContent = muted ? '🔇' : '🔊';
    }
  }

  return {
    speak,
    stop,
    toggleMute,
    isMuted: () => muted,
    setApiKey,
    GREETINGS
  };
})();

// Expose globally
window.ArlenTTS = ArlenTTS;

// Auto-initialize with API key
ArlenTTS.setApiKey('AIzaSyA2njE0XVNGSz0hs6hWB9ydZ-1CH_IHX_M');
