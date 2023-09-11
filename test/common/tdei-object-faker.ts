import { FeatureCollection } from "geojson";
import gtfsPathwaysValidationSuccessMessage from "../test-data/pathways-validation-success.message.json";
import { PathwayVersions } from "../../src/database/entity/pathways-version-entity";
import { th } from "date-fns/locale";

export class TdeiObjectFaker {
    static getGtfsPathwaysVersion() {
        return {
            polygon: this.getPolygon(),
            tdei_record_id: "test_record_id",
            confidence_level: 0,
            tdei_org_id: "test_user",
            file_upload_path: "test_path",
            uploaded_by: "test",
            collected_by: "test",
            collection_date: new Date(),
            valid_from: new Date(),
            valid_to: new Date(),
            collection_method: "manual",
            data_source: "InHouse",
            pathways_schema_version: "v1.0",
            tdei_station_id: "test_station_id"
        } as PathwayVersions;
    }

    static getGtfsPathwaysPayload(){
        return {
            polygon: this.getPolygon(),
            tdei_org_id: 'tdei-org-id',
            tdei_service_id:'tdei-service-id',
            collected_by:'collectedby',
            collection_method:'manual',
            data_source:'InHouse',
            pathways_schema_version:'v2.0',
            valid_from: new Date(),
            valid_to : new Date()
        }
    }

    static getGtfsPathwaysVersionFromDB() {
        return {
            //DB polygon is stored as binary obj
            polygon: {},
            //Select query converts the binary polygon to json using spatial query
            polygon2: JSON.stringify(this.getPolygonGeometry()),
            tdei_record_id: "test_record_id",
            confidence_level: 0,
            tdei_org_id: "test_user",
            file_upload_path: "test_path",
            uploaded_by: "test",
            collected_by: "test",
            collection_date: new Date(),
            collection_method: "manual",
            valid_from: new Date(),
            valid_to: new Date(),
            data_source: "InHouse",
            pathways_schema_version: "v1.0",
            tdei_station_id: "test_station_id"
        };
    }

    static getInvalidPolygon(): FeatureCollection {
        const randomCoordinates: number[][] = [];
        const firstRandom = [
            this.getRandomNumber(70, 79),
            this.getRandomNumber(12, 15)
        ];
        randomCoordinates.push(firstRandom);

        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [randomCoordinates]
                    }
                }
            ]
        };
    }

    static getPolygon(): FeatureCollection {
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: this.getPolygonGeometry()
                }
            ]
        };
    }

    static getPolygonGeometry(): any {
        return {
            type: "Polygon",
            coordinates: [this.getCoordinates()]
        };
    }

    private static getCoordinates(): number[][] {
        const randomCoordinates: number[][] = [];
        const firstRandom = [
            this.getRandomNumber(70, 79),
            this.getRandomNumber(12, 15)
        ];
        randomCoordinates.push(firstRandom);
        for (let i = 3; i--;) {
            randomCoordinates.push([
                this.getRandomNumber(70, 79),
                this.getRandomNumber(12, 15)
            ]);
        }
        randomCoordinates.push(firstRandom);

        return randomCoordinates;
    }

    private static getRandomNumber(min: number, max: number): number {
        const diff = max - min;
        return parseFloat((min + Math.random() * diff).toFixed(6));
    }

    static getGtfsPathwaysQueueMessageSuccess() {
        return gtfsPathwaysValidationSuccessMessage;
    }
}
