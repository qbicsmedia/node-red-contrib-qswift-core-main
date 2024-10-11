# node-red-contrib-qswift-core

Core workflow nodes and panels for QSwift.

For more information on particular nodes see their documentation.


## Nodes

### Step function nodes

Following nodes can be used to interact with AWS step functions:

- `sf-execution-start`: node for starting a step function execution
- `sf-activity-task-start`: input node to process a step function activity
- `sf-activity-task-complete`: node to complete the processed step function activity (success/failure)
- `sf-activity-task-heartbeat`: node to send heartbeats to the processed step function activity
- `sf-activity-task-callback-wait`: node for external service callbacks


### Mimir transfer wait
`qswift-mimir-transfer-wait` is like `sf-activity-task-callback-wait`, but specifically used for `Mimir transfer request`.


### Securing HTTP endpoints

`http-in-auth` can be used to secure `HTTP in` nodes with basic authentication by putting them afterwards.


## Panels

### QStore panel

Sidebar panel in QSwift to see the contents of the `QStore`. For more information see [qStore in qswift-docker repo](https://github.com/qbicsmedia/qswift-docker#qstore).
