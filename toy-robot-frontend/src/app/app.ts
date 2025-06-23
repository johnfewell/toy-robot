import {
  Component,
  HostListener,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Subject,
  merge,
  startWith,
  switchMap,
  catchError,
  shareReplay,
} from 'rxjs';
import { map, throttleTime } from 'rxjs/operators';
import {
  RobotService,
  Direction,
  Position,
  RobotState,
  RobotOperationResult,
} from './robot.service';

interface RobotAction {
  type: 'PLACE' | 'MOVE' | 'LEFT' | 'RIGHT' | 'REPORT' | 'LOAD';
  payload?: any;
}

interface AppState {
  robotState: RobotState;
  statusMessage: string;
  reportData?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly robotService = inject(RobotService);

  readonly grid = Array(5)
    .fill(null)
    .map(() => Array(5).fill(null));

  private readonly placeAction$ = new Subject<{ x: number; y: number }>();
  private readonly moveAction$ = new Subject<void>();
  private readonly leftAction$ = new Subject<void>();
  private readonly rightAction$ = new Subject<void>();
  private readonly reportAction$ = new Subject<void>();
  private readonly loadAction$ = new Subject<void>();

  private readonly actions$ = merge(
    this.placeAction$.pipe(
      map((payload) => ({ type: 'PLACE' as const, payload }))
    ),
    this.moveAction$.pipe(
      throttleTime(200),
      map(() => ({ type: 'MOVE' as const }))
    ),
    this.leftAction$.pipe(
      throttleTime(200),
      map(() => ({ type: 'LEFT' as const }))
    ),
    this.rightAction$.pipe(
      throttleTime(200),
      map(() => ({ type: 'RIGHT' as const }))
    ),
    this.reportAction$.pipe(map(() => ({ type: 'REPORT' as const }))),
    this.loadAction$.pipe(map(() => ({ type: 'LOAD' as const })))
  );

  private readonly appState$ = this.actions$.pipe(
    startWith({ type: 'LOAD' as const }),
    switchMap((action: RobotAction) => {
      switch (action.type) {
        case 'PLACE':
          return this.robotService
            .placeRobot({
              x: action.payload.x,
              y: action.payload.y,
              direction: Direction.NORTH,
            })
            .pipe(
              map((result) =>
                this.createAppState(
                  result,
                  result.success
                    ? `Robot placed at (${action.payload.x}, ${action.payload.y})`
                    : result.error ?? 'Failed to place robot'
                )
              )
            );

        case 'MOVE':
          return this.robotService.moveRobot().pipe(
            map((result) => {
              return this.createAppState(
                result,
                result.success
                  ? 'Robot moved successfully'
                  : result.error ?? 'Move ignored - would cause robot to fall'
              );
            })
          );

        case 'LEFT':
          return this.robotService
            .turnLeft()
            .pipe(
              map((result) =>
                this.createAppState(
                  result,
                  result.success
                    ? 'Robot turned left'
                    : result.error ?? 'Failed to turn left'
                )
              )
            );

        case 'RIGHT':
          return this.robotService
            .turnRight()
            .pipe(
              map((result) =>
                this.createAppState(
                  result,
                  result.success
                    ? 'Robot turned right'
                    : result.error ?? 'Failed to turn right'
                )
              )
            );

        case 'REPORT':
          return this.robotService.getReport().pipe(
            switchMap((reportResult) => {
              return this.robotService.getCurrentState().pipe(
                map(
                  (stateResult) =>
                    ({
                      robotState:
                        stateResult.success && stateResult.state
                          ? stateResult.state
                          : {
                              position: null,
                              direction: Direction.NORTH,
                              isPlaced: false,
                            },
                      statusMessage:
                        reportResult.success && reportResult.report
                          ? `REPORT: ${reportResult.report}`
                          : reportResult.error ?? 'Failed to get robot report',
                      reportData: reportResult.success
                        ? reportResult.report
                        : undefined,
                    } as AppState)
                )
              );
            })
          );

        case 'LOAD':
        default:
          return this.robotService.getCurrentState().pipe(
            map((result) => {
              if (result.success && result.state) {
                const message =
                  result.state.isPlaced && result.state.position
                    ? `Robot at (${result.state.position.x}, ${result.state.position.y}) facing ${result.state.direction}`
                    : '';
                return {
                  robotState: result.state,
                  statusMessage: message,
                } as AppState;
              }
              return {
                robotState: {
                  position: null,
                  direction: Direction.NORTH,
                  isPlaced: false,
                },
                statusMessage: result.error ?? 'Failed to load robot state',
              } as AppState;
            }),
            catchError((error) => {
              console.error('Load state error:', error);
              return [
                {
                  robotState: {
                    position: null,
                    direction: Direction.NORTH,
                    isPlaced: false,
                  },
                  statusMessage: 'Failed to load robot state',
                } as AppState,
              ];
            })
          );
      }
    }),
    shareReplay(1)
  );

  readonly vm$ = this.appState$.pipe(
    map((state) => {
      const { robotState, statusMessage, reportData } = state;
      const { position, direction, isPlaced } = robotState;
      return {
        position,
        direction,
        isPlaced,
        statusMessage,
        reportData,
        robotFacingClass: `facing-${(
          direction ?? Direction.NORTH
        ).toLowerCase()}`,
      };
    })
  );

  ngOnInit() {
    this.loadAction$.next();
  }

  private createAppState(
    result: RobotOperationResult,
    successMessage: string
  ): AppState {
    if (result.state) {
      return {
        robotState: result.state,
        statusMessage: result.success
          ? result.message ?? successMessage
          : result.error ?? 'Operation failed',
      };
    }

    return {
      robotState: {
        position: null,
        direction: Direction.NORTH,
        isPlaced: false,
      },
      statusMessage: result.success
        ? result.message ?? successMessage
        : result.error ?? 'Operation failed',
    };
  }

  onCellClick(x: number, y: number): void {
    const minusY = 4 - y;
    this.placeAction$.next({ x, y: minusY });
  }

  moveForward(): void {
    this.moveAction$.next();
  }

  turnLeft(): void {
    this.leftAction$.next();
  }

  turnRight(): void {
    this.rightAction$.next();
  }

  getReport(): void {
    this.reportAction$.next();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.moveForward();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.turnLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.turnRight();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        this.getReport();
        break;
    }
  }

  isRobotAtPosition(x: number, y: number, position: Position | null): boolean {
    return !!(position && position.x === x && position.y === 4 - y);
  }
}
