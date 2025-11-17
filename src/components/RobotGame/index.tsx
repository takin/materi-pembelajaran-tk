import { useState, useEffect, useRef } from 'react'
import { RobotScene } from './RobotScene'
import { CommandPanel } from './CommandPanel'
import { RobotState, Command, Direction, GameConfig } from './types'
import { parseCommands } from './commandParser'

const DEFAULT_CONFIG: GameConfig = {
  gridSize: 6,
  tileSize: 1,
}

export function RobotGame() {
  const [config] = useState<GameConfig>(DEFAULT_CONFIG)

  const [robotState, setRobotState] = useState<RobotState>({
    position: { x: 2, z: 2 }, // Start in middle of grid
    rotation: Direction.NORTH,
  })
  const [goalPosition, setGoalPosition] = useState({ x: 5, z: 5 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [parsedCommands, setParsedCommands] = useState<Command[]>([])
  const [hasWon, setHasWon] = useState(false)
  const [commandQueue, setCommandQueue] = useState<Command[][]>([])
  const isProcessingQueue = useRef(false)
  const robotStateRef = useRef(robotState)
  const cheerAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioPrimedRef = useRef(false)

  // Initialize cheer audio
  useEffect(() => {
    // Create audio element for victory sound - kids cheering
    cheerAudioRef.current = new Audio('/yeey.mp3')
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
      console.log('🔓 Priming audio...')
      // Play and immediately pause to "unlock" audio for later
      cheerAudioRef.current
        .play()
        .then(() => {
          cheerAudioRef.current?.pause()
          cheerAudioRef.current!.currentTime = 0
          audioPrimedRef.current = true
          console.log('✅ Audio primed successfully!')
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
      position: { x: 2, z: 2 }, // Reset to middle of grid
      rotation: Direction.NORTH,
    })
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

      <CommandPanel
        onExecute={handleExecute}
        isAnimating={isAnimating}
        parsedCommands={parsedCommands}
        commandInput={commandInput}
        onInputChange={handleCommandInputChange}
        onUserInteraction={primeAudio}
        language="en"
      />

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
          🎉 Goal Reached! 🎉
          <div
            style={{
              fontSize: '16px',
              marginTop: '12px',
              fontWeight: 'normal',
            }}
          >
            Great job navigating the robot!
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
            Play Again
          </button>
        </div>
      )}

      {/* Instructions */}
      <div
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
      </div>
    </div>
  )
}
