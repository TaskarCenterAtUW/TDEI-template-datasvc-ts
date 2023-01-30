import { IsNotEmpty } from 'class-validator';
import { QueryConfig } from 'pg';
import { BaseDto } from '../../model/base-dto';

export class PathwayVersions extends BaseDto {
    //id!: number;
    @IsNotEmpty()
    tdei_record_id: string = "";
    @IsNotEmpty()
    confidence_level: number = 0;
    @IsNotEmpty()
    tdei_org_id: string = "";
    @IsNotEmpty()
    tdei_station_id: string = "";
    @IsNotEmpty()
    file_upload_path: string = "";
    uploaded_by: string = "";
    @IsNotEmpty()
    collected_by: string = "";
    @IsNotEmpty()
    collection_date: Date = new Date();
    @IsNotEmpty()
    collection_method: string = "";
    @IsNotEmpty()
    valid_from: Date = new Date();
    @IsNotEmpty()
    valid_to: Date = new Date();
    @IsNotEmpty()
    data_source: string = "";
    @IsNotEmpty()
    pathways_schema_version: string = "";
    @IsNotEmpty()
    polygon: any = {};

    constructor(init?: Partial<PathwayVersions>) {
        super();
        Object.assign(this, init);
    }

    /**
     * Builds the insert QueryConfig object
     * @returns QueryConfig object
     */
    getInsertQuery(): QueryConfig {
        const queryObject = {
            text: `INSERT INTO public.pathway_versions(tdei_record_id, 
                confidence_level, 
                tdei_org_id, 
                tdei_station_id, 
                file_upload_path, 
                uploaded_by,
                collected_by, 
                collection_date, 
                collection_method, valid_from, valid_to, data_source,
                pathways_schema_version)
                VALUES ($1,0,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`.replace(/\n/g, ""),
            values: [this.tdei_record_id, this.tdei_org_id, this.tdei_station_id, this.file_upload_path, this.uploaded_by
                , this.collected_by, this.collection_date, this.collection_method, this.valid_from, this.valid_to, this.data_source, this.pathways_schema_version],
        }

        return queryObject;
    }
}