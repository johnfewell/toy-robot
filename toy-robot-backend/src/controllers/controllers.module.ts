import { Module } from '@nestjs/common';
import { RobotController } from './robot.controller';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [RobotController],
})
export class ControllersModule {}
