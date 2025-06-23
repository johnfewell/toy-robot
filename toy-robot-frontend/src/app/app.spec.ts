import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { App } from './app';
import {
  RobotService,
  Direction,
  RobotState,
  RobotOperationResult,
  ReportResult,
} from './robot.service';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let robotService: jasmine.SpyObj<RobotService>;
  let httpMock: HttpTestingController;

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

  beforeEach(async () => {
    const robotServiceSpy = jasmine.createSpyObj('RobotService', [
      'getCurrentState',
      'placeRobot',
      'moveRobot',
      'turnLeft',
      'turnRight',
      'getReport',
    ]);

    await TestBed.configureTestingModule({
      imports: [App, HttpClientTestingModule],
      providers: [{ provide: RobotService, useValue: robotServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    robotService = TestBed.inject(RobotService) as jasmine.SpyObj<RobotService>;
    httpMock = TestBed.inject(HttpTestingController);

    // Default mock behavior
    robotService.getCurrentState.and.returnValue(
      of({
        success: true,
        state: mockUnplacedRobotState,
      })
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Component Initialization', () => {
    it('should create the app', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with a 5x5 grid', () => {
      expect(component.grid).toEqual(jasmine.any(Array));
      expect(component.grid.length).toBe(5);
      expect(component.grid[0].length).toBe(5);
    });

    it('should load initial robot state on init', () => {
      fixture.detectChanges();
      expect(robotService.getCurrentState).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render a 5x5 grid of cells', () => {
      const gridCells = fixture.debugElement.queryAll(By.css('.grid-cell'));
      expect(gridCells.length).toBe(25);
    });

    it('should render control buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const buttonTexts = buttons.map((btn) =>
        btn.nativeElement.textContent.trim()
      );

      expect(buttonTexts).toContain('Left');
      expect(buttonTexts).toContain('Move');
      expect(buttonTexts).toContain('Right');
      expect(buttonTexts).toContain('Report');
    });

    it('should disable control buttons when robot is not placed', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const leftBtn = buttons.find(
        (btn) => btn.nativeElement.textContent.trim() === 'Left'
      );
      const moveBtn = buttons.find(
        (btn) => btn.nativeElement.textContent.trim() === 'Move'
      );

      expect(leftBtn?.nativeElement.disabled).toBe(true);
      expect(moveBtn?.nativeElement.disabled).toBe(true);
    });
  });

  describe('Robot State Display', () => {
    it('should display robot when placed', () => {
      robotService.getCurrentState.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      fixture.detectChanges();

      const robotIcon = fixture.debugElement.query(By.css('.robot-icon'));
      expect(robotIcon).toBeTruthy();
      expect(robotIcon.nativeElement.textContent).toContain('🤖');
    });

    it('should not display robot when not placed', () => {
      fixture.detectChanges();

      const robotIcon = fixture.debugElement.query(By.css('.robot-icon'));
      expect(robotIcon).toBeFalsy();
    });

    it('should enable control buttons when robot is placed', () => {
      robotService.getCurrentState.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(
        By.css('.control-btn, .report-btn')
      );
      buttons.forEach((btn) => {
        expect(btn.nativeElement.disabled).toBe(false);
      });
    });
  });

  describe('Grid Cell Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call placeRobot when clicking on a grid cell', () => {
      robotService.placeRobot.and.returnValue(
        of({
          success: true,
          state: { ...mockRobotState, position: { x: 2, y: 3 } },
        })
      );

      const gridCell = fixture.debugElement.queryAll(By.css('.grid-cell'))[7];
      gridCell.triggerEventHandler('click', null);

      expect(robotService.placeRobot).toHaveBeenCalledWith({
        x: 2,
        y: 3,
        direction: Direction.NORTH,
      });
    });

    it('should correctly transform grid coordinates when placing robot', () => {
      robotService.placeRobot.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      // Test coordinate transformation: grid y=0 should become robot y=4
      component.onCellClick(2, 0);
      expect(robotService.placeRobot).toHaveBeenCalledWith({
        x: 2,
        y: 4,
        direction: Direction.NORTH,
      });
    });
  });

  describe('Robot Movement Controls', () => {
    beforeEach(() => {
      robotService.getCurrentState.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );
      fixture.detectChanges();
    });

    it('should call moveRobot when Move button is clicked', () => {
      robotService.moveRobot.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const moveBtn = buttons.find(
        (btn) => btn.nativeElement.textContent.trim() === 'Move'
      );
      moveBtn?.triggerEventHandler('click', null);

      expect(robotService.moveRobot).toHaveBeenCalled();
    });

    it('should call turnLeft when Left button is clicked', () => {
      robotService.turnLeft.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const leftBtn = buttons.find(
        (btn) => btn.nativeElement.textContent.trim() === 'Left'
      );
      leftBtn?.triggerEventHandler('click', null);

      expect(robotService.turnLeft).toHaveBeenCalled();
    });

    it('should call getReport when Report button is clicked', () => {
      robotService.getReport.and.returnValue(
        of({
          success: true,
          report: '2,3,NORTH',
        })
      );

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const reportBtn = buttons.find(
        (btn) => btn.nativeElement.textContent.trim() === 'Report'
      );
      reportBtn?.triggerEventHandler('click', null);

      expect(robotService.getReport).toHaveBeenCalled();
    });
  });

  describe('Keyboard Event Handling', () => {
    beforeEach(() => {
      robotService.getCurrentState.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );
      fixture.detectChanges();
    });

    it('should move robot on ArrowUp key press', () => {
      robotService.moveRobot.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.handleKeyDown(event);

      expect(robotService.moveRobot).toHaveBeenCalled();
    });

    it('should turn left on ArrowLeft key press', () => {
      robotService.turnLeft.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component.handleKeyDown(event);

      expect(robotService.turnLeft).toHaveBeenCalled();
    });

    it('should generate report on r key press', () => {
      robotService.getReport.and.returnValue(
        of({
          success: true,
          report: '2,3,NORTH',
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'r' });
      component.handleKeyDown(event);

      expect(robotService.getReport).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle placement errors gracefully', async () => {
      robotService.placeRobot.and.returnValue(
        of({
          success: false,
          error: 'Invalid position',
        })
      );

      component.onCellClick(0, 0);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Should not crash the application
      expect(component).toBeTruthy();
    });

    it('should handle move errors gracefully', () => {
      robotService.getCurrentState.and.returnValue(
        of({
          success: true,
          state: mockRobotState,
        })
      );
      robotService.moveRobot.and.returnValue(
        of({
          success: false,
          error: 'Move would cause robot to fall',
        })
      );

      fixture.detectChanges();
      component.moveForward();

      expect(component).toBeTruthy();
    });
  });

  describe('Utility Methods', () => {
    it('should correctly identify robot position', () => {
      const position = { x: 2, y: 3 };
      // Robot at y=3 maps to grid y=1 (4-3=1)
      expect(component.isRobotAtPosition(2, 1, position)).toBe(true);
      expect(component.isRobotAtPosition(1, 1, position)).toBe(false);
    });

    it('should return false for null position', () => {
      expect(component.isRobotAtPosition(2, 3, null)).toBe(false);
    });
  });
});
