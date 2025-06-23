import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { RobotController } from './robot.controller';
import { RobotService } from '../services/robot.service';
import { Direction } from '../types/domain.types';

const mockRobotService = {
  getCurrentRobotState: jest.fn(),
  placeRobot: jest.fn(),
  moveRobot: jest.fn(),
  turnLeft: jest.fn(),
  turnRight: jest.fn(),
  getReport: jest.fn(),
  getHistory: jest.fn(),
  validateCommand: jest.fn(),
};

describe('RobotController', () => {
  let controller: RobotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RobotController],
      providers: [
        {
          provide: RobotService,
          useValue: mockRobotService,
        },
      ],
    }).compile();

    controller = module.get<RobotController>(RobotController);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentState', () => {
    it('should return current robot state successfully', async () => {
      const mockState = {
        position: { x: 1, y: 2 },
        direction: Direction.NORTH,
        isPlaced: true,
      };
      mockRobotService.getCurrentRobotState.mockResolvedValue(mockState);

      const result = await controller.getCurrentState();

      expect(result).toEqual({
        success: true,
        data: mockState,
        message: 'Current robot state retrieved successfully',
      });
      expect(mockRobotService.getCurrentRobotState).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      mockRobotService.getCurrentRobotState.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getCurrentState()).rejects.toThrow(HttpException);
    });
  });

  describe('placeRobot', () => {
    it('should place robot successfully', async () => {
      const placeDto = { x: 2, y: 3, direction: Direction.EAST };
      const mockState = {
        position: { x: 2, y: 3 },
        direction: Direction.EAST,
        isPlaced: true,
      };
      mockRobotService.placeRobot.mockResolvedValue(mockState);

      const result = await controller.placeRobot(placeDto);

      expect(result).toEqual({
        success: true,
        data: mockState,
        message: 'Robot placed at (2, 3) facing EAST',
      });
      expect(mockRobotService.placeRobot).toHaveBeenCalledWith(
        2,
        3,
        Direction.EAST,
      );
    });

    it('should handle invalid position error', async () => {
      const placeDto = { x: 5, y: 3, direction: Direction.EAST };
      const mockCurrentState = {
        position: { x: 0, y: 0 },
        direction: Direction.NORTH,
        isPlaced: false,
      };

      mockRobotService.placeRobot.mockRejectedValue(
        new Error('Invalid position: (5, 3). Must be within 0-4.'),
      );
      mockRobotService.getCurrentRobotState.mockResolvedValue(mockCurrentState);

      const result = await controller.placeRobot(placeDto);

      expect(result).toEqual({
        success: false,
        data: mockCurrentState,
        error: 'Invalid position: (5, 3). Must be within 0-4.',
      });
    });
  });

  describe('moveRobot', () => {
    it('should move robot successfully', async () => {
      const mockState = {
        position: { x: 2, y: 4 },
        direction: Direction.NORTH,
        isPlaced: true,
      };
      mockRobotService.moveRobot.mockResolvedValue(mockState);

      const result = await controller.moveRobot();

      expect(result).toEqual({
        success: true,
        data: mockState,
        message: 'Robot moved successfully',
      });
      expect(mockRobotService.moveRobot).toHaveBeenCalledTimes(1);
    });

    it('should handle move error when robot not placed', async () => {
      const mockCurrentState = {
        position: { x: 0, y: 0 },
        direction: Direction.NORTH,
        isPlaced: false,
      };

      mockRobotService.moveRobot.mockRejectedValue(
        new Error('Robot must be placed on the table before moving.'),
      );
      mockRobotService.getCurrentRobotState.mockResolvedValue(mockCurrentState);

      const result = await controller.moveRobot();

      expect(result).toEqual({
        success: false,
        data: mockCurrentState,
        error: 'Robot must be placed on the table before moving.',
      });
    });
  });

  describe('turnLeft', () => {
    it('should turn robot left successfully', async () => {
      const mockState = {
        position: { x: 2, y: 3 },
        direction: Direction.WEST,
        isPlaced: true,
      };
      mockRobotService.turnLeft.mockResolvedValue(mockState);

      const result = await controller.turnLeft();

      expect(result).toEqual({
        success: true,
        data: mockState,
        message: 'Robot turned left successfully',
      });
      expect(mockRobotService.turnLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('turnRight', () => {
    it('should turn robot right successfully', async () => {
      const mockState = {
        position: { x: 2, y: 3 },
        direction: Direction.EAST,
        isPlaced: true,
      };
      mockRobotService.turnRight.mockResolvedValue(mockState);

      const result = await controller.turnRight();

      expect(result).toEqual({
        success: true,
        data: mockState,
        message: 'Robot turned right successfully',
      });
      expect(mockRobotService.turnRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReport', () => {
    it('should return robot report successfully', async () => {
      const mockReport = '2,3,NORTH';
      mockRobotService.getReport.mockResolvedValue(mockReport);

      const result = await controller.getReport();

      expect(result).toEqual({
        success: true,
        data: { report: mockReport },
        message: 'Robot report generated successfully',
      });
      expect(mockRobotService.getReport).toHaveBeenCalledTimes(1);
    });

    it('should handle report error when robot not placed', async () => {
      const mockCurrentState = {
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      };

      mockRobotService.getReport.mockRejectedValue(
        new Error(
          'Robot must be placed on the table before generating report.',
        ),
      );
      mockRobotService.getCurrentRobotState.mockResolvedValue(mockCurrentState);

      const result = await controller.getReport();

      expect(result).toEqual({
        success: false,
        data: mockCurrentState,
        error: 'Robot must be placed on the table before generating report.',
      });
    });
  });

  describe('getHistory', () => {
    it('should return robot history successfully', async () => {
      const mockHistory = [
        {
          x: 2,
          y: 3,
          direction: Direction.NORTH,
          action: 'PLACE',
          timestamp: new Date(),
        },
        {
          x: 2,
          y: 4,
          direction: Direction.NORTH,
          action: 'MOVE',
          timestamp: new Date(),
        },
      ];
      mockRobotService.getHistory.mockResolvedValue(mockHistory);

      const result = await controller.getHistory();

      expect(result).toEqual({
        success: true,
        data: mockHistory,
        message: 'Robot history retrieved successfully',
      });
      expect(mockRobotService.getHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateCommand', () => {
    it('should validate PLACE command successfully', async () => {
      mockRobotService.validateCommand.mockResolvedValue(true);

      const result = await controller.validateCommand('PLACE', '2', '3');

      expect(result).toEqual({
        success: true,
        data: true,
        message: "Command 'PLACE' is valid",
      });
      expect(mockRobotService.validateCommand).toHaveBeenCalledWith(
        'PLACE',
        2,
        3,
      );
    });

    it('should validate MOVE command successfully', async () => {
      mockRobotService.validateCommand.mockResolvedValue(false);

      const result = await controller.validateCommand('MOVE');

      expect(result).toEqual({
        success: true,
        data: false,
        message: "Command 'MOVE' is invalid",
      });
      expect(mockRobotService.validateCommand).toHaveBeenCalledWith(
        'MOVE',
        undefined,
        undefined,
      );
    });

    it('should handle invalid coordinate strings', async () => {
      mockRobotService.validateCommand.mockResolvedValue(false);

      const result = await controller.validateCommand('PLACE', 'invalid', '3');

      expect(result).toEqual({
        success: true,
        data: false,
        message: "Command 'PLACE' is invalid",
      });
      expect(mockRobotService.validateCommand).toHaveBeenCalledWith(
        'PLACE',
        NaN,
        3,
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const result = controller.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('healthy');
      expect(result.data?.timestamp).toBeDefined();
      expect(result.message).toBe('Robot service is healthy');
    });
  });
});
