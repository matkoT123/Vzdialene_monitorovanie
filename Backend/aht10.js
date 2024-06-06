const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Aht10 = sequelize.define(
  "Aht10",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    temperature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    humidity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "aht10",
  }
);

module.exports = Aht10;
