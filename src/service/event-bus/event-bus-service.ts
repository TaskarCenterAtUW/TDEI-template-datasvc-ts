import { PathwayVersions } from "../../database/entity/pathways-version-entity";
import { GtfsPathwaysUploadModel } from "../../model/gtfs-pathways-upload-model";
import gtfsPathwaysService from "../gtfs-pathways-service";
import { IEventBusServiceInterface } from "./interface/event-bus-service-interface";
import { validate } from 'class-validator';
import { AzureQueueConfig } from "nodets-ms-core/lib/core/queue/providers/azure-queue-config";
import { environment } from "../../environment/environment";
import { Core } from "nodets-ms-core";

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
            if (!messageReceived.data || !messageReceived.data.is_valid) {
                console.log("Not valid information received :", messageReceived);
                return;
            }

            var gtfsPathwaysUploadModel = messageReceived.data as GtfsPathwaysUploadModel;
            var pathwayVersions: PathwayVersions = new PathwayVersions(gtfsPathwaysUploadModel);
            pathwayVersions.uploaded_by = gtfsPathwaysUploadModel.user_id;
            console.log(`Received message: ${JSON.stringify(gtfsPathwaysUploadModel)}`);

            validate(pathwayVersions).then(errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.log('Upload pathways file metadata information failed validation. errors: ', errors);
                } else {
                    gtfsPathwaysService.createGtfsPathway(pathwayVersions).catch((error: any) => {
                        console.log('Error saving the pathways version');
                        console.log(error);
                    });;
                }
            });
        } catch (error) {
            console.log("Error processing the upload message : error ", error, "message: ", messageReceived);
        }
    };


    // function to handle any errors
    private processUploadError = async (error: any) => {
        console.log(error);
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