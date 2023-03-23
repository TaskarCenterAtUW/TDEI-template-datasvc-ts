import { IsNotEmpty, IsOptional } from "class-validator";
import { Prop } from "nodets-ms-core/lib/models";
import { IsValidPolygon } from "../validators/polygon-validator";
import { BaseDto } from "./base-dto";
import { FeatureCollection } from 'geojson';

export class StationDto extends BaseDto {
    @Prop()
    station_id: string = "0";
    @IsNotEmpty()
    @Prop()
    owner_org!: string;
    @IsNotEmpty()
    @Prop()
    name!: string;
    @IsOptional()
    @IsValidPolygon()
    @Prop()
    polygon!: FeatureCollection;

    constructor(init?: Partial<StationDto>) {
        super();
        Object.assign(this, init);
    }
}
