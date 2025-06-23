import { Sequelize } from 'sequelize';
import { Robot, RobotHistory } from '../models/robot.model';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async (): Promise<Sequelize> => {
      const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: '.db/data.sqlite3',
        logging: false, // Set to console.log for debugging
      });

      // Initialize models
      Robot.initModel(sequelize);
      RobotHistory.initModel(sequelize);

      // Sync database
      await sequelize.sync({ force: false, alter: true });

      return sequelize;
    },
  },
];

export const modelProviders = [
  {
    provide: 'ROBOT_REPOSITORY',
    useValue: Robot,
  },
  {
    provide: 'ROBOT_HISTORY_REPOSITORY',
    useValue: RobotHistory,
  },
];
