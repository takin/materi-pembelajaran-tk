# 🎤 Multilingual Voice Input with OpenAI Whisper

This guide explains how to use voice input with OpenAI Whisper for the Robot Grid Game.

## ✨ Features

- **99+ Languages Supported** - Speak in any language!
- **High Accuracy** - OpenAI Whisper AI transcription
- **Works in All Browsers** - No browser restrictions

## Quick Setup

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-...`)

### 2. Add API Key

Create a `.env.local` file in the project root:

```bash
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Never commit this file to Git!

### 3. Restart Dev Server

```bash
# Stop (Ctrl+C) and restart
pnpm dev
```

## How It Works (Streaming Mode)

1. **Click 🎤 once** to start streaming
2. **Allow microphone access** when prompted
3. **Speak naturally** in any language - commands execute automatically every 5 seconds!
   - English: "move forward 2" → pause → "turn left" → pause → "move 3"
   - Indonesian: "maju dua" → pause → "belok kiri" → pause → "maju tiga"
   - Spanish: "avanza dos" → pause → "gira a la izquierda"
   - French: "avance deux" → pause → "tourne à gauche"
4. **Click ⏹️** when done
5. Commands execute **instantly** after transcription!

**Note:** Uses OpenAI JavaScript SDK for reliable transcription.

### Seamless Interaction

- ✅ **No button pressing** between commands
- ✅ **Continuous listening** - speak multiple commands
- ✅ **Instant execution** - see robot move as you speak
- ✅ **Real-time feedback** - see what was heard
- ✅ **Command history** - track your recent commands

## Supported Commands

The parser understands natural language in any language:

- **"move forward 3"** / **"maju tiga"** → Move 3 steps
- **"turn left"** / **"belok kiri"** → Turn left 90°
- **"turn right"** / **"belok kanan"** → Turn right 90°
- **"turn 180"** / **"putar 180"** → Turn 180°

## Supported Languages

Whisper supports **99+ languages** including:

- **English** (en)
- **Indonesian** (id)
- **Spanish** (es)
- **French** (fr)
- **German** (de)
- **Japanese** (ja)
- **Korean** (ko)
- **Chinese** (zh)
- **Arabic** (ar)
- **Hindi** (hi)
- **Portuguese** (pt)
- **Russian** (ru)
- **Italian** (it)
- **And many more!**

### Changing Language

Edit `src/components/RobotGame/index.tsx`:

```typescript
<CommandPanel
  ...
  language="id"  // Change to: 'en', 'es', 'fr', 'ja', etc.
/>
```

Or leave it empty for auto-detection:

```typescript
<CommandPanel
  ...
  language=""  // Auto-detect language
/>
```

## Browser Compatibility

✅ **All modern browsers supported!**

- Chrome, Firefox, Safari, Edge
- Desktop and Mobile
- Requires HTTPS or localhost for microphone access

## Cost

OpenAI Whisper API pricing:

- **$0.006 per minute** of audio
- Very affordable for classroom use
- Example: 10 minutes = $0.06

## Troubleshooting

### "OpenAI API key not found"

- Make sure `.env.local` file exists in project root
- Check that the variable is named exactly `VITE_OPENAI_API_KEY`
- Restart your dev server after creating/editing the file

### "Failed to access microphone"

- Click the 🔒 icon in browser address bar
- Allow microphone permissions for localhost
- Refresh the page and try again

### "No speech detected" or "Invalid file format"

- Speak clearly and closer to the microphone
- Make sure background noise isn't too loud
- Wait at least 5 seconds after speaking (chunk duration)
- Ensure audio chunks are large enough (minimum 10KB)

### API Errors

- Verify your API key is valid at [OpenAI Platform](https://platform.openai.com/account/usage)
- Check if you have available credits
- Make sure your OpenAI account is active

## How It Works Technically

1. **MediaRecorder API** captures audio from microphone
2. Audio is recorded as WebM or MP4 format in **5-second chunks**
3. Each chunk is sent to **OpenAI Whisper API** (via OpenAI JavaScript SDK)
4. Whisper transcribes speech to text (any language)
5. Text is parsed into robot commands
6. Commands execute **automatically and immediately** after transcription
7. Process repeats for continuous streaming until you click ⏹️

### Technical Stack
- **OpenAI JavaScript SDK** (`openai` npm package)
- **MediaRecorder API** for browser audio capture
- **Whisper-1 Model** for transcription
- **5-second chunking** for balance between speed and audio quality

## Questions?

For more information:

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [MDN MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
