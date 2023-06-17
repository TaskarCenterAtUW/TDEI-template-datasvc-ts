import pathwaysService from "../../src/service/gtfs-pathways-service";
import { TdeiObjectFaker } from "./../common/tdei-object-faker";
import { GtfsPathwaysDTO } from "../../src/model/gtfs-pathways-dto";
import { getMockTopic, mockCore, mockQueueMessageContent } from "./../common/mock-utils";
import { QueueMessage } from "nodets-ms-core/lib/core/queue";
import { Topic } from "nodets-ms-core/lib/core/queue/topic";
import { EventBusService } from "../../src/service/event-bus-service";
// import eventBusService from "../src/service/event-bus-service";

var eventBusService = new EventBusService();
// group test using describe
describe("Queue message service", () => {
    describe("Process Queue message", () => {
        describe("Functional", () => {
            test("When valid message received, Expect to process the message successfully", async () => {
                let messagedProcessed: boolean = false;
                //Arrange
                mockQueueMessageContent(true);

                var mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeTruthy();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                var dummyResponse = <GtfsPathwaysDTO>{
                    tdei_record_id: "test_record_id"
                };
                const createGtfsPathwaySpy = jest
                    .spyOn(pathwaysService, "createGtfsPathway")
                    .mockResolvedValueOnce(dummyResponse);

                //Act
                await eventBusService['processUpload'](TdeiObjectFaker.getGtfsPathwaysQueueMessageSuccess());
            });

            test("When message with empty tdei_record_id received, Expect to fail the message processing", async () => {
                let messagedProcessed = false;
                //Arrange
                mockQueueMessageContent(true);

                const mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeFalsy();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                const message = TdeiObjectFaker.getGtfsPathwaysQueueMessageSuccess();
                message.data.tdei_record_id = "";
                //Act
                await eventBusService['processUpload'](message);
            });

            test("When validation service failed, Expect to fail the message processing", async () => {
                //Arrange
                mockQueueMessageContent(true);

                const mockTopic: Topic = getMockTopic();
                mockTopic.publish = (): Promise<void> => {
                    //Assert
                    expect(true).not.toBeCalled();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;

                const message = TdeiObjectFaker.getGtfsPathwaysQueueMessageSuccess();
                message.data.response.success = false;
                message.data.meta.isValid = false;
                //Act
                await eventBusService['processUpload'](message);
            });

            test("When create pathways database failed, Expect to fail the message processing", async () => {
                let messagedProcessed = false;
                //Arrange
                mockQueueMessageContent(true);

                const mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeFalsy();
                    return Promise.resolve();
                }
                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;
                //Act
                await eventBusService['processUpload'](TdeiObjectFaker.getGtfsPathwaysQueueMessageSuccess());
            });

            test("When permission denied, Expect to fail the message processing", async () => {
                let messagedProcessed = false;
                //Arrange
                mockQueueMessageContent(false);

                const mockTopic: Topic = getMockTopic();
                mockTopic.publish = (message: QueueMessage): Promise<void> => {
                    messagedProcessed = message.data.response.success;
                    //Assert
                    expect(messagedProcessed).toBeFalsy();
                    return Promise.resolve();
                };

                mockCore();
                //Mock the topic
                eventBusService.publishingTopic = mockTopic;
                //Act
                await eventBusService['processUpload'](TdeiObjectFaker.getGtfsPathwaysQueueMessageSuccess());
            });
        });
    });
});

