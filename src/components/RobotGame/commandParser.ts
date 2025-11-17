import { Command } from './types'

// Map word numbers to digits
const wordToNumber: Record<string, number> = {
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
}

/**
 * Parse text commands into structured JSON format
 *
 * Supported commands:
 * - "move forward 3" / "forward 2" / "move 1" / "move two"
 * - "turn left" / "left"
 * - "turn right" / "right"
 * - "turn 90" / "rotate 180"
 *
 * Can also parse multiple commands:
 * - "move 2, turn left, move 1"
 */
export function parseCommands(input: string): Command[] {
  const commands: Command[] = []

  console.log('🎤 Parsing input:', input)

  // Split by comma, newline, "and", "then" to support multiple commands
  const parts = input
    .toLowerCase()
    .split(/[,\n]|\s+lalu\s+|\s+kemudian\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const part of parts) {
    console.log('  📝 Processing part:', JSON.stringify(part))

    // Check if it's a move command first
    const hasMoveKeyword = part.includes('jalan') || part.includes('maju')

    if (hasMoveKeyword) {
      // Match "move forward X" or "move X" or "forward X" (with digit or word)
      const moveMatch = part.match(
        /(?:jalan\s+)?(?:maju\s+)?(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)/,
      )
      if (moveMatch) {
        const numStr = moveMatch[1]
        const num = /^\d+$/.test(numStr)
          ? parseInt(numStr, 10)
          : wordToNumber[numStr] || 1
        commands.push({
          type: 'move',
          value: num,
        })
        console.log(
          '    ✅ Matched MOVE:',
          num,
          'from part:',
          JSON.stringify(part),
        )
        continue
      } else {
        // Has move keyword but no number - default to 1
        console.log('    ⚠️ Found "move" but no number, defaulting to 1')
        commands.push({
          type: 'move',
          value: 1,
        })
        continue
      }
    }

    // Match "turn left" or "left"
    if (part.match(/(?:belok\s+)?kiri/)) {
      commands.push({ type: 'turnLeft' })
      console.log('    ✅ Matched TURN LEFT')
      continue
    }

    // Match "turn right" or "right"
    if (part.match(/(?:belok\s+)?kanan/)) {
      commands.push({ type: 'turnRight' })
      console.log('    ✅ Matched TURN RIGHT')
      continue
    }

    // Match "turn X" or "rotate X" (in degrees)
    const turnMatch = part.match(/(?:putar\s+)?(-?\d+)/)
    if (turnMatch) {
      commands.push({
        type: 'turn',
        value: parseInt(turnMatch[1], 10),
      })
      console.log('    ✅ Matched TURN:', turnMatch[1])
      continue
    }

    console.log('    ❌ No match found for:', part)
  }

  console.log('🎯 Final commands:', commands)
  return commands
}

/**
 * Convert commands to readable text
 */
export function commandsToText(commands: Command[]): string {
  return commands
    .map((cmd) => {
      switch (cmd.type) {
        case 'move':
          return `Jalan maju ${cmd.value} langkah`
        case 'turnLeft':
          return 'Belok kiri'
        case 'turnRight':
          return 'Belok kanan'
        case 'turn':
          return `Putar ${cmd.value}°`
        default:
          return 'Perintah tidak dikenal'
      }
    })
    .join(', ')
}
