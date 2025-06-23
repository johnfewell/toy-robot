import { DataTypes, Model, Sequelize } from 'sequelize';
import { Direction } from '../types/domain.types';

export interface RobotAttributes {
  id?: number;
  x?: number | null;
  y?: number | null;
  direction: Direction;
  isPlaced: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RobotHistoryAttributes {
  id?: number;
  x: number;
  y: number;
  direction: Direction;
  action: string;
  createdAt?: Date;
}

export class Robot extends Model<RobotAttributes> implements RobotAttributes {
  public id!: number;
  public x!: number | null;
  public y!: number | null;
  public direction!: Direction;
  public isPlaced!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Robot {
    Robot.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        x: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
            max: 4,
          },
        },
        y: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
            max: 4,
          },
        },
        direction: {
          type: DataTypes.ENUM(...Object.values(Direction)),
          allowNull: false,
          defaultValue: Direction.NORTH,
        },
        isPlaced: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'robots',
        timestamps: true,
      },
    );
    return Robot;
  }
}

export class RobotHistory
  extends Model<RobotHistoryAttributes>
  implements RobotHistoryAttributes
{
  public id!: number;
  public x!: number;
  public y!: number;
  public direction!: Direction;
  public action!: string;
  public readonly createdAt!: Date;

  static initModel(sequelize: Sequelize): typeof RobotHistory {
    RobotHistory.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        x: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
            max: 4,
          },
        },
        y: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
            max: 4,
          },
        },
        direction: {
          type: DataTypes.ENUM(...Object.values(Direction)),
          allowNull: false,
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'robot_history',
        timestamps: true,
        updatedAt: false, // Only track creation time for history
      },
    );
    return RobotHistory;
  }
}
