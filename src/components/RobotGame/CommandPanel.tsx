import { useState } from 'react'
import { commandsToText, parseCommands } from './commandParser'
import { useVoiceInput } from './useVoiceInput'
import { Command } from './types'

interface CommandPanelProps {
  onExecute: (commands: Command[]) => void
  isAnimating: boolean
  parsedCommands: Command[]
  commandInput: string
  onInputChange: (input: string) => void
  onUserInteraction?: () => void
  autoExecuteVoice?: boolean
  apiKey?: string
  language?: string
}

export function CommandPanel({
  onExecute,
  isAnimating,
  parsedCommands,
  commandInput,
  onInputChange,
  onUserInteraction,
  apiKey,
}: CommandPanelProps) {
  const [lastHeardCommand, setLastHeardCommand] = useState<string>('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  const { isListening, isProcessing, error, toggleListening } = useVoiceInput({
    apiKey,
    streamingMode: true,
    chunkDuration: 5000, // Send audio chunks every 5 seconds (longer for more complete audio)
    onTranscript: (text, isFinal) => {
      if (isFinal && text.length > 0) {
        console.log('🎤 Voice transcript received:', text)
        setLastHeardCommand(text)
        setCommandHistory((prev) => [...prev.slice(-4), text]) // Keep last 5

        // Parse and execute immediately for seamless interaction
        const voiceCommands = parseCommands(text)

        if (voiceCommands.length > 0) {
          console.log('✅ Auto-executing voice commands:', voiceCommands)
          onExecute(voiceCommands)
        } else {
          console.log('⚠️ No commands parsed from:', text)
        }

        // Clear last heard after 2 seconds
        setTimeout(() => setLastHeardCommand(''), 4000)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (commandInput.trim() && !isAnimating) {
      // Prime audio on first interaction (fixes browser autoplay restrictions)
      onUserInteraction?.()
      onExecute(parsedCommands)
    }
  }

  const handleVoiceToggle = () => {
    // Prime audio on first interaction (fixes browser autoplay restrictions)
    onUserInteraction?.()
    toggleListening()
  }

  const examples = [
    'move 2, turn left, move 1',
    'forward 3, right, forward 2',
    'move 1, turn 180, move 1',
  ]

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '320px',
        maxWidth: '400px',
      }}
    >
      <h2
        style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}
      >
        🤖 Robot Commands
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <textarea
            value={commandInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... speak commands continuously'
                : 'Enter commands or click 🎤 for streaming voice...'
            }
            disabled={isAnimating || isListening}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              paddingRight: '50px',
              border: isListening ? '2px solid #4CAF50' : '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical',
              transition: 'border 0.2s',
            }}
          />

          {/* Voice Streaming Button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={isAnimating}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              width: '36px',
              height: '36px',
              border: 'none',
              borderRadius: '50%',
              background: isListening ? '#4CAF50' : '#4A90E2',
              color: 'white',
              fontSize: '18px',
              cursor: isAnimating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: isListening
                ? '0 0 0 4px rgba(76, 175, 80, 0.3)'
                : 'none',
            }}
            title={
              isListening
                ? 'Click to stop listening'
                : 'Click to start streaming voice'
            }
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
        </div>

        {/* Voice Error Message */}
        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: '#FFE5E5',
              color: '#D32F2F',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Streaming Indicator */}
        {isListening && (
          <div
            style={{
              padding: '8px 12px',
              background: '#E8F5E9',
              color: '#2E7D32',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4CAF50',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ flex: 1 }}>
              🎤 Streaming... Speak naturally, commands execute automatically
            </span>
            {isProcessing && (
              <span style={{ fontSize: '10px' }}>⏳ Processing...</span>
            )}
          </div>
        )}

        {/* Last Heard Command */}
        {lastHeardCommand && (
          <div
            style={{
              padding: '8px 12px',
              background: '#E3F2FD',
              color: '#1976D2',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            ✅ Heard: "<strong>{lastHeardCommand}</strong>"
          </div>
        )}

        {/* Command History */}
        {commandHistory.length > 0 && !isListening && (
          <div
            style={{
              padding: '8px 12px',
              background: '#F5F5F5',
              borderRadius: '6px',
              fontSize: '11px',
              marginBottom: '12px',
              maxHeight: '60px',
              overflow: 'auto',
            }}
          >
            <strong>Recent commands:</strong>
            <div style={{ marginTop: '4px', color: '#666' }}>
              {commandHistory.map((cmd, i) => (
                <div key={i}>• {cmd}</div>
              ))}
            </div>
          </div>
        )}

        {/* Streaming info */}
        {!isListening && !lastHeardCommand && (
          <div
            style={{
              padding: '8px 12px',
              background: '#F0F7FF',
              color: '#1976D2',
              borderRadius: '6px',
              fontSize: '11px',
              marginBottom: '12px',
            }}
          >
            💡 Click 🎤 to start streaming mode - speak naturally and commands
            execute automatically!
          </div>
        )}

        <button
          type="submit"
          disabled={!commandInput.trim() || isAnimating}
          style={{
            width: '100%',
            padding: '12px',
            background: isAnimating ? '#ccc' : '#4A90E2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isAnimating ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {isAnimating ? '⏳ Running...' : '▶️ Run Commands'}
        </button>
      </form>

      {parsedCommands.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f0f7ff',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        >
          <strong>Parsed:</strong>
          <div style={{ marginTop: '6px', color: '#666' }}>
            {commandsToText(parsedCommands)}
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#999',
            }}
          >
            JSON: {JSON.stringify(parsedCommands)}
          </div>
        </div>
      )}

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <strong>Examples:</strong>
        <ul style={{ margin: '6px 0', paddingLeft: '20px' }}>
          {examples.map((ex, i) => (
            <li
              key={i}
              style={{ cursor: 'pointer', marginBottom: '4px' }}
              onClick={() => !isAnimating && onInputChange(ex)}
            >
              {ex}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#999' }}>
        <strong>Supported commands:</strong> move/forward [n], turn left/right,
        turn [degrees]
      </div>

      <div
        style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#4A90E2',
          fontWeight: '500',
        }}
      >
        🎙️ Streaming Mode: Click 🎤 once, speak continuously!
      </div>

      <div
        style={{
          marginTop: '4px',
          fontSize: '10px',
          color: '#666',
        }}
      >
        🌍 99+ languages • Commands execute instantly • Click ⏹️ to stop
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
