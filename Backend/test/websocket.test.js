const WebSocket = require("ws");
const { expect } = require("chai");
const sinon = require("sinon");
const http = require("http");
const sequelize = require("../database");
const Bmp180 = require("../bmp180");
const Aht10 = require("../aht10");
const app = require("../app");

describe("WebSocket Tests", () => {
  let server;
  let wss;

  before((done) => {
    server = http.createServer(app);
    wss = new WebSocket.Server({ server });
    server.listen(3001, done);
  });

  after((done) => {
    server.close(done);
  });

  it("should send latest data to connected client", (done) => {
    const latestBmp180 = { temperature: "25.5", pressure: "1013" };
    const latestAht10 = { temperature: "25.0", humidity: "55" };

    sinon.stub(Bmp180, "findOne").resolves(latestBmp180);
    sinon.stub(Aht10, "findOne").resolves(latestAht10);

    const ws = new WebSocket("ws://localhost:3001");

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      expect(data).to.have.property("bmp180");
      expect(data).to.have.property("aht10");
      expect(data.bmp180).to.deep.equal(latestBmp180);
      expect(data.aht10).to.deep.equal(latestAht10);
      ws.close();
      Bmp180.findOne.restore();
      Aht10.findOne.restore();
      done();
    });

    ws.on("open", () => {
      // Mock interval function
      setTimeout(() => {
        ws.close();
      }, 2000);
    });
  });

  it("should handle client disconnect", (done) => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.on("close", () => {
      done();
    });

    ws.on("open", () => {
      ws.close();
    });
  });
});
