# serverless-offline-dynamodb-streams-handler 

This plugin acts as a bridge between the [Serverless Offline](https://github.com/dherault/serverless-offline) and 
[DynamoDB Local](https://github.com/99x/serverless-dynamodb-local) plugins to provide DynamoDB streams functionality for
to your Serverless Offline stacks.

It is inspired by an earlier plugin: [serverless-offline-dynamodb-streams](https://github.com/CoorpAcademy/serverless-plugin)

# Supported Features
* DynamoDB Streams events
* Typescript
* Event Filtering

# Installation

```bash
npm install serverless-offline-dynamodb-streams-handler
```

In your serverless.yml:
```yaml
plugins:
  - serverless-offline-dynamodb-streams-handler
```

# Configuration
```yaml
plugins:
  - serverless-offline-dynamodb-streams-handler
custom:
  serverless-offline-dynamodb-streams-handler:
      endpoint: http://localhost:8000 # Required - dynamodb local endpoint
      tableNames: # Optional. See below for explanation of table names mapping 
        tableKey1: tableName1
        tableKey2: tableName2
```

## Table Names
* If you are using only string ARNS, the plugin will be able to extract the table names from the ARN.
* If you are using a Ref function, the plugin will scan your resources to locate the table
* However, if you are using a cross stack reference, you must provide a mapping in the `tableNames` configuration block 

The entry value should be the dynamo table name and the  key should be the name of the cross stack reference 
__after interpolation__. For example, given the following event mapping and having stage set to 'dev':

```yaml
handler: src/handler.handler
events:
- stream:
    arn: !ImportValue ${self:provider.stage}StreamArn
    type: dynamodb
    batchSize: 10
    startingPosition: TRIM_HORIZON
```

The import value key would resolve to "devStreamArn" so the tableNames block would be as follows:

```yaml
custom:
  serverless-offline-dynamodb-streams-handler:
      tableNames: 
        devStreamArn: my-dynamo-table
```

# Usage with Typescript
In order for the plugin to correctly locate your transpiled handlers, set the 'location' property of serverless-offline
This should be compatible with a number of transpilers that put transpiled code in a separate build directory (tested 
with the [serverless-esbuild plugin](https://github.com/floydspace/serverless-esbuild)) 

```yaml
custom:
  serverless-offline:
    location: .esbuild/.build
```

# Filter Patterns
See the [Filter Patterns Guide](src/filterPatterns/README.md)