export {default as log, setLog} from "serverless-offline/dist/serverlessLog"

export const logDebug = typeof process.env.SLS_DEBUG !== 'undefined' ? console.log.bind(null, '[sls-offline-dynamodb-streams]') : () => null;