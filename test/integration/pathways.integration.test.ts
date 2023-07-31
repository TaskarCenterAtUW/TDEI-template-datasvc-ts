import { Core } from "nodets-ms-core";
import { EventBusService } from "../../src/service/event-bus-service";
import { QueueMessage } from "nodets-ms-core/lib/core/queue";
import { TdeiObjectFaker } from "../common/tdei-object-faker";
import { setTimeout } from "timers/promises";
import { mockQueueMessageContent } from "../common/mock-utils";
import { GtfsPathwaysDTO } from "../../src/model/gtfs-pathways-dto";
import gtfsPathwaysService from "../../src/service/gtfs-pathways-service";
import { PermissionRequest } from "nodets-ms-core/lib/core/auth/model/permission_request";
import { environment } from "../../src/environment/environment";
import { Utility } from "../../src/utility/utility";
import fetch from "node-fetch";
import pathwaysDbClient from "../../src/database/pathways-data-source";
import { PathwaysQueryParams } from "../../src/model/gtfs-pathways-get-query-params";

// group test using describe
describe("Pathways Integration Test", () => {

    afterAll((done) => {
        done();
    });


    /**
     * Environement dependency 
     * QUEUECONNECTION
     */
    test("Subscribe to validation result topic to verify servicebus integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.QUEUECONNECTION) {
            console.error("QUEUECONNECTION environment not set");
            expect(process.env.QUEUECONNECTION != undefined && process.env.QUEUECONNECTION != null).toBeTruthy();
            return;
        }
        //Arrange
        var messageReceiver!: QueueMessage;

        Core.initialize();
        var topicToSubscribe = Core.getTopic("temp-validation", {
            provider: "Azure"
        });
        //Live: validation service posts message
        await topicToSubscribe.publish(QueueMessage.from(TdeiObjectFaker.getGtfsPathwaysQueueMessageSuccess()));

        //Mock publishing topic - outbound 
        var mockPublishingTopic = Core.getTopic("Mock");
        jest.spyOn(mockPublishingTopic, "publish").mockImplementation((message: QueueMessage) => {
            messageReceiver = message;
            return Promise.resolve();
        });

        mockQueueMessageContent();

        var dummyResponse = <GtfsPathwaysDTO>{
            tdei_record_id: "test_record_id"
        };

        //Mock DB call
        jest
            .spyOn(gtfsPathwaysService, "createGtfsPathway")
            .mockResolvedValueOnce(dummyResponse);

        //Wait for message to process
        async function assertMessage() {
            await setTimeout(20000);
            return Promise.resolve(messageReceiver?.data?.response?.success);
        }

        //Act
        var eventBusService = new EventBusService();
        eventBusService.publishingTopic = mockPublishingTopic;
        eventBusService.subscribeUpload("temp-validation", "temp-validation-result");

        //Assert
        await expect(assertMessage()).resolves.toBeTruthy();

    }, 60000);

    // /** NOTE: Currently database is IP restricted so we cannot test DB connection on fly. If we enable wildcard IP , we can test on fly and uncommnet below method.
    //  * Environement dependency 
    //  * POSTGRES_HOST
    //  * POSTGRES_PORT
    //  * POSTGRES_USER
    //  * POSTGRES_PASSWORD
    //  * POSTGRES_DB
    //  */
    // test("Fetching pathways list to verify the database connection integration", async () => {
    //     //Arrange
    //     var params: PathwaysQueryParams = new PathwaysQueryParams();
    //     pathwaysDbClient.initializaDatabase();
    //     //Act
    //     var result = await gtfsPathwaysService.getAllGtfsPathway(params);
    //     //Assert
    //     expect(Array.isArray(result));
    // }, 15000);

    /**
     * Environement dependency 
     * AUTH_HOST
     */
    test("Verifying auth service hasPermission api integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.AUTH_HOST) {
            console.error("AUTH_HOST environment not set");
            expect(process.env.AUTH_HOST != undefined && process.env.AUTH_HOST != null).toBeTruthy();
            return;
        }

        //Arrange
        var permissionRequest = new PermissionRequest({
            userId: "test_userId",
            orgId: "test_orgId",
            permssions: ["tdei-admin", "poc", "pathways_data_generator"],
            shouldSatisfyAll: false
        });
        const authProvider = Core.getAuthorizer({ provider: "Hosted", apiUrl: environment.authPermissionUrl });
        //ACT
        const response = await authProvider?.hasPermission(permissionRequest);
        //Assert
        expect(response).toBeFalsy();
    }, 15000);

    /**
     * Environement dependency 
     * AUTH_HOST
     */
    test("Verifying auth service generate secret api integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.AUTH_HOST) {
            console.error("AUTH_HOST environment not set");
            expect(process.env.AUTH_HOST != undefined && process.env.AUTH_HOST != null).toBeTruthy();
            return;
        }

        //Act
        const getSecret = await fetch(environment.secretGenerateUrl as string, {
            method: 'get'
        });
        //Assert
        expect(getSecret.status == 200).toBeTruthy();
    }, 15000);

    /**
     * Environement dependency 
     * STATION_URL
     */
    test("Verifying station service get station api integration", async () => {
        //Pre-requisite environment dependency
        if (!process.env.STATION_URL) {
            console.error("STATION_URL environment not set");
            expect(process.env.STATION_URL != undefined && process.env.STATION_URL != null).toBeTruthy();
            return;
        }

        //Arrange
        let secretToken = await Utility.generateSecret();
        //Act
        const result = await fetch(`${environment.stationUrl}?tdei_station_id=test-stationId&tdei_org_id=test-orgId&page_no=1&page_size=1`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json', 'x-secret': secretToken }
        });

        //Assert
        expect(result.status == 200).toBeTruthy();
    }, 15000);
});