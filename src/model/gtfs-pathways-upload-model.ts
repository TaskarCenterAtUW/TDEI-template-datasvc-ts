import { IsOptional } from "class-validator";
import { AbstractDomainEntity, Prop } from "nodets-ms-core/lib/models";
import { IsValidPolygon } from "../validators/polygon-validator";
import { FeatureCollection } from 'geojson';

export class GtfsPathwaysUploadModel extends AbstractDomainEntity {
    @Prop()
    user_id!: string;
    @Prop()
    tdei_record_id!: string;
    @Prop()
    tdei_project_group_id!: string;
    @Prop()
    tdei_station_id!: string;
    @Prop()
    file_upload_path!: string;
    @Prop()
    collected_by!: string;
    @Prop()
    collection_date!: Date;
    @Prop()
    collection_method!: string;
    @Prop()
    valid_from!: Date;
    @Prop()
    valid_to!: Date;
    @Prop()
    data_source!: string;
    @Prop()
    pathways_schema_version!: string;
    @IsOptional()
    @IsValidPolygon()
    polygon!: FeatureCollection;
}

