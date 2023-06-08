import { Topic } from "nodets-ms-core/lib/core/queue/topic";

export interface IEventBusServiceInterface {
    subscribeUpload(): void;
    publishingTopic: Topic;
}