const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const sequelize = require("./database");
const Bmp180 = require("./bmp180");
const Aht10 = require("./aht10");

const app = express();

app.use(cors());

// Define HTTP routes
app.get("/", (req, res) => {
  res.send("Http server is running");
});

// API endpoint for averaged data
app.get("/api/averagedData", async (req, res) => {
  try {
    const averagedDataSql = `
      WITH
      bmp180_avg AS (
          SELECT
              AVG(CAST(temperature AS DECIMAL(10,2))) AS avg_temperature,
              AVG(CAST(pressure AS DECIMAL(10,2))) AS avg_pressure,
              FLOOR((UNIX_TIMESTAMP(created_at) - UNIX_TIMESTAMP('2024-05-16 00:00:00')) / 600) AS time_interval
          FROM bmp180
          WHERE created_at >= NOW() - INTERVAL 12 HOUR
              AND NOT EXISTS (
                  SELECT 1
                  FROM aht10
                  WHERE
                      aht10.created_at = bmp180.created_at
                      AND aht10.humidity = 'error'
              )
          GROUP BY time_interval
      ),
      aht10_avg AS (
          SELECT
              AVG(CAST(temperature AS DECIMAL(10,2))) AS avg_temperature,
              AVG(CAST(humidity AS DECIMAL(10,2))) AS avg_humidity,
              FLOOR((UNIX_TIMESTAMP(created_at) - UNIX_TIMESTAMP('2024-05-16 00:00:00')) / 600) AS time_interval
          FROM aht10
          WHERE created_at >= NOW() - INTERVAL 12 HOUR
              AND humidity != 'error'
          GROUP BY time_interval
      )
      SELECT
          bmp.avg_temperature AS temperature1,
          aht.avg_temperature AS temperature2,
          aht.avg_humidity AS humidity,
          bmp.avg_pressure AS pressure,
          FROM_UNIXTIME(bmp.time_interval * 600 + UNIX_TIMESTAMP('2024-05-16 00:00:00')) AS time
      FROM bmp180_avg bmp
      JOIN aht10_avg aht ON bmp.time_interval = aht.time_interval
      ORDER BY bmp.time_interval DESC
      LIMIT 72
    `;
    const averagedData = await sequelize.query(averagedDataSql, {
      type: sequelize.QueryTypes.SELECT,
    });
    res.json(averagedData);
  } catch (error) {
    console.error("Error fetching averaged data:", error);
    res.status(500).send("Error fetching averaged data");
  }
});

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Send the latest data every second
  const intervalId = setInterval(async () => {
    try {
      const latestBmp180 = await Bmp180.findOne({
        order: [["created_at", "DESC"]],
      });
      const latestAht10 = await Aht10.findOne({
        order: [["created_at", "DESC"]],
      });

      ws.send(
        JSON.stringify({
          bmp180: latestBmp180,
          aht10: latestAht10,
        })
      );
    } catch (error) {
      console.error("Error fetching latest data:", error);
    }
  }, 1000);

  // Clean up when the client disconnects
  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

// Sync model definitions with the database
sequelize.sync().then(() => {
  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
