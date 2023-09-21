import gtfsPathwaysController from "../../src/controller/gtfs-pathways-controller";
import { GtfsPathwaysDTO } from "../../src/model/gtfs-pathways-dto";
import gtfsPathwaysService from "../../src/service/gtfs-pathways-service";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { TdeiObjectFaker } from "./../common/tdei-object-faker";
import HttpException from "../../src/exceptions/http/http-base-exception";
import { DuplicateException, InputException, OverlapException } from "../../src/exceptions/http/http-exceptions";
import { getMockFileEntity, mockCore } from "./../common/mock-utils";
 import { Readable } from "stream";
import storageService from "../../src/service/storage-service";

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
    describe('Create pathways file', ()=>{

        beforeAll(()=>{
            mockCore();
        })
        test('When valid input provided, expect to return tdei_record_id for new record', async ()=>{
            mockCore();
            let req = getMockReq({ body: {"meta":JSON.stringify(TdeiObjectFaker.getGtfsPathwaysPayload2()),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            const {res, next} = getMockRes()
            const dummyResponse =  <GtfsPathwaysDTO>{
                tdei_record_id:"test_record_id"
            }
            const createGtfsPathwaySpy = jest.spyOn(gtfsPathwaysService, "createGtfsPathway").mockResolvedValueOnce(dummyResponse);
            const storageCliSpy  = jest.spyOn(storageService,"uploadFile").mockResolvedValue('remote_url');
            const uploadSpy = jest.spyOn(gtfsPathwaysController.eventBusService,"publishUpload").mockImplementation()

            await gtfsPathwaysController.createGtfsPathway(req,res,next)
            expect(createGtfsPathwaySpy).toHaveBeenCalledTimes(1);
            expect(res.status).toBeCalledWith(202);
        })

        test('When invalid meta is provided, expect to return 400 error', async ()=>{
            const payload = TdeiObjectFaker.getGtfsPathwaysPayload2()
            payload.collection_method = ""; // Empty collection method
            let req = getMockReq({ body: {"meta":JSON.stringify(payload),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            const {res, next} = getMockRes()
            await gtfsPathwaysController.createGtfsPathway(req,res,next);
            expect(res.status).toBeCalledWith(400);
        });

        test('When database exception occurs, expect to return same error', async ()=>{

            let req = getMockReq({ body: {"meta":JSON.stringify(TdeiObjectFaker.getGtfsPathwaysPayload2()),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            mockCore();
            const {res, next} = getMockRes()
           const exception  = new DuplicateException("test_record_id")
            const createGtfsPathwaySpy = jest.spyOn(gtfsPathwaysService,"createGtfsPathway").mockRejectedValueOnce(exception)
            await gtfsPathwaysController.createGtfsPathway(req,res,next)
            expect(next).toBeCalledWith(exception);

        })
        test('When any HTTPexception occurs during the creation, its sent as response', async ()=>{

            let req = getMockReq({ body: {"meta":JSON.stringify(TdeiObjectFaker.getGtfsPathwaysPayload2()),"file": Buffer.from('whatever') }});
            req.file = TdeiObjectFaker.getMockUploadFile();
            mockCore();
            const {res, next} = getMockRes()
           const exception  = new OverlapException("test_record_id")
            const createGtfsPathwaySpy = jest.spyOn(gtfsPathwaysService, "createGtfsPathway").mockRejectedValueOnce(exception)
            await gtfsPathwaysController.createGtfsPathway(req,res,next)
            expect(next).toBeCalledWith(exception);

        })

    })




    describe("Get Version list", () => {
        describe("Functional", () => {

            test("When requested version info, Expect to return HTTP status 200", async () => {
                //Arrange
                let req = getMockReq();
                const { res, next } = getMockRes();
                //Act
                await gtfsPathwaysController.getVersions(req, res, next);
                //Assert
                expect(res.status).toHaveBeenCalledWith(200);
            });
        });
    });
});