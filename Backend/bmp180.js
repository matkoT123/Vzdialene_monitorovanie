const { DataTypes } = require("sequelize");
const sequelize = require("./database");

const Bmp180 = sequelize.define(
  "Bmp180",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    temperature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pressure: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "bmp180",
  }
);

module.exports = Bmp180;
