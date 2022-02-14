declare module "serverless-offline/dist/serverlessLog" {
    import * as Serverless from "serverless"

    export function serverlessLog(msg: string): void

    export function setLog(...args: [string, string, Serverless.LogOptions]): void

    export default serverlessLog
}
