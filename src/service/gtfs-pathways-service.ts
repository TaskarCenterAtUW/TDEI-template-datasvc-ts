import { Core } from "nodets-ms-core";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { QueryConfig } from "pg";
import pathwaysDbClient from "../database/pathways-data-source";
import { PathwayVersions } from "../database/entity/pathways-version-entity";
import UniqueKeyDbException from "../exceptions/db/database-exceptions";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException } from "../exceptions/http/http-exceptions";
import { GtfsPathwaysDTO } from "../model/gtfs-pathways-dto";
import { PathwaysQueryParams } from "../model/gtfs-pathways-get-query-params";
import { IGtfsPathwaysService } from "./interface/gtfs-pathways-service-interface";
import { StationDto } from "../model/station-dto";
import { environment } from "../environment/environment";
import fetch from "node-fetch";
import { Utility } from "../utility/utility";
import { Geometry, Feature } from "geojson";

class GtfsPathwaysService implements IGtfsPathwaysService {
    constructor() { }

    async getAllGtfsPathway(params: PathwaysQueryParams): Promise<GtfsPathwaysDTO[]> {

        //Builds the query object. All the query consitions can be build in getQueryObject()
        let queryObject = params.getQueryObject();

        let queryConfig = <QueryConfig>{
            text: queryObject.getQuery(),
            values: queryObject.getValues()
        }

        let result = await pathwaysDbClient.query(queryConfig);

        let list: GtfsPathwaysDTO[] = [];
        result.rows.forEach(x => {

            let pathway: GtfsPathwaysDTO = GtfsPathwaysDTO.from(x);
            pathway.valid_from = x.valid_from_str;
            pathway.valid_to = x.valid_to_str;
            pathway.collection_date = x.collection_date_str;
            if (pathway.polygon) {
                var polygon = JSON.parse(x.polygon2) as Geometry;
                pathway.polygon = {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: polygon,
                            properties: {}
                        } as Feature
                    ]
                }
            }
            list.push(pathway);
        })
        return Promise.resolve(list);
    }

    async getGtfsPathwayById(id: string): Promise<FileEntity> {

        const query = {
            text: 'Select file_upload_path from pathway_versions WHERE tdei_record_id = $1',
            values: [id],
        }

        let result = await pathwaysDbClient.query(query);

        if (result.rows.length == 0) throw new HttpException(404, "Record not found");

        const storageClient = Core.getStorageClient();
        if (storageClient == null) throw console.error("Storage not configured");
        let url: string = decodeURIComponent(result.rows[0].file_upload_path);
        return storageClient.getFileFromUrl(url);
    }

    async createGtfsPathway(pathwayInfo: PathwayVersions): Promise<GtfsPathwaysDTO> {
        try {
            pathwayInfo.file_upload_path = decodeURIComponent(pathwayInfo.file_upload_path!);
            //Validate station_id 
            let station = await this.getStationById(pathwayInfo.tdei_station_id, pathwayInfo.tdei_org_id);
            if (!station) throw new Error("Station id not found or inactive.");

            await pathwaysDbClient.query(pathwayInfo.getInsertQuery());

            let pathway: GtfsPathwaysDTO = GtfsPathwaysDTO.from(pathwayInfo);

            console.log("New pathways version created sucessfully");
            return Promise.resolve(pathway);
        } catch (error) {
            if (error instanceof UniqueKeyDbException) {
                throw new DuplicateException(pathwayInfo.tdei_record_id);
            }
            console.error("Error saving the pathways version", error);
            return Promise.reject(error);
        }
    }

    private async getStationById(stationId: string, orgId: string): Promise<StationDto> {
        try {
            let secretToken = await Utility.generateSecret();
            const result = await fetch(`${environment.stationUrl}?station_id=${stationId}&owner_org=${orgId}&page_no=1&page_size=1`, {
                method: 'get',
                headers: { 'Content-Type': 'application/json', 'x-secret': secretToken }
            });

            const data: [] = await result.json();

            if (result.status != undefined && result.status != 200)
                throw new Error(await result.json());

            if (data.length == 0)
                throw new Error();

            return StationDto.from(data.pop());
        } catch (error: any) {
            console.error(error);
            throw new Error("Station id not found or inactive.");
        }
    }
}

const gtfsPathwaysService: IGtfsPathwaysService = new GtfsPathwaysService();
export default gtfsPathwaysService;
