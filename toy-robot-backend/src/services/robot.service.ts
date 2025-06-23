import { Injectable, Inject } from '@nestjs/common';
import {
  Direction,
  Position,
  RobotState,
  MIN_COORDINATE,
  MAX_COORDINATE,
  DIRECTION_MAPPINGS,
  LEFT_TURNS,
  RIGHT_TURNS,
} from '../types/domain.types';
import { Robot, RobotHistory, RobotAttributes } from '../models/robot.model';

@Injectable()
export class RobotService {
  constructor(
    @Inject('ROBOT_REPOSITORY')
    private robotRepository: typeof Robot,
    @Inject('ROBOT_HISTORY_REPOSITORY')
    private robotHistoryRepository: typeof RobotHistory,
  ) {}

  // Pure function: Validate if position is within table bounds
  private isValidPosition = (x: number, y: number): boolean => {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= MIN_COORDINATE &&
      x <= MAX_COORDINATE &&
      y >= MIN_COORDINATE &&
      y <= MAX_COORDINATE
    );
  };

  // Pure function: Create new robot state for placement
  private createPlacedRobotState = (
    x: number,
    y: number,
    direction: Direction,
  ): Partial<RobotState> => ({
    position: { x, y },
    direction,
    isPlaced: true,
  });

  // Pure function: Calculate next position based on current state
  private calculateNextPosition = (
    currentState: RobotState,
  ): Position | null => {
    if (!currentState.isPlaced || !currentState.position) {
      return null;
    }

    const movement = DIRECTION_MAPPINGS[currentState.direction];
    const nextPosition = {
      x: currentState.position.x + movement.x,
      y: currentState.position.y + movement.y,
    };

    return this.isValidPosition(nextPosition.x, nextPosition.y)
      ? nextPosition
      : null;
  };

  // Pure function: Create new robot state after movement
  private createMovedRobotState = (
    currentState: RobotState,
    newPosition: Position,
  ): Partial<RobotState> => ({
    ...currentState,
    position: newPosition,
  });

  // Pure function: Create new robot state after left turn
  private createLeftTurnedRobotState = (
    currentState: RobotState,
  ): Partial<RobotState> => ({
    ...currentState,
    direction: LEFT_TURNS[currentState.direction],
  });

  // Pure function: Create new robot state after right turn
  private createRightTurnedRobotState = (
    currentState: RobotState,
  ): Partial<RobotState> => ({
    ...currentState,
    direction: RIGHT_TURNS[currentState.direction],
  });

  // Pure function: Convert database model to domain state
  private toDomainState = (robot: Robot): RobotState => {
    // Use toJSON() to get the actual database values
    const data = robot.toJSON();

    return {
      position:
        data.x !== null &&
        data.y !== null &&
        data.x !== undefined &&
        data.y !== undefined
          ? { x: Number(data.x), y: Number(data.y) }
          : null,
      direction: data.direction || Direction.NORTH,
      isPlaced: Boolean(data.isPlaced),
    };
  };

  // Pure function: Convert domain state to database attributes
  private toModelAttributes = (
    state: Partial<RobotState>,
  ): RobotAttributes => ({
    x: state.position?.x ?? null,
    y: state.position?.y ?? null,
    direction: state.direction ?? Direction.NORTH,
    isPlaced: state.isPlaced ?? false,
  });

  // Get current robot state
  async getCurrentRobotState(): Promise<RobotState> {
    const robot = await this.robotRepository.findOne({
      order: [['updatedAt', 'DESC']],
    });

    if (!robot) {
      // Return default unplaced state
      return {
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      };
    }

    return this.toDomainState(robot);
  }

  // Place robot at specified position
  async placeRobot(
    x: number,
    y: number,
    direction: Direction,
  ): Promise<RobotState> {
    console.log('placeRobot - input:', { x, y, direction });

    // Validate position using pure function
    if (!this.isValidPosition(x, y)) {
      throw new Error(
        `Invalid position: (${x}, ${y}). Must be within 0-${MAX_COORDINATE}.`,
      );
    }

    // Create new state using pure function
    const newState = this.createPlacedRobotState(x, y, direction);
    console.log('placeRobot - newState:', newState);

    // Convert to model attributes
    const modelAttributes = this.toModelAttributes(newState);
    console.log('placeRobot - modelAttributes:', modelAttributes);

    // Persist to database
    const robot = await this.robotRepository.create(modelAttributes);
    console.log('placeRobot - created robot:', robot.toJSON());

    // Record in history
    await this.robotHistoryRepository.create({
      x,
      y,
      direction,
      action: 'PLACE',
    });

    const result = this.toDomainState(robot);
    console.log('placeRobot - final result:', result);
    return result;
  }

  // Move robot forward
  async moveRobot(): Promise<RobotState> {
    const currentState = await this.getCurrentRobotState();

    if (!currentState.isPlaced) {
      throw new Error('Robot must be placed on the table before moving.');
    }

    // Calculate next position using pure function
    const nextPosition = this.calculateNextPosition(currentState);

    if (!nextPosition) {
      throw new Error('Move would cause robot to fall off table.');
    }

    // Create new state using pure function
    const newState = this.createMovedRobotState(currentState, nextPosition);

    // Persist to database
    const robot = await this.robotRepository.create(
      this.toModelAttributes(newState),
    );

    // Record in history
    await this.robotHistoryRepository.create({
      x: nextPosition.x,
      y: nextPosition.y,
      direction: currentState.direction,
      action: 'MOVE',
    });

    return this.toDomainState(robot);
  }

  // Turn robot left
  async turnLeft(): Promise<RobotState> {
    const currentState = await this.getCurrentRobotState();

    if (!currentState.isPlaced) {
      throw new Error('Robot must be placed on the table before turning.');
    }

    // Create new state using pure function
    const newState = this.createLeftTurnedRobotState(currentState);

    // Persist to database
    const robot = await this.robotRepository.create(
      this.toModelAttributes(newState),
    );

    // Record in history (position stays same, only direction changes)
    if (currentState.position) {
      await this.robotHistoryRepository.create({
        x: currentState.position.x,
        y: currentState.position.y,
        direction: newState.direction!,
        action: 'LEFT',
      });
    }

    return this.toDomainState(robot);
  }

  // Turn robot right
  async turnRight(): Promise<RobotState> {
    const currentState = await this.getCurrentRobotState();

    if (!currentState.isPlaced) {
      throw new Error('Robot must be placed on the table before turning.');
    }

    // Create new state using pure function
    const newState = this.createRightTurnedRobotState(currentState);

    // Persist to database
    const robot = await this.robotRepository.create(
      this.toModelAttributes(newState),
    );

    // Record in history (position stays same, only direction changes)
    if (currentState.position) {
      await this.robotHistoryRepository.create({
        x: currentState.position.x,
        y: currentState.position.y,
        direction: newState.direction!,
        action: 'RIGHT',
      });
    }

    return this.toDomainState(robot);
  }

  // Get robot status report
  async getReport(): Promise<string> {
    const currentState = await this.getCurrentRobotState();

    if (!currentState.isPlaced || !currentState.position) {
      return 'Robot is not placed on the table.';
    }

    return `${currentState.position.x},${currentState.position.y},${currentState.direction}`;
  }

  // Get robot position history
  async getHistory(): Promise<
    Array<{
      x: number;
      y: number;
      direction: Direction;
      action: string;
      timestamp: Date;
    }>
  > {
    const history = await this.robotHistoryRepository.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50, // Limit to last 50 actions
    });

    return history.map((record) => ({
      x: record.x,
      y: record.y,
      direction: record.direction,
      action: record.action,
      timestamp: record.createdAt,
    }));
  }

  // Validate command without executing (useful for UI validation)
  async validateCommand(
    command: string,
    x?: number,
    y?: number,
  ): Promise<boolean> {
    const currentState = await this.getCurrentRobotState();

    switch (command.toUpperCase()) {
      case 'PLACE': {
        return x !== undefined && y !== undefined && this.isValidPosition(x, y);
      }

      case 'MOVE': {
        if (!currentState.isPlaced) return false;
        const nextPosition = this.calculateNextPosition(currentState);
        return nextPosition !== null;
      }

      case 'LEFT':
      case 'RIGHT':
      case 'REPORT': {
        return currentState.isPlaced;
      }

      default: {
        return false;
      }
    }
  }
}
