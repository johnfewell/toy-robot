import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RobotService } from '../services/robot.service';
import {
  PlaceRobotDto,
  RobotStateResponseDto,
  RobotHistoryItemDto,
  ApiResponseDto,
  createSuccessResponse,
  createErrorResponse,
} from '../dto/robot.dto';

@Controller('api/robot')
export class RobotController {
  private readonly logger = new Logger(RobotController.name);

  constructor(private readonly robotService: RobotService) {}

  @Get('current')
  async getCurrentState(): Promise<ApiResponseDto<RobotStateResponseDto>> {
    try {
      this.logger.log('Getting current robot state');
      const state = await this.robotService.getCurrentRobotState();

      return createSuccessResponse(
        state,
        'Current robot state retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to get current state', error);
      throw new HttpException(
        createErrorResponse('Failed to retrieve robot state'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('place')
  async placeRobot(
    @Body() placeDto: PlaceRobotDto,
  ): Promise<ApiResponseDto<RobotStateResponseDto>> {
    try {
      this.logger.log(
        `Placing robot at (${placeDto.x}, ${placeDto.y}) facing ${placeDto.direction}`,
      );

      const state = await this.robotService.placeRobot(
        placeDto.x,
        placeDto.y,
        placeDto.direction,
      );

      return createSuccessResponse(
        state,
        `Robot placed at (${placeDto.x}, ${placeDto.y}) facing ${placeDto.direction}`,
      );
    } catch (error) {
      this.logger.error('Failed to place robot', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to place robot';

      try {
        const currentState = await this.robotService.getCurrentRobotState();
        return {
          success: false,
          data: currentState,
          error: errorMessage,
        };
      } catch {
        throw new HttpException(
          createErrorResponse(errorMessage),
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  @Post('move')
  async moveRobot(): Promise<ApiResponseDto<RobotStateResponseDto>> {
    try {
      this.logger.log('Moving robot forward');
      const state = await this.robotService.moveRobot();

      return createSuccessResponse(state, 'Robot moved successfully');
    } catch (error) {
      this.logger.error('Failed to move robot', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to move robot';

      try {
        const currentState = await this.robotService.getCurrentRobotState();
        return {
          success: false,
          data: currentState,
          error: errorMessage,
        };
      } catch {
        throw new HttpException(
          createErrorResponse(errorMessage),
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  @Post('turn-left')
  async turnLeft(): Promise<ApiResponseDto<RobotStateResponseDto>> {
    try {
      this.logger.log('Turning robot left');
      const state = await this.robotService.turnLeft();

      return createSuccessResponse(state, 'Robot turned left successfully');
    } catch (error) {
      this.logger.error('Failed to turn robot left', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to turn robot left';

      try {
        const currentState = await this.robotService.getCurrentRobotState();
        return {
          success: false,
          data: currentState,
          error: errorMessage,
        };
      } catch {
        throw new HttpException(
          createErrorResponse(errorMessage),
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  @Post('turn-right')
  async turnRight(): Promise<ApiResponseDto<RobotStateResponseDto>> {
    try {
      this.logger.log('Turning robot right');
      const state = await this.robotService.turnRight();

      return createSuccessResponse(state, 'Robot turned right successfully');
    } catch (error) {
      this.logger.error('Failed to turn robot right', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to turn robot right';

      try {
        const currentState = await this.robotService.getCurrentRobotState();
        return {
          success: false,
          data: currentState,
          error: errorMessage,
        };
      } catch {
        throw new HttpException(
          createErrorResponse(errorMessage),
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  @Get('report')
  async getReport(): Promise<ApiResponseDto<string>> {
    try {
      this.logger.log('Getting robot report');
      const report = await this.robotService.getReport();

      return createSuccessResponse(
        report,
        'Robot report generated successfully',
      );
    } catch (error) {
      this.logger.error('Failed to get robot report', error);
      throw new HttpException(
        createErrorResponse('Failed to generate robot report'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getHistory(): Promise<ApiResponseDto<RobotHistoryItemDto[]>> {
    try {
      this.logger.log('Getting robot history');
      const history = await this.robotService.getHistory();

      return createSuccessResponse(
        history,
        'Robot history retrieved successfully',
      );
    } catch (error) {
      this.logger.error('Failed to get robot history', error);
      throw new HttpException(
        createErrorResponse('Failed to retrieve robot history'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validate')
  async validateCommand(
    @Query('command') command: string,
    @Query('x') x?: string,
    @Query('y') y?: string,
  ): Promise<ApiResponseDto<boolean>> {
    try {
      this.logger.log(`Validating command: ${command}`);

      const xNum = x !== undefined ? parseInt(x, 10) : undefined;
      const yNum = y !== undefined ? parseInt(y, 10) : undefined;

      const isValid = await this.robotService.validateCommand(
        command,
        xNum,
        yNum,
      );

      return createSuccessResponse(
        isValid,
        `Command '${command}' is ${isValid ? 'valid' : 'invalid'}`,
      );
    } catch (error) {
      this.logger.error('Failed to validate command', error);
      throw new HttpException(
        createErrorResponse('Failed to validate command'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  healthCheck(): ApiResponseDto<{ status: string; timestamp: string }> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };

      return createSuccessResponse(health, 'Robot service is healthy');
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new HttpException(
        createErrorResponse('Service unhealthy'),
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
