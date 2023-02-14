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
import { validate, ValidationError } from "class-validator";

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
            console.error(error);
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
            console.error('Error while getting the file stream');
            console.error(error);
            if (error instanceof HttpException)
                throw next(error);
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }

    createGtfsPathway = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            let pathways = PathwayVersions.from(request.body);

            validate(pathways).then(async errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.error('Upload pathways file metadata information failed validation. errors: ', errors);
                    const message = errors.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                    next(new HttpException(500, 'Input validation failed with below reasons : \n' + message));
                } else {
                    var newGtfsPathways = await gtfsPathwaysService.createGtfsPathway(pathways)
                        .catch((error: any) => {
                            if (error instanceof DuplicateException) {
                                throw error;
                            }
                            next(new HttpException(500, 'Error saving the Pathways version'));
                        });
                    response.send(newGtfsPathways);
                }
            });
        } catch (error) {
            console.error('Error saving the pathways version');
            console.error(error);
            next(error);
        }
    }
}

const gtfsPathwaysController = new GtfsPathwaysController();
export default gtfsPathwaysController;