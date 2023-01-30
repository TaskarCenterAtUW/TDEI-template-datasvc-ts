import { Request, Response } from "express";
import gtfsPathwaysController from "../controller/gtfs-pathways-controller";
import { GtfsPathwaysDTO } from "../model/gtfs-pathways-dto";
import gtfsPathwaysService from "../service/gtfs-pathways-service";

// group test using describe
describe("POST /api/v1/gtfspathways", () => {

    test("returns list of pathways", async () => {

        const mockRequest = {
            url: "http://localhost:8080",
            query: {}
        } as Request;
        let responseObj = {};
        const mockResponse: Partial<Response> = {
            send: jest.fn().mockImplementation((result) => {
                responseObj = result;
            })
        };
        let next = jest.fn();
        const list: GtfsPathwaysDTO[] = [new GtfsPathwaysDTO()]
        const spy = jest
            .spyOn(gtfsPathwaysService, "getAllGtfsPathway")
            .mockResolvedValueOnce(list);

        await gtfsPathwaysController.getAllGtfsPathway(mockRequest, mockResponse as Response, next);
        expect(responseObj).toEqual(list);
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});