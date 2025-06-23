import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import {
  RobotService,
  Direction,
  RobotState,
  PlaceRobotRequest,
  ApiResponse,
} from './robot.service';

describe('RobotService', () => {
  let service: RobotService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:3000/api/robot';

  const mockRobotState: RobotState = {
    position: { x: 2, y: 3 },
    direction: Direction.NORTH,
    isPlaced: true,
  };

  const mockUnplacedRobotState: RobotState = {
    position: null,
    direction: Direction.NORTH,
    isPlaced: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RobotService],
    });

    service = TestBed.inject(RobotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getCurrentState', () => {
    it('should return current robot state successfully', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: true,
        data: mockRobotState,
        message: 'Robot state retrieved',
      };

      service.getCurrentState().subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.state).toEqual(mockRobotState);
        expect(result.message).toBe('Robot state retrieved');
      });

      const req = httpMock.expectOne(`${baseUrl}/current`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.getCurrentState().subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to connect to robot API');
      });

      const req = httpMock.expectOne(`${baseUrl}/current`);
      req.flush('Network error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('placeRobot', () => {
    const placeRequest: PlaceRobotRequest = {
      x: 2,
      y: 3,
      direction: Direction.NORTH,
    };

    it('should place robot successfully', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: true,
        data: mockRobotState,
        message: 'Robot placed successfully',
      };

      service.placeRobot(placeRequest).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.state).toEqual(mockRobotState);
        expect(result.message).toContain('Robot placed at (2, 3) facing NORTH');
      });

      const req = httpMock.expectOne(`${baseUrl}/place`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(placeRequest);
      req.flush(mockResponse);
    });

    it('should handle placement failure', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: false,
        error: 'Invalid position',
        data: mockUnplacedRobotState,
      };

      service.placeRobot(placeRequest).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
        expect(result.state).toEqual(mockUnplacedRobotState);
      });

      const req = httpMock.expectOne(`${baseUrl}/place`);
      req.flush(mockResponse);
    });
  });

  describe('moveRobot', () => {
    it('should move robot successfully', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: true,
        data: { ...mockRobotState, position: { x: 2, y: 4 } },
        message: 'Robot moved successfully',
      };

      service.moveRobot().subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.state?.position).toEqual({ x: 2, y: 4 });
        expect(result.message).toContain('Robot moved successfully');
      });

      const req = httpMock.expectOne(`${baseUrl}/move`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle move failure', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: false,
        error: 'Robot not placed',
        data: mockUnplacedRobotState,
      };

      service.moveRobot().subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Robot not placed');
      });

      const req = httpMock.expectOne(`${baseUrl}/move`);
      req.flush(mockResponse);
    });
  });

  describe('turnLeft', () => {
    it('should turn robot left successfully', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: true,
        data: { ...mockRobotState, direction: Direction.WEST },
        message: 'Robot turned left',
      };

      service.turnLeft().subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.state?.direction).toBe(Direction.WEST);
        expect(result.message).toContain('Robot turned left');
      });

      const req = httpMock.expectOne(`${baseUrl}/left`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('turnRight', () => {
    it('should turn robot right successfully', () => {
      const mockResponse: ApiResponse<RobotState> = {
        success: true,
        data: { ...mockRobotState, direction: Direction.EAST },
        message: 'Robot turned right',
      };

      service.turnRight().subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.state?.direction).toBe(Direction.EAST);
        expect(result.message).toContain('Robot turned right');
      });

      const req = httpMock.expectOne(`${baseUrl}/right`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getReport', () => {
    it('should get robot report successfully', () => {
      const mockResponse: ApiResponse<{ report: string }> = {
        success: true,
        data: { report: '2,3,NORTH' },
        message: 'Report generated',
      };

      service.getReport().subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.report).toBe('2,3,NORTH');
      });

      const req = httpMock.expectOne(`${baseUrl}/report`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle report failure', () => {
      const mockResponse: ApiResponse<{ report: string }> = {
        success: false,
        error: 'Robot not placed',
      };

      service.getReport().subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Robot not placed');
      });

      const req = httpMock.expectOne(`${baseUrl}/report`);
      req.flush(mockResponse);
    });
  });
});
