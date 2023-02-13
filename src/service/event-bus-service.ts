import { PathwayVersions } from "../database/entity/pathways-version-entity";
import gtfsPathwaysService from "./gtfs-pathways-service";
import { IEventBusServiceInterface } from "./interface/event-bus-service-interface";
import { validate } from 'class-validator';
import { AzureQueueConfig } from "nodets-ms-core/lib/core/queue/providers/azure-queue-config";
import { environment } from "../environment/environment";
import { Core } from "nodets-ms-core";
import { Polygon } from "../model/polygon-model";
import { QueueMessageContent } from "../model/queue-message-model";

class EventBusService implements IEventBusServiceInterface {
    private queueConfig: AzureQueueConfig;
    //private gtfsPathwayService!: IGtfsPathwaysService;

    constructor() {
        this.queueConfig = new AzureQueueConfig();
        // this.gtfsPathwayService = new GtfsPathwaysService();
        this.queueConfig.connectionString = environment.eventBus.connectionString as string;
    }

    // function to handle messages
    private processUpload = async (messageReceived: any) => {
        try {
            var queueMessage = QueueMessageContent.from(messageReceived.data);
            if (!queueMessage.response.success && !queueMessage.meta.isValid) {
                console.error("Failed workflow request received:", messageReceived);
                return;
            }

            if (!await queueMessage.hasPermission(["tdei-admin", "poc", "pathways_data_generator"])) {
                return;
            }

            var pathwayVersions: PathwayVersions = PathwayVersions.from(queueMessage.request);
            pathwayVersions.tdei_record_id = queueMessage.tdeiRecordId;
            pathwayVersions.uploaded_by = queueMessage.userId;
            pathwayVersions.file_upload_path = queueMessage.meta.file_upload_path;
            //This line will instantiate the polygon class and set defult class values
            pathwayVersions.polygon = new Polygon({ coordinates: pathwayVersions.polygon.coordinates });
            console.info(`Received message: ${messageReceived.data}`);

            validate(pathwayVersions).then(errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.log('Upload pathways file metadata information failed validation. errors: ', errors);
                } else {
                    gtfsPathwaysService.createGtfsPathway(pathwayVersions).catch((error: any) => {
                        console.error('Error saving the pathways version');
                        console.error(error);
                    });;
                }
            });
        } catch (error) {
            console.error("Error processing the upload message : error ", error, "message: ", messageReceived);
        }
    };


    // function to handle any errors
    private processUploadError = async (error: any) => {
        console.error(error);
    };

    subscribeUpload(): void {
        Core.getTopic(environment.eventBus.validationTopic as string,
            this.queueConfig)
            .subscribe(environment.eventBus.validationSubscription as string, {
                onReceive: this.processUpload,
                onError: this.processUploadError
            });
    }
}

const eventBusService = new EventBusService();
export default eventBusService;