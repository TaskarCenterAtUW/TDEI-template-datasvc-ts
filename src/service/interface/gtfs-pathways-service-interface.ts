import { FileEntity } from "nodets-ms-core/lib/core/storage";
import { PathwayVersions } from "../../database/entity/pathways-version-entity";
import { GtfsPathwaysDTO } from "../../model/gtfs-pathways-dto";
import { PathwaysQueryParams } from "../../model/gtfs-pathways-get-query-params";
import { StationDto } from "../../model/station-dto";

export interface IGtfsPathwaysService {
    /**
     * Gets the GTFS Pathway details
     * @param params Query params
     */
    getAllGtfsPathway(params: PathwaysQueryParams): Promise<GtfsPathwaysDTO[]>;
    /**
     * 
     * @param id Record Id of the GTFS Pathway file to be downloaded
     */
    getGtfsPathwayById(id: string): Promise<FileEntity>;
    /**
     * Creates new GTFS pathways in the TDEI system.
     * @param pathwayInfo GTFS Pathways object 
     */
    createGtfsPathway(pathwayInfo: PathwayVersions): Promise<GtfsPathwaysDTO>;
    /**
         * Gets the station details for given projectGroupId and stationid
         * @param stationId station id uniquely represented by TDEI system
         * @param projectGroupId oraganization id uniquely represented by TDEI system
         * @returns 
         */
    getStationById(stationId: string, projectGroupId: string): Promise<StationDto>;
}