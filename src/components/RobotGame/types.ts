// Types for the Robot Grid Game

export interface Position {
  x: number
  z: number
}

export interface RobotState {
  position: Position
  rotation: number // in degrees (0 = facing +Z, 90 = facing +X, etc.)
}

export enum Direction {
  NORTH = 0, // facing +Z
  EAST = 90, // facing +X
  SOUTH = 180, // facing -Z
  WEST = 270, // facing -X
}

export interface Command {
  type: 'move' | 'turn' | 'turnLeft' | 'turnRight'
  value?: number // for move: steps, for turn: degrees
}

export interface GameConfig {
  gridSize: number
  tileSize: number
}

