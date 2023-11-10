import { IsNotEmpty, IsOptional } from "class-validator";
import { Prop } from "nodets-ms-core/lib/models";
import { IsValidPolygon } from "../validators/polygon-validator";
import { BaseDto } from "./base-dto";
import { FeatureCollection } from 'geojson';

export class StationDto extends BaseDto {
    @Prop("tdei_station_id")
    tdei_station_id = "0";
    @IsNotEmpty()
    @Prop()
    tdei_project_group_id!: string;
    @IsNotEmpty()
    @Prop("station_name")
    station_name!: string;
    @IsOptional()
    @IsValidPolygon()
    @Prop()
    polygon!: FeatureCollection;

    constructor(init?: Partial<StationDto>) {
        super();
        Object.assign(this, init);
    }
}
