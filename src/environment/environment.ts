import dotenv from 'dotenv';
dotenv.config();
/**
 * Contains all the configurations required for setting up the core project
 * While most of the parameters are optional, appInsights connection is 
 * a required parameter since it is auto imported in the `tdei_logger.ts`
 */
export const environment = {
    appName: process.env.npm_package_name,
    eventBus: {
        connectionString: process.env.EVENT_BUS_CONNECTION,
        validationTopic: process.env.VALIDATION_TOPIC,
        validationSubscription: process.env.VALIDATION_SUBSCRIPTION,
        dataServiceTopic: process.env.DATASVC_TOPIC
    },
    postgres: {
        server_username: process.env.PATHWAYS_SERVER_USER,
        server_host: process.env.POSTGRES_SERVER_HOST,
        server_password: process.env.PATHWAYS_SERVER_PASSWORD,
        pathways_database: process.env.PATHWAYS_DB,
        tdei_database: process.env.TDEI_DB,
        ssl: Boolean(process.env.SSL),
        server_port: parseInt(process.env.POSTGRES_SERVER_PORT ?? "5432"),
    },
    appPort: parseInt(process.env.APPLICATION_PORT ?? "8080"),
    authPermissionUrl: process.env.AUTH_PERMISSION_URL
}