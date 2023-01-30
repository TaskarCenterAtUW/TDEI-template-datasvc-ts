import { DynamicQueryObject, SqlORder } from "../database/dynamic-query-object";
import { Utility } from "../utility/utility";

export class PathwaysQueryParams {
    pathways_schema_version: string | undefined;
    date_time: string | undefined;
    tdei_org_id: string | undefined;
    tdei_record_id: string | undefined;
    tdei_station_id: string | undefined;
    confidence_level: number = 0;
    page_no: number = 1;
    page_size: number = 10;

    constructor(init?: Partial<PathwaysQueryParams>) {
        Object.assign(this, init);
    }

    /**
     * Builds the parameterized sql query.
     * @returns DynamicQueryObject
     */
    getQueryObject() {
        let queryObject: DynamicQueryObject = new DynamicQueryObject();
        queryObject.buildSelect("pathway_versions", ["*"]);
        queryObject.buildPagination(this.page_no, this.page_size);
        queryObject.buildOrder("updated_date", SqlORder.DESC);
        //Add conditions
        if (this.pathways_schema_version)
            queryObject.condition(` pathways_schema_version = $${queryObject.paramCouter++} `, this.pathways_schema_version);
        if (this.tdei_org_id)
            queryObject.condition(` tdei_org_id = $${queryObject.paramCouter++} `, this.tdei_org_id);
        if (this.tdei_record_id)
            queryObject.condition(` tdei_record_id = $${queryObject.paramCouter++} `, this.tdei_record_id);
        if (this.tdei_station_id)
            queryObject.condition(` tdei_station_id = $${queryObject.paramCouter++} `, this.tdei_station_id);
        if (this.date_time && Utility.dateIsValid(this.date_time))
            queryObject.condition(` valid_to > $${queryObject.paramCouter++} `, this.date_time);

        return queryObject;
    }

    removeLastWord(str: string, wordToRemove: string) {
        const lastIndexOfSpace = str.lastIndexOf(' ');

        if (lastIndexOfSpace === -1) {
            return str;
        }

        return str.substring(0, lastIndexOfSpace);
    }
}