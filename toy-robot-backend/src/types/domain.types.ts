// Core domain types for the robot simulator

export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
}

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface RobotState {
  readonly position: Position | null;
  readonly direction: Direction;
  readonly isPlaced: boolean;
}

export type Command = 'PLACE' | 'MOVE' | 'LEFT' | 'RIGHT' | 'REPORT';

export interface PlaceCommand {
  readonly type: 'PLACE';
  readonly x: number;
  readonly y: number;
  readonly direction: Direction;
}

export interface SimpleCommand {
  readonly type: 'MOVE' | 'LEFT' | 'RIGHT' | 'REPORT';
}

export type RobotCommand = PlaceCommand | SimpleCommand;

// Constants
export const TABLE_SIZE = 5;
export const MIN_COORDINATE = 0;
export const MAX_COORDINATE = TABLE_SIZE - 1;

// Direction mappings for declarative transformations
export const DIRECTION_MAPPINGS = {
  [Direction.NORTH]: { x: 0, y: 1 },
  [Direction.SOUTH]: { x: 0, y: -1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.WEST]: { x: -1, y: 0 },
} as const;

export const LEFT_TURNS = {
  [Direction.NORTH]: Direction.WEST,
  [Direction.WEST]: Direction.SOUTH,
  [Direction.SOUTH]: Direction.EAST,
  [Direction.EAST]: Direction.NORTH,
} as const;

export const RIGHT_TURNS = {
  [Direction.NORTH]: Direction.EAST,
  [Direction.EAST]: Direction.SOUTH,
  [Direction.SOUTH]: Direction.WEST,
  [Direction.WEST]: Direction.NORTH,
} as const;
