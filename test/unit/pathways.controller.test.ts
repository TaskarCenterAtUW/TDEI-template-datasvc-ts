import gtfsPathwaysController from "../../src/controller/gtfs-pathways-controller";
import { GtfsPathwaysDTO } from "../../src/model/gtfs-pathways-dto";
import gtfsPathwaysService from "../../src/service/gtfs-pathways-service";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { TdeiObjectFaker } from "./../common/tdei-object-faker";
import HttpException from "../../src/exceptions/http/http-base-exception";
import { DuplicateException, InputException } from "../../src/exceptions/http/http-exceptions";
import { getMockFileEntity } from "./../common/mock-utils";

// group test using describe
describe("Pathways Controller Test", () => {

    describe("Get Pathways list", () => {
        describe("Functional", () => {
            test("When requested with empty search criteria, Expect to return pathways list", async () => {
                //Arrange
                const req = getMockReq();
                const { res, next } = getMockRes();
                const list: GtfsPathwaysDTO[] = [<GtfsPathwaysDTO>{}]
                const getAllGtfsPathwaySpy = jest
                    .spyOn(gtfsPathwaysService, "getAllGtfsPathway")
                    .mockResolvedValueOnce(list);
                //Act
                await gtfsPathwaysController.getAllGtfsPathway(req, res, next);
                //Assert
                expect(getAllGtfsPathwaySpy).toHaveBeenCalledTimes(1);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.send).toBeCalledWith(list);
            });

            test("When requested with bad collection_date input, Expect to return HTTP status 400", async () => {
                //Arrange
                const req = getMockReq({ body: { collection_date: "2023" } });
                const { res, next } = getMockRes();
                jest
                    .spyOn(gtfsPathwaysService, "getAllGtfsPathway")
                    .mockRejectedValueOnce(new InputException("Invalid date provided."));
                //Act
                await gtfsPathwaysController.getAllGtfsPathway(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(400);
                expect(next).toHaveBeenCalled();
            });

            test("When unknown or database exception occured while processing request, Expect to return HTTP status 500", async () => {
                //Arrange
                const req = getMockReq({ body: { collection_date: "2023" } });
                const { res, next } = getMockRes();
                //Act
                await gtfsPathwaysController.getAllGtfsPathway(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(500);
                expect(next).toHaveBeenCalled();
            });
        });
    });

    describe("Get Pathways file by Id", () => {
        describe("Functional", () => {
            test("When requested for valid tdei_record_id, Expect to return downloadable file stream", async () => {
                //Arrange
                const req = getMockReq();
                const { res, next } = getMockRes();

                const getGtfsPathwayByIdSpy = jest
                    .spyOn(gtfsPathwaysService, "getGtfsPathwayById")
                    .mockResolvedValueOnce(getMockFileEntity());
                //Act
                await gtfsPathwaysController.getGtfsPathwayById(req, res, next);
                //Assert
                expect(getGtfsPathwayByIdSpy).toHaveBeenCalledTimes(1);
                expect(res.status).toHaveBeenCalledWith(200);
            });

            test("When requested for invalid tdei_record_id, Expect to return HTTP status 404", async () => {
                //Arrange
                const req = getMockReq();
                const { res, next } = getMockRes();
                jest
                    .spyOn(gtfsPathwaysService, "getGtfsPathwayById")
                    .mockRejectedValueOnce(new HttpException(404, "Record not found"));
                //Act
                await gtfsPathwaysController.getGtfsPathwayById(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(404);
                expect(next).toHaveBeenCalled();
            });

            test("When unexpected error occured while processing request, Expect to return HTTP status 500", async () => {
                //Arrange
                const req = getMockReq();
                const { res, next } = getMockRes();

                //Act
                await gtfsPathwaysController.getGtfsPathwayById(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(500);
                expect(next).toHaveBeenCalled();
            });
        });
    });

    describe("Create Pathways version", () => {

        describe("Functional", () => {
            test("When valid input provided, Expect to return tdei_record_id for new record", async () => {
                //Arrange
                const req = getMockReq({ body: TdeiObjectFaker.getGtfsPathwaysVersion() });
                const { res, next } = getMockRes();
                const dummyResponse = <GtfsPathwaysDTO>{
                    tdei_record_id: "test_record_id"
                };
                const createGtfsPathwaySpy = jest
                    .spyOn(gtfsPathwaysService, "createGtfsPathway")
                    .mockResolvedValueOnce(dummyResponse);
                //Act
                await gtfsPathwaysController.createGtfsPathway(req, res, next);
                //Assert
                expect(createGtfsPathwaySpy).toHaveBeenCalledTimes(1);
                expect(res.status).toBeCalledWith(200);
                expect(res.send).toBeCalledWith(dummyResponse);
            });

            test("When provided null body, Expect to return HTTP status 500", async () => {
                //Arrange
                const req = getMockReq({ body: null });
                const { res, next } = getMockRes();
                //Act
                await gtfsPathwaysController.createGtfsPathway(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(500);
                expect(next).toHaveBeenCalled();
            });

            test("When provided body with empty tdei_org_id, Expect to return HTTP status 400", async () => {
                //Arrange
                const pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
                pathwaysObject.tdei_org_id = "";
                const req = getMockReq({ body: pathwaysObject });
                const { res, next } = getMockRes();
                //Act
                await gtfsPathwaysController.createGtfsPathway(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(400);
                expect(next).toHaveBeenCalled();
            });

            test("When provided body with invalid polygon, Expect to return HTTP status 400", async () => {
                //Arrange
                const pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
                pathwaysObject.polygon = TdeiObjectFaker.getInvalidPolygon();
                const req = getMockReq({ body: pathwaysObject });
                const { res, next } = getMockRes();
                //Act
                await gtfsPathwaysController.createGtfsPathway(req, res, next);
                //Assert
                expect(res.status).toBeCalledWith(400);
                expect(next).toHaveBeenCalled();
            });

            test("When database exception occured while processing request, Expect to return HTTP status 500", async () => {
                //Arrange
                const pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
                const req = getMockReq({ body: pathwaysObject });
                const { res, next } = getMockRes();

                const createGtfsPathwaySpy = jest
                    .spyOn(gtfsPathwaysService, "createGtfsPathway")
                    .mockRejectedValueOnce(new Error("Unknown error"));
                //Act
                await gtfsPathwaysController.createGtfsPathway(req, res, next);
                //Assert
                expect(createGtfsPathwaySpy).toHaveBeenCalledTimes(1);
                expect(res.status).toBeCalledWith(500);
            });

            test("When database exception with duplicate tdei_org_id occured while processing request, Expect to return HTTP status 400", async () => {
                //Arrange
                const pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
                const req = getMockReq({ body: pathwaysObject });
                const { res, next } = getMockRes();

                const createGtfsPathwaySpy = jest
                    .spyOn(gtfsPathwaysService, "createGtfsPathway")
                    .mockRejectedValueOnce(new DuplicateException("test_record_id"));
                //Act
                await gtfsPathwaysController.createGtfsPathway(req, res, next);
                //Assert
                expect(createGtfsPathwaySpy).toHaveBeenCalledTimes(1);
                expect(res.status).toBeCalledWith(400);
            });
        });
    });

    describe("Get Version list", () => {
        describe("Functional", () => {

            test("When requested version info, Expect to return HTTP status 200", async () => {
                //Arrange
                let req = getMockReq();
                const { res, next } = getMockRes();
                //Act
                await gtfsPathwaysController.getVersions(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(100);
            });
        });
    });
});
