import { useState, useEffect, useRef } from 'react'
import { RobotScene } from './RobotScene'
import { CommandPanel } from './CommandPanel'
import { RobotState, Command, Direction, GameConfig } from './types'
import { parseCommands } from './commandParser'
import { useVoiceInput } from './useVoiceInput'

const DEFAULT_CONFIG: GameConfig = {
  gridSize: 6,
  tileSize: 1,
}

const randomizePosition = (gridSize: number) => {
  return {
    x: Math.floor(Math.random() * gridSize),
    z: Math.floor(Math.random() * gridSize),
  }
}

const randomizeGoalPosition = (gridSize: number) => {
  return {
    x: Math.floor(Math.random() * gridSize),
    z: Math.floor(Math.random() * gridSize),
  }
}

const randomizeRotation = (): Direction => {
  return Math.floor(Math.random() * 4) as unknown as Direction
}

export function RobotGame() {
  const [config] = useState<GameConfig>(DEFAULT_CONFIG)

  const [robotState, setRobotState] = useState<RobotState>({
    position: randomizePosition(config.gridSize), // Start in middle of grid
    rotation: randomizeRotation(),
  })
  const [goalPosition, setGoalPosition] = useState(
    randomizeGoalPosition(config.gridSize),
  )
  const [isAnimating, setIsAnimating] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [parsedCommands, setParsedCommands] = useState<Command[]>([])
  const [hasWon, setHasWon] = useState(false)
  const [commandQueue, setCommandQueue] = useState<Command[][]>([])
  const [showCommands, setShowCommands] = useState(false) // Default to hidden
  const [lastHeardCommand, setLastHeardCommand] = useState<string>('')
  const isProcessingQueue = useRef(false)
  const robotStateRef = useRef(robotState)
  const cheerAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioPrimedRef = useRef(false)

  // Voice input hook
  const {
    isListening,
    isProcessing,
    error: voiceError,
    toggleListening,
  } = useVoiceInput({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    streamingMode: true,
    chunkDuration: 3000,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.length > 0) {
        console.log('🎤 Voice transcript received:', text)
        setLastHeardCommand(text)

        const voiceCommands = parseCommands(text)
        if (voiceCommands.length > 0) {
          console.log('✅ Auto-executing voice commands:', voiceCommands)
          handleExecute(voiceCommands)
        }

        setTimeout(() => setLastHeardCommand(''), 2000)
      }
    },
  })

  // Initialize cheer audio
  useEffect(() => {
    // Create audio element for victory sound - kids cheering
    cheerAudioRef.current = new Audio('/audio/yeey.mp3')
    cheerAudioRef.current.volume = 0.6 // 60% volume

    // Preload the audio
    cheerAudioRef.current.load()

    // Add error handler
    cheerAudioRef.current.onerror = (e) => {
      console.error('Failed to load victory audio:', e)
    }

    return () => {
      if (cheerAudioRef.current) {
        cheerAudioRef.current.pause()
        cheerAudioRef.current = null
      }
    }
  }, [])

  // Prime audio on first user interaction (browser autoplay restriction workaround)
  const primeAudio = () => {
    if (!audioPrimedRef.current && cheerAudioRef.current) {
      // Play and immediately pause to "unlock" audio for later
      cheerAudioRef.current
        .play()
        .then(() => {
          cheerAudioRef.current?.pause()
          cheerAudioRef.current!.currentTime = 0
          audioPrimedRef.current = true
        })
        .catch((err) => {
          console.error('⚠️ Audio priming failed:', err)
        })
    }
  }

  useEffect(() => {
    // randomize the initial position of the robot
    setRobotState({
      position: {
        x: Math.floor(Math.random() * config.gridSize),
        z: Math.floor(Math.random() * config.gridSize),
      },
      rotation: Direction.NORTH,
    })

    // randomize the initial position of the goal
    // but it should be different from the initial position of the robot
    setGoalPosition({
      x: Math.floor(Math.random() * config.gridSize),
      z: Math.floor(Math.random() * config.gridSize),
    })
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    robotStateRef.current = robotState
  }, [robotState])

  // Update command input state
  const handleCommandInputChange = (input: string) => {
    setCommandInput(input)
    const commands = parseCommands(input)
    setParsedCommands(commands)
  }

  // Check win condition
  useEffect(() => {
    if (
      robotState.position.x === goalPosition.x &&
      robotState.position.z === goalPosition.z
    ) {
      setHasWon(true)
    }
  }, [robotState.position, goalPosition])

  // Play cheer sound when won
  useEffect(() => {
    if (hasWon && cheerAudioRef.current) {
      console.log('🎊 Playing victory sound!')
      cheerAudioRef.current.currentTime = 0 // Reset to start
      cheerAudioRef.current
        .play()
        .then(() => {
          console.log('✅ Victory sound played successfully!')
        })
        .catch((err) => {
          console.error('❌ Audio play failed:', err)
          console.log('Audio primed?', audioPrimedRef.current)
        })
    }
  }, [hasWon])

  // Spacebar toggle for voice commands
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle voice on spacebar press (not typing in an input)
      if (
        e.code === 'Space' &&
        !isAnimating &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault() // Prevent page scroll

        if (isListening) {
          console.log('🛑 Spacebar pressed - Stopping voice input')
        } else {
          console.log('🎤 Spacebar pressed - Starting voice input')
          primeAudio()
        }

        toggleListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAnimating, isListening, toggleListening, primeAudio])

  const executeCommands = async (commands: Command[]) => {
    if (commands.length === 0) return

    setIsAnimating(true)

    // Use ref to get the CURRENT robot state (not stale closure)
    let currentState = { ...robotStateRef.current }
    console.log('🎯 Starting execution from state:', currentState)

    for (const command of commands) {
      // Wait for animation
      // await new Promise((resolve) => setTimeout(resolve, 500))

      switch (command.type) {
        case 'move': {
          const steps = command.value || 1
          // Visual applies -rotation, so we use -radians to match visual direction
          const radians = -(currentState.rotation * Math.PI) / 180

          console.log(
            '🚶 Moving',
            steps,
            'steps from',
            currentState.position,
            'at rotation',
            currentState.rotation,
            '°',
          )

          // Calculate direction vector
          // Remove the negation from dx to fix backwards movement at 90° and 270°
          const dx = Math.round(Math.sin(radians))
          const dz = Math.round(Math.cos(radians))

          console.log('📐 Direction vector: dx=', dx, 'dz=', dz)

          // Move (with boundary check)
          for (let i = 0; i < steps; i++) {
            const newX = currentState.position.x + dx
            const newZ = currentState.position.z + dz

            console.log(
              '➡️ Step',
              i + 1,
              ': trying to move to (',
              newX,
              ',',
              newZ,
              ')',
            )

            // Check boundaries
            if (
              newX >= 0 &&
              newX < config.gridSize &&
              newZ >= 0 &&
              newZ < config.gridSize
            ) {
              currentState = {
                ...currentState,
                position: { x: newX, z: newZ },
              }
              setRobotState(currentState)
              robotStateRef.current = currentState // Update ref immediately
              console.log('✅ Moved to', currentState.position)
              await new Promise((resolve) => setTimeout(resolve, 300))
            } else {
              console.log('❌ Move blocked: out of bounds!')
            }
          }
          break
        }

        case 'turnLeft': {
          currentState = {
            ...currentState,
            rotation: (currentState.rotation - 90 + 360) % 360,
          }
          setRobotState(currentState)
          robotStateRef.current = currentState // Update ref immediately
          console.log('↺ Turned left to', currentState.rotation, '°')
          break
        }

        case 'turnRight': {
          currentState = {
            ...currentState,
            rotation: (currentState.rotation + 90) % 360,
          }
          setRobotState(currentState)
          robotStateRef.current = currentState // Update ref immediately
          console.log('↻ Turned right to', currentState.rotation, '°')
          break
        }

        case 'turnAround': {
          currentState = {
            ...currentState,
            rotation: (currentState.rotation + 180) % 360,
          }
          setRobotState(currentState)
          robotStateRef.current = currentState // Update ref immediately
          console.log('🔄 Turned around to', currentState.rotation, '°')
          break
        }

        case 'turn': {
          const degrees = command.value || 0
          currentState = {
            ...currentState,
            rotation: (currentState.rotation + degrees + 360) % 360,
          }
          setRobotState(currentState)
          robotStateRef.current = currentState // Update ref immediately
          console.log('🔄 Turned', degrees, '° to', currentState.rotation, '°')
          break
        }
      }
    }

    setIsAnimating(false)
    console.log('🏁 Execution complete. Final state:', currentState)
  }

  // Process command queue
  useEffect(() => {
    const processQueue = async () => {
      // Don't process if already processing or queue is empty
      if (isProcessingQueue.current || commandQueue.length === 0) {
        return
      }

      console.log('📦 Queue state:', {
        length: commandQueue.length,
        isAnimating,
      })

      isProcessingQueue.current = true
      const nextCommands = commandQueue[0]

      console.log('🎮 Processing queued commands:', nextCommands)
      console.log('🤖 React state BEFORE execution:', robotState)
      console.log('📌 Ref state BEFORE execution:', robotStateRef.current)

      await executeCommands(nextCommands)

      console.log('✅ Finished processing, removing from queue')
      console.log('🤖 React state AFTER execution:', robotState)
      console.log('📌 Ref state AFTER execution:', robotStateRef.current)

      setCommandQueue((prev) => prev.slice(1))
      isProcessingQueue.current = false
    }

    processQueue()
  }, [commandQueue])

  const handleExecute = (commands: Command[]) => {
    console.log('📥 Adding commands to queue:', commands)

    // Prime audio on first interaction (fixes browser autoplay restrictions)
    primeAudio()

    setCommandInput('') // Clear input after execution

    // Add to queue instead of executing directly
    setCommandQueue((prev) => [...prev, commands])
  }

  const handleReset = () => {
    // Prime audio on first interaction (fixes browser autoplay restrictions)
    primeAudio()

    setRobotState({
      position: randomizePosition(config.gridSize),
      rotation: randomizeRotation(),
    })
    setGoalPosition(randomizeGoalPosition(config.gridSize))
    setHasWon(false)
    setCommandInput('')
    setParsedCommands([])
    setCommandQueue([])
    isProcessingQueue.current = false
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f0f4f8',
        position: 'relative',
      }}
    >
      <RobotScene
        robotState={robotState}
        goalPosition={goalPosition}
        config={config}
        isAnimating={isAnimating}
      />

      {/* Floating toggle button for command panel */}
      <button
        onClick={() => {
          primeAudio()
          setShowCommands(!showCommands)
        }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '12px 16px',
          background: showCommands ? '#f44336' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
        }}
      >
        {showCommands ? '✖️ Hide' : '🎮 Show'} Commands
      </button>

      {/* Command panel - conditionally rendered */}
      {showCommands && (
        <CommandPanel
          onExecute={handleExecute}
          isAnimating={isAnimating}
          parsedCommands={parsedCommands}
          commandInput={commandInput}
          onInputChange={handleCommandInputChange}
          onUserInteraction={primeAudio}
          language="en"
        />
      )}

      {/* Floating voice command button - bottom center */}
      <button
        onClick={() => {
          primeAudio()
          toggleListening()
        }}
        disabled={isAnimating}
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px',
          background: isListening
            ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: isAnimating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: isListening
            ? '0 4px 20px rgba(255, 107, 107, 0.5), 0 0 0 0 rgba(255, 107, 107, 0.7)'
            : '0 4px 20px rgba(102, 126, 234, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.3s ease',
          opacity: isAnimating ? 0.5 : 1,
          animation: isListening ? 'pulse 1.5s infinite' : 'none',
        }}
      >
        <span style={{ fontSize: '20px' }}>{isListening ? '🎤' : '🎙️'}</span>
        <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
        {isProcessing && <span style={{ fontSize: '12px' }}>⏳</span>}
      </button>

      {/* Spacebar hint */}
      <div
        style={{
          position: 'absolute',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          borderRadius: '6px',
          fontSize: '12px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isAnimating ? 0.3 : 0.8,
        }}
      >
        <kbd
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          SPACE
        </kbd>
        <span>Press to {isListening ? 'stop' : 'speak'}</span>
      </div>

      {/* Last heard command - floating display */}
      {lastHeardCommand && (
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            background: 'rgba(76, 175, 80, 0.95)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          ✅ "{lastHeardCommand}"
        </div>
      )}

      {/* Voice error display */}
      {voiceError && (
        <div
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            background: 'rgba(244, 67, 54, 0.95)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          ❌ {voiceError}
        </div>
      )}

      {/* CSS animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 20px rgba(255, 107, 107, 0.5), 0 0 0 0 rgba(255, 107, 107, 0.7);
          }
          50% {
            box-shadow: 0 4px 20px rgba(255, 107, 107, 0.5), 0 0 0 15px rgba(255, 107, 107, 0);
          }
          100% {
            box-shadow: 0 4px 20px rgba(255, 107, 107, 0.5), 0 0 0 0 rgba(255, 107, 107, 0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      {/* Status panel */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '200px',
        }}
      >
        <h3
          style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}
        >
          📊 Status
        </h3>
        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
          <div>
            <strong>Position:</strong> ({robotState.position.x},{' '}
            {robotState.position.z})
          </div>
          <div>
            <strong>Rotation:</strong> {robotState.rotation}°
          </div>
          <div>
            <strong>Goal:</strong> ({goalPosition.x}, {goalPosition.z})
          </div>
          {commandQueue.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px',
                background: '#E3F2FD',
                borderRadius: '4px',
                color: '#1976D2',
              }}
            >
              <strong>Queue:</strong> {commandQueue.length} command
              {commandQueue.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '8px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Win message */}
      {hasWon && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(76, 175, 80, 0.95)',
            color: 'white',
            padding: '32px 48px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          🎉 Misi Tercapai! 🎉
          <div
            style={{
              fontSize: '16px',
              marginTop: '12px',
              fontWeight: 'normal',
            }}
          >
            Selamat! Kamu berhasil mengarahkan robot!
          </div>
          <button
            onClick={handleReset}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: 'white',
              color: '#4CAF50',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Mainkan Lagi
          </button>
        </div>
      )}

      {/* Instructions */}
      {/* <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '13px',
          textAlign: 'center',
        }}
      >
        🎮 Navigate the robot to the golden star! | 🖱️ Drag to rotate view | 🔍
        Scroll to zoom
      </div> */}
    </div>
  )
}
