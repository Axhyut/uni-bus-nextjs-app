module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Schedules", "reservedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Schedules", "reservedBy", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Passengers",
        key: "id",
      },
    });

    await queryInterface.addIndex("Schedules", ["reservedAt"], {
      name: "schedule_reservation_time_idx",
    });

    await queryInterface.addIndex("Schedules", ["status"], {
      name: "schedule_status_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Schedules", "reservedAt");
    await queryInterface.removeColumn("Schedules", "reservedBy");
    await queryInterface.removeIndex(
      "Schedules",
      "schedule_reservation_time_idx"
    );
    await queryInterface.removeIndex("Schedules", "schedule_status_idx");
  },
};
