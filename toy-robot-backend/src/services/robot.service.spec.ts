import { Test, TestingModule } from '@nestjs/testing';
import { RobotService } from './robot.service';
import { Direction } from '../types/domain.types';

// Interface for mock robot data
interface MockRobotData {
  x: number;
  y: number;
  direction: Direction;
  isPlaced: boolean;
}

// Helper function to create mock robot objects with toJSON method
const createMockRobot = (data: MockRobotData) => ({
  ...data,
  toJSON: () => data,
});

// Mock repositories
const mockRobotRepository = {
  create: jest.fn(),
  findOne: jest.fn(),
};

const mockRobotHistoryRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
};

describe('RobotService', () => {
  let service: RobotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RobotService,
        {
          provide: 'ROBOT_REPOSITORY',
          useValue: mockRobotRepository,
        },
        {
          provide: 'ROBOT_HISTORY_REPOSITORY',
          useValue: mockRobotHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<RobotService>(RobotService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentRobotState', () => {
    it('should return default unplaced state when no robot exists', async () => {
      mockRobotRepository.findOne.mockResolvedValue(null);

      const result = await service.getCurrentRobotState();

      expect(result).toEqual({
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      });
    });

    it('should return robot state from database', async () => {
      const mockRobotData = {
        x: 2,
        y: 3,
        direction: Direction.EAST,
        isPlaced: true,
      };
      const mockRobot = createMockRobot(mockRobotData);
      mockRobotRepository.findOne.mockResolvedValue(mockRobot);

      const result = await service.getCurrentRobotState();

      expect(result).toEqual({
        position: { x: 2, y: 3 },
        direction: Direction.EAST,
        isPlaced: true,
      });
    });
  });

  describe('placeRobot', () => {
    it('should place robot at valid position', async () => {
      const mockCreatedRobotData = {
        x: 1,
        y: 1,
        direction: Direction.NORTH,
        isPlaced: true,
      };
      const mockCreatedRobot = createMockRobot(mockCreatedRobotData);
      mockRobotRepository.create.mockResolvedValue(mockCreatedRobot);
      mockRobotHistoryRepository.create.mockResolvedValue({});

      const result = await service.placeRobot(1, 1, Direction.NORTH);

      expect(result).toEqual({
        position: { x: 1, y: 1 },
        direction: Direction.NORTH,
        isPlaced: true,
      });

      expect(mockRobotRepository.create).toHaveBeenCalledWith({
        x: 1,
        y: 1,
        direction: Direction.NORTH,
        isPlaced: true,
      });
    });

    it('should throw error for invalid position', async () => {
      await expect(service.placeRobot(-1, 0, Direction.NORTH)).rejects.toThrow(
        'Invalid position: (-1, 0). Must be within 0-4.',
      );
    });
  });

  describe('moveRobot', () => {
    it('should move robot forward when valid', async () => {
      // Mock current state
      const currentState = {
        position: { x: 2, y: 2 },
        direction: Direction.NORTH,
        isPlaced: true,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      const mockMovedRobotData = {
        x: 2,
        y: 3,
        direction: Direction.NORTH,
        isPlaced: true,
      };
      const mockMovedRobot = createMockRobot(mockMovedRobotData);
      mockRobotRepository.create.mockResolvedValue(mockMovedRobot);
      mockRobotHistoryRepository.create.mockResolvedValue({});

      const result = await service.moveRobot();

      expect(result).toEqual({
        position: { x: 2, y: 3 },
        direction: Direction.NORTH,
        isPlaced: true,
      });
    });

    it('should throw error when robot not placed', async () => {
      const currentState = {
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      await expect(service.moveRobot()).rejects.toThrow(
        'Robot must be placed on the table before moving.',
      );
    });
  });

  describe('turnLeft', () => {
    it('should turn robot left', async () => {
      const currentState = {
        position: { x: 2, y: 2 },
        direction: Direction.NORTH,
        isPlaced: true,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      const mockTurnedRobotData = {
        x: 2,
        y: 2,
        direction: Direction.WEST,
        isPlaced: true,
      };
      const mockTurnedRobot = createMockRobot(mockTurnedRobotData);
      mockRobotRepository.create.mockResolvedValue(mockTurnedRobot);
      mockRobotHistoryRepository.create.mockResolvedValue({});

      const result = await service.turnLeft();

      expect(result).toEqual({
        position: { x: 2, y: 2 },
        direction: Direction.WEST,
        isPlaced: true,
      });
    });

    it('should throw error when robot not placed', async () => {
      const currentState = {
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      await expect(service.turnLeft()).rejects.toThrow(
        'Robot must be placed on the table before moving.',
      );
    });
  });

  describe('turnRight', () => {
    it('should turn robot right', async () => {
      const currentState = {
        position: { x: 2, y: 2 },
        direction: Direction.NORTH,
        isPlaced: true,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      const mockTurnedRobotData = {
        x: 2,
        y: 2,
        direction: Direction.EAST,
        isPlaced: true,
      };
      const mockTurnedRobot = createMockRobot(mockTurnedRobotData);
      mockRobotRepository.create.mockResolvedValue(mockTurnedRobot);
      mockRobotHistoryRepository.create.mockResolvedValue({});

      const result = await service.turnRight();

      expect(result).toEqual({
        position: { x: 2, y: 2 },
        direction: Direction.EAST,
        isPlaced: true,
      });
    });
  });

  describe('getReport', () => {
    it('should return robot report', async () => {
      const currentState = {
        position: { x: 2, y: 3 },
        direction: Direction.NORTH,
        isPlaced: true,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      const result = await service.getReport();

      expect(result).toBe('2,3,NORTH');
    });

    it('should throw error when robot not placed', async () => {
      const currentState = {
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      };
      jest
        .spyOn(service, 'getCurrentRobotState')
        .mockResolvedValue(currentState);

      await expect(service.getReport()).rejects.toThrow(
        'Robot must be placed on the table before generating report.',
      );
    });
  });
});
