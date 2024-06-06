const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const { expect } = chai;
const sequelize = require("../database");
const app = require("../app"); // Uistite sa, že exportujete `app` z hlavného súboru

chai.use(chaiHttp);

describe("API Tests", () => {
  beforeEach(() => {
    sinon.stub(sequelize, "query");
  });

  afterEach(() => {
    sequelize.query.restore();
  });

  it("should return averaged data", async () => {
    const mockData = [
      {
        temperature1: 23.5,
        temperature2: 24.1,
        humidity: 60,
        pressure: 1012,
        time: "2024-05-16 00:00:00",
      },
    ];

    sequelize.query.resolves(mockData);

    const res = await chai.request(app).get("/api/averagedData");

    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array");
    expect(res.body[0]).to.have.property("temperature1");
    expect(res.body[0]).to.have.property("temperature2");
    expect(res.body[0]).to.have.property("humidity");
    expect(res.body[0]).to.have.property("pressure");
    expect(res.body[0]).to.have.property("time");
  });

  it("should handle errors", async () => {
    sequelize.query.rejects(new Error("Database error"));

    const res = await chai.request(app).get("/api/averagedData");

    expect(res).to.have.status(500);
    expect(res.text).to.equal("Error fetching averaged data");
  });
});
