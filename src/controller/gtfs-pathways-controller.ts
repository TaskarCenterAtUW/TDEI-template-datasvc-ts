import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { PathwaysQueryParams } from "../model/gtfs-pathways-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsPathwaysService from "../service/gtfs-pathways-service";
import validationMiddleware from "../middleware/dto-validation-middleware";
import { PathwayVersions } from "../database/entity/pathways-version-entity";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException } from "../exceptions/http/http-exceptions";

class GtfsPathwaysController implements IController {
    public path = '/api/v1/gtfspathways';
    public router = express.Router();
    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get(this.path, this.getAllGtfsPathway);
        this.router.get(`${this.path}/:id`, this.getGtfsPathwayById);
        this.router.post(this.path, validationMiddleware(PathwayVersions), this.createGtfsPathway);
    }

    getAllGtfsPathway = async (request: Request, response: express.Response, next: NextFunction) => {

        try {
            var params: PathwaysQueryParams = new PathwaysQueryParams(JSON.parse(JSON.stringify(request.query)));

            // load gtfsPathways
            const gtfsPathways = await gtfsPathwaysService.getAllGtfsPathway(params);
            // return loaded gtfsPathways
            response.send(gtfsPathways);
        } catch (error) {
            console.log(error);
            next(new HttpException(500, "Error while fetching the pathways information"));
        }
    }

    getGtfsPathwayById = async (request: Request, response: express.Response, next: NextFunction) => {

        try {
            // load a gtfsPathway by a given gtfsPathway id
            let fileEntity: FileEntity = await gtfsPathwaysService.getGtfsPathwayById(request.params.id);

            response.header('Content-Type', fileEntity.mimeType);
            response.header('Content-disposition', `attachment; filename=${fileEntity.fileName}`);
            response.status(200);
            (await fileEntity.getStream()).pipe(response);
        } catch (error) {
            console.log('Error while getting the file stream');
            console.log(error);
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }

    createGtfsPathway = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            var newGtfsPathway = await gtfsPathwaysService.createGtfsPathway(PathwayVersions.from(request.body))
                .catch((error: any) => {
                    if (error instanceof DuplicateException) {
                        throw error;
                    }
                    throw new HttpException(500, 'Error saving the pathways version');
                });
            // return saved gtfsPathway back
            response.send(newGtfsPathway);
        } catch (error) {
            console.log('Error saving the pathways version');
            console.log(error);
            next(error);
        }
    }
}

const gtfsPathwaysController = new GtfsPathwaysController();
export default gtfsPathwaysController;