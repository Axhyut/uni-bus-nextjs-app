const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Schedule = sequelize.define(
    "Schedule",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Drivers",
          key: "id",
        },
      },
      pickupLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dropoffLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      timeFrom: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      timeTo: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: "active",
        validate: {
          isIn: [["active", "reserved", "busy", "completed", "cancelled"]],
        },
      },
      reservedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when the schedule was reserved",
      },
      reservedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Passengers",
          key: "id",
        },
        comment: "Passenger who reserved this schedule",
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "Schedules",
      indexes: [
        {
          fields: ["driverId", "date"],
          name: "schedule_driver_date_idx",
        },
        {
          fields: ["reservedAt"],
          name: "schedule_reservation_time_idx",
        },
        {
          fields: ["status"],
          name: "schedule_status_idx",
        },
      ],
    }
  );

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Driver, {
      foreignKey: "driverId",
      as: "driver",
      onDelete: "CASCADE",
    });

    Schedule.belongsTo(models.Passenger, {
      foreignKey: "reservedBy",
      as: "reservedPassenger",
      onDelete: "SET NULL",
    });
  };

  return Schedule;
};
