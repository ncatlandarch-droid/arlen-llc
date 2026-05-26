/* ============================================
   ARLAN LLC - Mascot TTS Engine
   Pre-recorded WAV + Live Gemini TTS fallback
   Voice: Enceladus (warm, friendly male)
   ============================================ */

const ArlanTTS = (() => {
  const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
  const VOICE_NAME = 'Enceladus';
  let apiKey = null;
  let isSpeaking = false;
  let queue = [];
  let muted = localStorage.getItem('arlan-tts-muted') === 'true';
  let audioCtx = null;
  let currentSource = null;
  let currentAudioEl = null;

  // Pre-recorded WAV files for instant playback
  const PRE_RECORDED = {
    welcome:   'assets/audio/arlan-welcome.wav',
    quote:     'assets/audio/arlan-quote.wav',
    services:  'assets/audio/arlan-services.wav',
    merch:     'assets/audio/arlan-merch.wav',
    drone:     'assets/audio/arlan-drone.wav',
    goodbye:   'assets/audio/arlan-goodbye.wav',
    about:     'assets/audio/arlan-about.wav',
    portfolio: 'assets/audio/arlan-portfolio.wav'
  };

  // Greeting text (shown in chat bubble + used for live TTS fallback)
  const GREETINGS = {
    welcome:   "Hey there! Welcome to Arlan! I'm your friendly guide. Need a free quote, want to explore our services, or just have a question? I'm here to help!",
    quote:     "Great choice! Let me take you to our quote page where Dylan can get you set up with a custom lighting plan.",
    services:  "We've got five amazing services! Holiday lighting, permanent LED systems, landscape lighting, window cleaning, and drone roof inspections. Which one catches your eye?",
    merch:     "Check out the Arlan gear! We've got t-shirts, hoodies, hats, and polos. Looking good while supporting the team!",
    drone:     "Our drone service is awesome! We can do aerial roof inspections and even create 3D digital twins of your property. Pretty cool, right?",
    goodbye:   "Thanks for stopping by! Don't hesitate to reach out if you need anything. Brilliance in Every Detail!",
    about:     "Dylan started Arlan with a simple vision: bring brilliance to every property. And I get to be the mascot! Best job ever.",
    portfolio: "Check out some of our best work! Every project is a custom design tailored to the property."
  };

  function setApiKey(key) { apiKey = key; }

  async function speak(textOrKey) {
    if (muted) return;
    const isKey = !!GREETINGS[textOrKey];
    const text = GREETINGS[textOrKey] || textOrKey;
    queue.push({ text, key: isKey ? textOrKey : null });
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
    const { text, key } = queue[0];

    try {
      // Strategy: pre-recorded WAV first, live TTS fallback
      if (key && PRE_RECORDED[key]) {
        const played = await playPreRecorded(PRE_RECORDED[key]);
        if (!played && apiKey) {
          await generateAndPlay(text);
        } else if (!played) {
          await simulateSpeaking(text);
        }
      } else if (apiKey) {
        await generateAndPlay(text);
      } else {
        await simulateSpeaking(text);
      }
    } catch (err) {
      console.warn('TTS Error:', err);
    }

    queue.shift();
    processQueue();
  }

  // Play pre-recorded WAV file (instant, no API call)
  function playPreRecorded(src) {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      currentAudioEl = audio;

      audio.onended = () => {
        currentAudioEl = null;
        resolve(true);
      };

      audio.onerror = () => {
        console.warn('Pre-recorded file not found:', src);
        currentAudioEl = null;
        resolve(false); // Fallback to live TTS
      };

      audio.play().catch(() => {
        currentAudioEl = null;
        resolve(false);
      });
    });
  }

  // Live Gemini TTS (fallback for dynamic text)
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
    if (currentAudioEl) {
      try { currentAudioEl.pause(); currentAudioEl.currentTime = 0; } catch (e) {}
      currentAudioEl = null;
    }
    isSpeaking = false;
    updateSpeakingUI(false);
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem('arlan-tts-muted', muted);
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
      badge.innerHTML = muted ? '&#128263;' : '&#128266;';
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
window.ArlanTTS = ArlanTTS;

// Auto-initialize with API key (fallback for non-pre-recorded phrases)
ArlanTTS.setApiKey('AIzaSyA2njE0XVNGSz0hs6hWB9ydZ-1CH_IHX_M');
