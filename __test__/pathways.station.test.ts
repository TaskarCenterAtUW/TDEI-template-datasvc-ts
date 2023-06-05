import { QueryResult } from "pg";
import pathwaysDbClient from "../src/database/pathways-data-source";
import pathwaysStation from "../src/service/gtfs-pathways-service";
import { TdeiObjectFaker } from "./common/tdei-object-faker";
import { PathwaysQueryParams } from "../src/model/gtfs-pathways-get-query-params";
import { GtfsPathwaysDTO } from "../src/model/gtfs-pathways-dto";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { mockCore, mockUtility } from "./common/mock-utils";
import { PathwayVersions } from "../src/database/entity/pathways-version-entity";
import UniqueKeyDbException from "../src/exceptions/db/database-exceptions";
import { DuplicateException, InputException } from "../src/exceptions/http/http-exceptions";
import HttpException from "../src/exceptions/http/http-base-exception";
import { Core } from "nodets-ms-core";
import { StationDto } from "../src/model/station-dto";
import fetchMock from "jest-fetch-mock";

// group test using describe
describe("Pathwys Station Test", () => {
    describe("Get all Pathwys", () => {
        test("When requested for [GET] Pathwys files with empty search filters, expect to return list", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    pathwaysObj
                ]
            };
            const getAllGtfsPathwaySpy = jest
                .spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: PathwaysQueryParams = new PathwaysQueryParams();
            //Act
            var result = await pathwaysStation.getAllGtfsPathway(params);
            //Assert
            expect(Array.isArray(result));
            expect(result.every(item => item instanceof GtfsPathwaysDTO));
        });

        test("When requested for [GET] Pathwys files with all search filters, expect to return list", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    pathwaysObj
                ]
            };
            const getAllGtfsPathwaySpy = jest
                .spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: PathwaysQueryParams = new PathwaysQueryParams();
            params.page_no = 1;
            params.page_size = 10;
            params.date_time = "03-03-2023";
            params.tdei_org_id = "test_id";
            params.tdei_record_id = "test_id";
            params.tdei_org_id = "test_id";
            params.pathways_schema_version = "v1.0";
            params.bbox = [1, 2, 3, 4]
            //Act
            var result = await pathwaysStation.getAllGtfsPathway(params);
            //Assert
            expect(Array.isArray(result));
            expect(result.every(item => item instanceof GtfsPathwaysDTO));
        });

        test("When requested for [GET] Pathwys files with invalid date search filter, expect to return list", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    pathwaysObj
                ]
            };
            const getAllGtfsPathwaySpy = jest
                .spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: PathwaysQueryParams = new PathwaysQueryParams();
            params.page_no = 1;
            params.page_size = 10;
            params.date_time = "13-13-2023";
            params.tdei_org_id = "test_id";
            params.tdei_record_id = "test_id";
            params.tdei_org_id = "test_id";
            params.pathways_schema_version = "v1.0";
            params.bbox = [1, 2, 3, 4]
            //Act
            //Assert
            expect(pathwaysStation.getAllGtfsPathway(params)).rejects.toThrow(InputException);
        });

        test("When requested for [GET] Pathwys files with invalid bbox search filter, expect to return list", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    pathwaysObj
                ]
            };
            const getAllGtfsPathwaySpy = jest
                .spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);
            var params: PathwaysQueryParams = new PathwaysQueryParams();
            params.page_no = 1;
            params.page_size = 10;
            params.date_time = "03-03-2023";
            params.tdei_org_id = "test_id";
            params.tdei_record_id = "test_id";
            params.tdei_org_id = "test_id";
            params.pathways_schema_version = "v1.0";
            params.bbox = [1, 2]
            //Act
            //Assert
            expect(pathwaysStation.getAllGtfsPathway(params)).rejects.toThrow(InputException);
        });
    });

    describe("Get Pathwys version by Id", () => {
        test("When requested for get Pathwys version by tdei_record_id, expect to return FileEntity object", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>>{
                rows: [
                    {
                        file_upload_path: "test_path"
                    }
                ]
            };

            mockCore();
            jest.spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);

            //Act
            var result = await pathwaysStation.getGtfsPathwayById("tdei_record_id");
            //Assert
            expect(result instanceof FileEntity);
        });

        test("When requested for get Pathwys version with invalid tdei_record_id, expect to return error", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>><unknown>{
                rows: [],
                rowCount: 0
            };

            mockCore();
            jest.spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);

            //Act
            //Assert
            expect(pathwaysStation.getGtfsPathwayById("tdei_record_id")).rejects.toThrow(HttpException);
        });

        test("When Core failed obtaing storage client, expect to return error", async () => {
            //Arrange
            var pathwaysObj = TdeiObjectFaker.getGtfsPathwaysVersionFromDB();
            const dummyResponse = <QueryResult<any>><unknown>{
                rows: [
                    {
                        file_upload_path: "test_path"
                    }
                ]
            };

            mockCore();
            //Overrride getStorageClient mock
            jest.spyOn(Core, "getStorageClient").mockImplementation(() => { return null; }
            );
            jest.spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(dummyResponse);

            //Act
            //Assert
            expect(pathwaysStation.getGtfsPathwayById("tdei_record_id")).rejects.toThrow();
        });
    });

    describe("Create Pathwys version", () => {
        test("When requested for creating Pathwys version with valid object, expect to return GtfsPathwaysDTO object", async () => {
            //Arrange
            var pathwaysObj = PathwayVersions.from(TdeiObjectFaker.getGtfsPathwaysVersion());

            const insertPathwaysResponse = <QueryResult<any>>{
                rows: [
                    pathwaysObj
                ]
            };

            const overlapResponse = <QueryResult<any>>{
                rowCount: 0
            };

            jest.spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(overlapResponse)//first call getOverlapQuery
                .mockResolvedValueOnce(insertPathwaysResponse);//Second Insert pathways version
            jest.spyOn(pathwaysStation as any, "getStationById")
                .mockResolvedValueOnce(new StationDto());

            //Act
            var result = await pathwaysStation.createGtfsPathway(pathwaysObj);
            //Assert
            expect(result instanceof GtfsPathwaysDTO);
        });

        test("When database exception with duplicate tdei_org_id occured while processing request, expect to return error", async () => {
            //Arrange
            var pathwaysObj = PathwayVersions.from(TdeiObjectFaker.getGtfsPathwaysVersion());

            const overlapResponse = <QueryResult<any>>{
                rowCount: 0
            };

            jest.spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(overlapResponse)//first call getOverlapQuery
                .mockRejectedValueOnce(new UniqueKeyDbException("Unique contraint error"));//Second Insert pathways version
            jest.spyOn(pathwaysStation as any, "getStationById")
                .mockResolvedValueOnce(new StationDto());

            //Act
            //Assert
            expect(pathwaysStation.createGtfsPathway(pathwaysObj)).rejects.toThrow(DuplicateException);
        });

        test("When database exception occured while processing request, expect to return error", async () => {
            //Arrange
            var pathwaysObj = PathwayVersions.from(TdeiObjectFaker.getGtfsPathwaysVersion());

            const dummyResponse = <QueryResult<any>>{
                rows: [
                    pathwaysObj
                ]
            };

            const overlapResponse = <QueryResult<any>>{
                rowCount: 0
            };

            jest.spyOn(pathwaysDbClient, "query")
                .mockResolvedValueOnce(overlapResponse)//first call getOverlapQuery
                .mockRejectedValueOnce(new Error("Unknown Error"));//Second Insert pathways version
            jest.spyOn(pathwaysStation as any, "getStationById")
                .mockResolvedValueOnce(new StationDto());

            //Act
            //Assert
            expect(pathwaysStation.createGtfsPathway(pathwaysObj)).rejects.toThrow();
        });
    });

    describe("Get Station Id", () => {
        test("When requested, expect to return service details", async () => {
            //Arrange
            fetchMock.mockResolvedValueOnce(Promise.resolve(<any>{
                status: 200,
                json: () => Promise.resolve([<StationDto>{
                    station_name: "test_station"
                }]),
            }));
            mockUtility();
            //Act
            var result = await pathwaysStation.getStationById("test_station_id", "test_org_id");
            //Assert
            expect(result instanceof StationDto);
        });

        test("When requested & service call error, expect to return error", async () => {
            //Arrange
            fetchMock.mockRejectedValueOnce(Promise.resolve(<any>{
                status: 400,
                json: () => Promise.resolve({ "error": "Error fetching results." }),
            }));
            mockUtility();
            //Act
            //var result = await pathwaysStation.getStationById("test_station_id", "test_org_id");
            //Assert
            await expect(pathwaysStation.getStationById("test_station_id", "test_org_id")).rejects.toThrowError();
        });

        test("When requested & empty response, expect to return error", async () => {
            //Arrange
            fetchMock.mockResolvedValueOnce(Promise.resolve(<any>{
                status: 200,
                json: () => Promise.resolve([]),
            }));
            mockUtility();
            //Act
            //Assert
            await expect(pathwaysStation.getStationById("test_station_id", "test_org_id")).rejects.toThrowError();
        });

        test("When requested & HTTP status not 200, expect to return error", async () => {
            //Arrange
            fetchMock.mockResolvedValueOnce(Promise.resolve(<any>{
                status: 400,
                json: () => Promise.resolve([]),
            }));
            mockUtility();
            //Act
            //Assert
            await expect(pathwaysStation.getStationById("test_station_id", "test_org_id")).rejects.toThrowError();
        });
    });
});


