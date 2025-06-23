import { Module } from '@nestjs/common';
import { databaseProviders, modelProviders } from './database.providers';

@Module({
  providers: [...databaseProviders, ...modelProviders],
  exports: [...databaseProviders, ...modelProviders],
})
export class DatabaseModule {}
