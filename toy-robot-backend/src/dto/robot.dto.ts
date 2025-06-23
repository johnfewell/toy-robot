import { Direction } from '../types/domain.types';

export class PlaceRobotDto {
  x: number;
  y: number;
  direction: Direction;
}

export class ValidateCommandDto {
  x?: number;
  y?: number;
  direction?: Direction;
}

export class RobotStateResponseDto {
  position: { x: number; y: number } | null;
  direction: Direction;
  isPlaced: boolean;
}

export class RobotHistoryItemDto {
  x: number;
  y: number;
  direction: Direction;
  action: string;
  timestamp: Date;
}

export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Utility functions for creating consistent API responses
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
): ApiResponseDto<T> => ({
  success: true,
  data,
  message,
});

export const createErrorResponse = (error: string): ApiResponseDto<null> => ({
  success: false,
  error,
});
