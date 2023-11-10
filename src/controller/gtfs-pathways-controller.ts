import { NextFunction, Request } from "express";
import express from "express";
import { IController } from "./interface/IController";
import { PathwaysQueryParams } from "../model/gtfs-pathways-get-query-params";
import { FileEntity } from "nodets-ms-core/lib/core/storage";
import gtfsPathwaysService from "../service/gtfs-pathways-service";
import validationMiddleware from "../middleware/dto-validation-middleware";
import { PathwayVersions } from "../database/entity/pathways-version-entity";
import HttpException from "../exceptions/http/http-base-exception";
import { DuplicateException, InputException, FileTypeException } from "../exceptions/http/http-exceptions";
import { validate, ValidationError } from "class-validator";
import { Versions } from "../model/versions-dto";
import { environment } from "../environment/environment";
import multer, { memoryStorage } from "multer";
import { GtfsPathwaysDTO } from "../model/gtfs-pathways-dto";
import { GtfsPathwaysUploadMeta } from "../model/gtfs-pathways-upload-meta";
import storageService from "../service/storage-service";
import path from "path";
import { Readable } from "stream";
import { tokenValidator } from "../middleware/token-validation-middleware";
import { metajsonValidator } from "../middleware/json-validation-middleware";
import { EventBusService } from "../service/event-bus-service";


/**
 * Multer for multiple uploads
 * Configured to pull to 'uploads' folder
 * and buffer is available with the request
 * File filter is added to ensure only files with .zip extension
 * are allowed
 */

const upload = multer({
    dest: 'uploads/',
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext != '.zip') {
            cb(new FileTypeException());
        }
        cb(null, true);
    }
});


class GtfsPathwaysController implements IController {
    public path = '/api/v1/gtfs-pathways';
    public router = express.Router();
    constructor() {
        this.intializeRoutes();
    }

    eventBusService = new EventBusService();

    public intializeRoutes() {
        this.router.get(this.path, this.getAllGtfsPathway);
        this.router.get(`${this.path}/:id`, this.getGtfsPathwayById);
        this.router.post(this.path, upload.single('file'), metajsonValidator, tokenValidator, this.createGtfsPathway);
        this.router.get(`${this.path}/versions/info`, this.getVersions);
    }

    getVersions = async (request: Request, response: express.Response, next: NextFunction) => {
        let versionsList = new Versions([{
            documentation: environment.gatewayUrl as string,
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

    /**
     * Function to create record in the database and upload the gtfs-pathway files
     * @param request 
     * @param response 
     * @param next 
     * @returns 
     */
    createGtfsPathway = async (request: Request, response: express.Response, next: NextFunction) => {
        try {
            console.log('Received upload request');
            const meta = JSON.parse(request.body['meta']);
            const userId = request.body.user_id;
            // Validate the meta data
            const gtfsdto = GtfsPathwaysUploadMeta.from(meta);
            const result = await validate(gtfsdto);
            console.log('result', result);

            if (result.length != 0) {
                console.log('Metadata validation failed');
                console.log(result);
                const message = result.map((error: ValidationError) => Object.values(<any>error.constraints)).join(', ');
                return response.status(400).send('Input validation failed with below reasons : \n' + message);
            }
            // Generate the files and upload them
            const uid = storageService.generateRandomUUID(); // Fetches a random UUID for the record
            const folderPath = storageService.getFolderPath(gtfsdto.tdei_project_group_id, uid);
            const uploadedFile = request.file;
            const uploadPath = path.join(folderPath, uploadedFile!.originalname)
            const remoteUrl = await storageService.uploadFile(uploadPath, 'application/zip', Readable.from(uploadedFile!.buffer))
            // Upload the meta file  
            const metaFilePath = path.join(folderPath, 'meta.json');
            const metaUrl = await storageService.uploadFile(metaFilePath, 'text/json', gtfsdto.getStream());
            // Insert into database
            const pathway = PathwayVersions.from(meta);
            pathway.tdei_record_id = uid;
            pathway.file_upload_path = remoteUrl;
            pathway.uploaded_by = userId;
            const returnInfo = await gtfsPathwaysService.createGtfsPathway(pathway);

            // Publish to the topic
            this.eventBusService.publishUpload(gtfsdto, uid, remoteUrl, userId, metaUrl);
            // Also send the information to the queue
            console.log('Responding to request');
            return response.status(202).send(uid);

        } catch (error) {
            console.error('Error saving the pathways file', error);
            if (error instanceof HttpException) {
                next(error)
            } else {
                response.status(500).send('Error saving the pathways file');
            }
        }
    }
}

const gtfsPathwaysController = new GtfsPathwaysController();
export default gtfsPathwaysController;