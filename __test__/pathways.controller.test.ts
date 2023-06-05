import gtfsPathwaysController from "../src/controller/gtfs-pathways-controller";
import { GtfsPathwaysDTO } from "../src/model/gtfs-pathways-dto";
import gtfsPathwaysService from "../src/service/gtfs-pathways-service";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { TdeiObjectFaker } from "./common/tdei-object-faker";
import HttpException from "../src/exceptions/http/http-base-exception";
import { DuplicateException, InputException } from "../src/exceptions/http/http-exceptions";
import { getMockFileEntity } from "./common/mock-utils";

// group test using describe
describe("Pathways API Controller Test", () => {

    describe("Get all Pathways versions", () => {
        test("When requested with empty search criteria, expect to return list", async () => {
            //Arrange
            let req = getMockReq();
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

        test("When requested with bad input, expect to return error", async () => {
            //Arrange
            let req = getMockReq({ body: { collection_date: "2023" } });
            const { res, next } = getMockRes();
            const getAllGtfsPathwaySpy = jest
                .spyOn(gtfsPathwaysService, "getAllGtfsPathway")
                .mockRejectedValueOnce(new InputException("Invalid date provided."));
            //Act
            await gtfsPathwaysController.getAllGtfsPathway(req, res, next);
            //Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).toHaveBeenCalled();
        });

        test("When unknown or database exception occured while processing request, expect to return error", async () => {
            //Arrange
            let req = getMockReq({ body: { collection_date: "2023" } });
            const { res, next } = getMockRes();
            const getAllGtfsPathwaySpy = jest
                .spyOn(gtfsPathwaysService, "getAllGtfsPathway")
                .mockRejectedValueOnce(new Error("unknown error"));
            //Act
            await gtfsPathwaysController.getAllGtfsPathway(req, res, next);
            //Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("Get Pathways file by Id", () => {
        test("When requested for valid tdei_record_id, expect to return downloadable file stream", async () => {
            //Arrange
            let req = getMockReq();
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

        test("When requested for invalid tdei_record_id, expect to return error", async () => {
            //Arrange
            let req = getMockReq();
            const { res, next } = getMockRes();

            const getGtfsPathwayByIdSpy = jest
                .spyOn(gtfsPathwaysService, "getGtfsPathwayById")
                .mockRejectedValueOnce(new HttpException(500, "DB Error"));
            //Act
            await gtfsPathwaysController.getGtfsPathwayById(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When unexpected error occured while processing request, expect to return error", async () => {
            //Arrange
            let req = getMockReq();
            const { res, next } = getMockRes();

            const getGtfsPathwayByIdSpy = jest
                .spyOn(gtfsPathwaysService, "getGtfsPathwayById")
                .mockRejectedValueOnce(new Error("Unexpected error"));
            //Act
            await gtfsPathwaysController.getGtfsPathwayById(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("Create Pathways version", () => {

        test("When valid input provided, expect to return tdei_record_id for new record", async () => {
            //Arrange
            let req = getMockReq({ body: TdeiObjectFaker.getGtfsPathwaysVersion() });
            const { res, next } = getMockRes();
            var dummyResponse = <GtfsPathwaysDTO>{
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

        test("When provided null body, expect to return error", async () => {
            //Arrange
            let req = getMockReq({ body: null });
            const { res, next } = getMockRes();
            var dummyResponse = <GtfsPathwaysDTO>{
                tdei_record_id: "test_record_id"
            };
            const createGtfsPathwaySpy = jest
                .spyOn(gtfsPathwaysService, "createGtfsPathway")
                .mockResolvedValueOnce(dummyResponse);
            //Act
            await gtfsPathwaysController.createGtfsPathway(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When provided body with empty tdei_org_id, expect to return error", async () => {
            //Arrange
            let pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
            pathwaysObject.tdei_org_id = "";
            let req = getMockReq({ body: pathwaysObject });
            const { res, next } = getMockRes();
            var dummyResponse = <GtfsPathwaysDTO>{
                tdei_record_id: "test_record_id"
            };
            const createGtfsPathwaySpy = jest
                .spyOn(gtfsPathwaysService, "createGtfsPathway")
                .mockRejectedValueOnce(dummyResponse);
            //Act
            await gtfsPathwaysController.createGtfsPathway(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When provided body with invalid polygon, expect to return error", async () => {
            //Arrange
            let pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
            pathwaysObject.polygon = TdeiObjectFaker.getInvalidPolygon();
            let req = getMockReq({ body: pathwaysObject });
            const { res, next } = getMockRes();
            //Act
            await gtfsPathwaysController.createGtfsPathway(req, res, next);
            //Assert
            expect(res.status).toBeCalledWith(500);
            expect(next).toHaveBeenCalled();
        });

        test("When database exception occured while processing request, expect to return error", async () => {
            //Arrange
            let pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
            let req = getMockReq({ body: pathwaysObject });
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

        test("When database exception with duplicate tdei_org_id occured while processing request, expect to return error", async () => {
            //Arrange
            let pathwaysObject = TdeiObjectFaker.getGtfsPathwaysVersion();
            let req = getMockReq({ body: pathwaysObject });
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