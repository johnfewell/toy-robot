import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
}

export interface Position {
  x: number;
  y: number;
}

export interface RobotState {
  position: Position | null;
  direction: Direction;
  isPlaced: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PlaceRobotRequest {
  x: number;
  y: number;
  direction: Direction;
}

export interface RobotOperationResult {
  success: boolean;
  state?: RobotState;
  message?: string;
  error?: string;
}

export interface ReportResult {
  success: boolean;
  report?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RobotService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/robot';

  getCurrentState(): Observable<RobotOperationResult> {
    return this.http
      .get<ApiResponse<RobotState>>(`${this.apiUrl}/current`)
      .pipe(
        map((response) => {
          if (response?.success && response.data) {
            return {
              success: true,
              state: {
                position: response.data.position,
                direction: response.data.direction ?? Direction.NORTH,
                isPlaced: response.data.isPlaced,
              },
              message: response.message,
            };
          }
          return {
            success: false,
            error: 'Invalid response from server',
          };
        }),
        catchError((error) => {
          console.error('Failed to get current robot state:', error);
          return of({
            success: false,
            error: this.extractErrorMessage(
              error,
              'Failed to connect to robot API'
            ),
          });
        })
      );
  }

  placeRobot(request: PlaceRobotRequest): Observable<RobotOperationResult> {
    return this.http
      .post<ApiResponse<RobotState>>(`${this.apiUrl}/place`, request)
      .pipe(
        map((response) => {
          if (response?.data) {
            return {
              success: response.success,
              state: {
                position: response.data.position,
                direction: response.data.direction ?? Direction.NORTH,
                isPlaced: response.data.isPlaced,
              },
              message:
                response.message ??
                (response.success
                  ? `Robot placed at (${request.x}, ${request.y}) facing ${request.direction}`
                  : undefined),
              error: response.error,
            };
          }
          return {
            success: false,
            error: response?.error ?? 'Failed to place robot',
          };
        }),
        catchError((error) => {
          console.error('Failed to place robot:', error);
          return of({
            success: false,
            error: this.extractErrorMessage(error, 'Failed to place robot'),
          });
        })
      );
  }

  moveRobot(): Observable<RobotOperationResult> {
    return this.http
      .post<ApiResponse<RobotState>>(`${this.apiUrl}/move`, {})
      .pipe(
        map((response) => {
          if (response?.data) {
            return {
              success: response.success,
              state: response.data,
              message:
                response.message ??
                (response.success ? 'Robot moved successfully' : undefined),
              error: response.error,
            };
          }
          return {
            success: false,
            error: response?.error ?? 'Failed to move robot',
          };
        }),
        catchError((error) => {
          console.error('Failed to move robot:', error);
          return of({
            success: false,
            error: this.extractErrorMessage(error, 'Failed to move robot'),
          });
        })
      );
  }

  turnLeft(): Observable<RobotOperationResult> {
    return this.http
      .post<ApiResponse<RobotState>>(`${this.apiUrl}/turn-left`, {})
      .pipe(
        map((response) => {
          if (response?.data) {
            return {
              success: response.success,
              state: response.data,
              message:
                response.message ??
                (response.success ? 'Robot turned left' : undefined),
              error: response.error,
            };
          }
          return {
            success: false,
            error: response?.error ?? 'Failed to turn robot left',
          };
        }),
        catchError((error) => {
          console.error('Failed to turn robot left:', error);
          return of({
            success: false,
            error: this.extractErrorMessage(error, 'Failed to turn robot left'),
          });
        })
      );
  }

  turnRight(): Observable<RobotOperationResult> {
    return this.http
      .post<ApiResponse<RobotState>>(`${this.apiUrl}/turn-right`, {})
      .pipe(
        map((response) => {
          if (response?.data) {
            return {
              success: response.success,
              state: response.data,
              message:
                response.message ??
                (response.success ? 'Robot turned right' : undefined),
              error: response.error,
            };
          }
          return {
            success: false,
            error: response?.error ?? 'Failed to turn robot right',
          };
        }),
        catchError((error) => {
          console.error('Failed to turn robot right:', error);
          return of({
            success: false,
            error: this.extractErrorMessage(
              error,
              'Failed to turn robot right'
            ),
          });
        })
      );
  }

  getReport(): Observable<ReportResult> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/report`).pipe(
      map((response) => {
        if (response?.success && response.data) {
          return {
            success: true,
            report: response.data,
          };
        }
        return {
          success: false,
          error: 'Failed to generate robot report',
        };
      }),
      catchError((error) => {
        console.error('Failed to get robot report:', error);
        return of({
          success: false,
          error: this.extractErrorMessage(error, 'Failed to get robot report'),
        });
      })
    );
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const errorObj = error as { error?: { error?: string } };
      return errorObj.error?.error ?? fallback;
    }
    return fallback;
  }
}
