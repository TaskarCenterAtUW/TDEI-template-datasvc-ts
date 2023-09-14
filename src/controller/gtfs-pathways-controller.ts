import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { PathwaysQueryParams } from "../model/gtfs-pathways-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsPathwaysService from "../service/gtfs-pathways-service";
import validationMiddleware from "../middleware/dto-validation-middleware";
import { PathwayVersions } from "../database/entity/pathways-version-entity";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException, InputException } from "../exceptions/http/http-exceptions";
import { validate, ValidationError } from "class-validator";
import { Versions } from "../model/versions-dto";
import { environment } from "../environment/environment";

class GtfsPathwaysController implements IController {
    public path = '/api/v1/gtfs-pathways';
    public router = express.Router();
    constructor() {
        this.intializeRoutes();
    }

    public intializeRoutes() {
        this.router.get(this.path, this.getAllGtfsPathway);
        this.router.get(`${this.path}/:id`, this.getGtfsPathwayById);
        this.router.post(this.path, validationMiddleware(PathwayVersions), this.createGtfsPathway);
        this.router.get(`${this.path}/versions/info`, this.getVersions);
    }

    getVersions = async (request: Request, response: express.Response, next: NextFunction) => {
        let versionsList = new Versions([{
            documentation: environment.getewayUrl as string,
            specification: "https://gtfs.org/schedule/examples/pathways/",
            version: "v1.0"
        }]);

        response.status(200).send(versionsList);
    }

    getAllGtfsPathway = async (request: Request, response: express.Response, next: NextFunction) => {

        try {
            const params: PathwaysQueryParams = new PathwaysQueryParams(JSON.parse(JSON.stringify(request.query)));
            // load gtfsPathways
            const gtfsPathways = await gtfsPathwaysService.getAllGtfsPathway(params);
            gtfsPathways.forEach(x => {
                x.download_url = `${this.path}/${x.tdei_record_id}`;
            })
            response.status(200).send(gtfsPathways);
        } catch (error) {
            console.error(error);
            if (error instanceof InputException) {
                response.status(error.status).send(error.message);
                next(error);
            }
            else {
                response.status(500).send("Error while fetching the pathways information");
                next(new HttpException(500, "Error while fetching the pathways information"));
            }
        }
    }

    getGtfsPathwayById = async (request: Request, response: express.Response, next: NextFunction) => {

        try {
            // load a gtfsPathway by a given gtfsPathway id
            const fileEntity: FileEntity = await gtfsPathwaysService.getGtfsPathwayById(request.params.id);

            response.header('Content-Type', fileEntity.mimeType);
            response.header('Content-disposition', `attachment; filename=${fileEntity.fileName}`);
            response.status(200);
            (await fileEntity.getStream()).pipe(response);
        } catch (error) {
            console.error('Error while getting the file stream', error);
            if (error instanceof HttpException) {
                response.status(error.status).send(error.message);
                return next(error);
            }
            response.status(500).send("Error while getting the file stream");
            next(new HttpException(500, "Error while getting the file stream"));
        }
    }

    createGtfsPathway = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            const pathways = PathwayVersions.from(request.body);

            return validate(pathways).then(async errors => {
                // errors is an array of validation errors
                if (errors.length > 0) {
                    console.error('Upload pathways file metadata information failed validation. errors: ', errors);
                    const message = errors.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                    response.status(400).send('Input validation failed with below reasons : \n' + message);
                    next(new HttpException(400, 'Input validation failed with below reasons : \n' + message));
                } else {
                    return await gtfsPathwaysService.createGtfsPathway(pathways)
                        .then(newPathways => {
                            return Promise.resolve(response.status(200).send(newPathways));
                        })
                        .catch((error: any) => {
                            if (error instanceof DuplicateException) {
                                response.status(error.status).send(error.message);
                                next(new HttpException(error.status, error.message));
                            }
                            else {
                                response.status(500).send('Error saving the pathways version')
                                next(new HttpException(500, 'Error saving the pathways version'));
                            }
                        });
                }
            });
        } catch (error) {
            console.error('Error saving the pathways version', error);
            response.status(500).send('Error saving the pathways version')
            next(new HttpException(500, "Error saving the osw version"));
        }
    }
}

const gtfsPathwaysController = new GtfsPathwaysController();
export default gtfsPathwaysController;