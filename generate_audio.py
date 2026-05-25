"""
Pre-record all of Arlen's standard greetings as WAV files
using Gemini Neural TTS (Enceladus voice).
"""
import json, base64, struct, os, urllib.request

API_KEY = "AIzaSyA2njE0XVNGSz0hs6hWB9ydZ-1CH_IHX_M"
MODEL = "gemini-2.5-flash-preview-tts"
VOICE = "Enceladus"
OUT_DIR = r"c:\Users\Chris\Desktop\WEBSITES\ARLEN, LLC\assets\audio"

GREETINGS = {
    "welcome": "Hey there! Welcome to Arlen! I'm your friendly guide. Need a free quote, want to explore our services, or just have a question? I'm here to help!",
    "quote": "Great choice! Let me take you to our quote page where Dylan can get you set up with a custom lighting plan.",
    "services": "We've got five amazing services! Holiday lighting, permanent LED systems, landscape lighting, window cleaning, and drone roof inspections. Which one catches your eye?",
    "merch": "Check out the Arlen gear! We've got t-shirts, hoodies, hats, and polos. Looking good while supporting the team!",
    "drone": "Our drone service is awesome! We can do aerial roof inspections and even create 3D digital twins of your property. Pretty cool, right?",
    "goodbye": "Thanks for stopping by! Don't hesitate to reach out if you need anything. Brilliance in Every Detail!",
    "about": "Dylan started Arlen with a simple vision: bring brilliance to every property. And I get to be the mascot! Best job ever.",
    "portfolio": "Check out some of our best work! Every project is a custom design tailored to the property."
}

os.makedirs(OUT_DIR, exist_ok=True)

def generate_wav(text, filename):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}
            }
        }
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        audio_part = None
        for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
            if "inlineData" in part:
                audio_part = part["inlineData"]
                break
        
        if not audio_part:
            print(f"  ERROR: No audio in response for {filename}")
            return False
        
        # Decode PCM
        pcm = base64.b64decode(audio_part["data"])
        mime = audio_part.get("mimeType", "")
        rate_str = ""
        for segment in mime.split(";"):
            if "rate=" in segment:
                rate_str = segment.split("rate=")[1].strip()
        sample_rate = int(rate_str) if rate_str else 24000
        
        # Build WAV
        num_channels = 1
        bits_per_sample = 16
        byte_rate = sample_rate * num_channels * bits_per_sample // 8
        block_align = num_channels * bits_per_sample // 8
        data_size = len(pcm)
        
        wav_path = os.path.join(OUT_DIR, filename)
        with open(wav_path, "wb") as f:
            # RIFF header
            f.write(b"RIFF")
            f.write(struct.pack("<I", 36 + data_size))
            f.write(b"WAVE")
            # fmt chunk
            f.write(b"fmt ")
            f.write(struct.pack("<I", 16))
            f.write(struct.pack("<H", 1))  # PCM
            f.write(struct.pack("<H", num_channels))
            f.write(struct.pack("<I", sample_rate))
            f.write(struct.pack("<I", byte_rate))
            f.write(struct.pack("<H", block_align))
            f.write(struct.pack("<H", bits_per_sample))
            # data chunk
            f.write(b"data")
            f.write(struct.pack("<I", data_size))
            f.write(pcm)
        
        size_kb = os.path.getsize(wav_path) // 1024
        print(f"  OK: {filename} ({size_kb} KB, {sample_rate}Hz)")
        return True
    
    except Exception as e:
        print(f"  ERROR: {filename}: {e}")
        return False

print(f"Generating {len(GREETINGS)} pre-recorded greetings...")
print(f"Voice: {VOICE}")
print(f"Output: {OUT_DIR}\n")

success = 0
for key, text in GREETINGS.items():
    fname = f"arlen-{key}.wav"
    print(f"Recording: {key}...")
    if generate_wav(text, fname):
        success += 1

print(f"\nDone! {success}/{len(GREETINGS)} recordings saved.")
