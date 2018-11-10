<!--@h1([pkg.name])-->
# fms-api-client
<!--/@-->

[![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client) [![Known Vulnerabilities](https://snyk.io/test/github/Luidog/fms-api-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Luidog/fms-api-client?targetFile=package.json) [![Coverage Status](https://coveralls.io/repos/github/Luidog/fms-api-client/badge.svg?branch=master)](https://coveralls.io/github/Luidog/fms-api-client?branch=master) [![GitHub issues](https://img.shields.io/github/issues/Luidog/fms-api-client.svg?style=plastic)](https://github.com/Luidog/fms-api-client/issues) [![Github commits (since latest release)](https://img.shields.io/github/commits-since/luidog/fms-api-client/latest.svg)](https://img.shields.io/github/issues/Luidog/fms-api-client.svg) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![GitHub license](https://img.shields.io/github/license/Luidog/fms-api-client.svg)](https://github.com/Luidog/fms-api-client/blob/master/LICENSE.md)

A FileMaker Data API client designed to allow easier interaction with a FileMaker application from a web environment. This client abstracts the FileMaker 17 Data API into class based methods. You can find detailed documentation on this project here:

[fms-api-client documentation](https://luidog.github.io/fms-api-client/)

<!--@installation()-->
## Installation

```sh
npm install --save fms-api-client
```
<!--/@-->

## Usage

### Introduction

The fms-api-client is a wrapper around the [FileMaker Data API](https://fm.mutesymphony.com/fmi/data/apidoc/). Much :heart: to FileMaker for their work on the Data API. The client attempts to follow the terminology used by FileMaker wherever possible. the client uses a lightweight datastore to hold Data API connections. The client contains methods which are modeled after the Data API Endpoints.

The client requires that you first connect to a datastore before creating or querying the FileMaker class. You can use the datastore to save a multitude of clients. Each client committed to the datastore will automatically handle Data API Sessions. Once saved to the data store a client's methods can be used to interact with a FileMaker Database without the need for additional authentication.

Each client will manage their own FileMaker Data API session, but the clients can manually open or close their FileMaker sessions by calling either the `client.login()` method or the `client.logout()` method. To remove a client from a datastore and log out a session call `client.destroy()`.

The client supports the same parameter syntax as is found in the [Data API Documentation](https://fm.mutesymphony.com/fmi/data/apidoc/). Where appropriate and useful the client also allows additional parameters. Any method that accepts script or portals in a query or body parameters will also accept the following script and portal parameters:

#### Script Array Syntax

The custom script parameter follows the following syntax:

<!--@snippet('./examples/schema/scripts-array-schema.json', { showSource: true })-->
```json
{
  "scripts": [
    {
      "name": "At Mos Eisley",
      "phase": "presort",
      "param": "awesome bar"
    },
    {
      "name": "First Shot",
      "phase": "prerequest",
      "param": "Han"
    },
    {
      "name": "Moof Milker",
      "param": "Greedo"
    }
  ]
}
```

> File [./examples/schema/scripts-array-schema.json](./examples/schema/scripts-array-schema.json)
<!--/@-->

#### Portal Array Syntax

The custom portal parameter follows the following syntax:

<!--@snippet('./examples/schema/portals-array-schema.json', { showSource: true })-->
```json
{
  "portals": [
    { "name": "planets", "limit": 1, "offset": 1 },
    { "name": "vehicles", "limit": 2 }
  ]
}
```

> File [./examples/schema/portals-array-schema.json](./examples/schema/portals-array-schema.json)
<!--/@-->

**Note:** The FileMaker script and portal syntax will override the alternative script and portal parameter syntax.

In addition to allowing an exanded syntax for invoking script or selecting portals the client will also automatically parse arrays, objects, and numbers to adhere to the requirements of the Data API. Arrays and objects are stringified before being inserted into field data. Also limits and offsets can be set as either a strings or a numbers.

The client will also automatically convert `limit`, `find`, and `offset` into their underscored conterparts as needed. Additionally, if a script result can be parsed as JSON it will be automatically parsed for you by the client.

All methods on the client return promises and each each method will reject with a message and code upon encountering an error. All messages and codes follow the FileMaker Data API where possible.

This project also provides utility modules to aid in working with FileMaker Data API Results. The provided utility modules are `fieldData`, `recordId`, and `transform`. These utilities will accept and return either an object or an an array objects. For more information on the utility modules see the utility section.

### Datastore Connection

Connect must be called before the FileMaker class is used. This connect uses Marpat. Marpat is a fork of Camo. Thanks and love to [Scott Robinson](https://github.com/scottwrobinson) for his creation and maintenance of Camo. My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted file storage and project flexibility.

For more information on marpat and the different types of supported storage visit [marpat](https://github.com/Luidog/marpat)

<!--@snippet('./examples/index.js#datastore-connect-example', { showSource: true })-->
```js
const { connect } = require('marpat');
connect('nedb://memory')
```

> Excerpt from [./examples/index.js](./examples/index.js#L24-L25)
<!--/@-->

### Client Creation

After connecting to a datastore you can import and create clients. A client is created using the create method on the Filemaker class. The FileMaker class accepts an object with the following properties:

| Property    |   Type  |                                            Description                                           |
| ----------- | :-----: | :----------------------------------------------------------------------------------------------: |
| application |  String |                  **required** The FileMaker application / database to connect to                 |
| server      |  String | **required** The FileMaker server to use as the host. **Note:** Must be an http or https Domain. |
| user        |  String |     **required** The FileMaker user account to be used when authenticating into the Data API     |
| password    |  String |                        **required** The FileMaker user account's password.                       |
| name        |  String |                                **optional** A name for the client.                               |
| usage       | Boolean |          **optional** Track Data API usage for this client. **Note:** Default is `true`          |
| timeout     |  Number |      **optional** The default timeout time for requests **Note:** Default is 0, (no timeout)     |
| proxy       |  Object |                             **optional** settings for a proxy server                             |
| agent       |  Object |                         **optional** settings for a custom request agent                         |

:warning: You should only use the agent parameter when absolutely necessary. The Data API was designed to be used on https. Deviating from the intended use should be done with caution.

<!--@snippet('./examples/index.js#client-create-example', { showSource: true })-->
```js
    const client = Filemaker.create({
      name: process.env.CLIENT_NAME,
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: process.env.CLIENT_USAGE_TRACKING,
      agent: { rejectUnauthorized: false }
    });
```

> Excerpt from [./examples/index.js](./examples/index.js#L29-L37)
<!--/@-->

**Note:** The server must be an http or https domain.

A client can be used directly after saving it. The `client.save()` method takes no arguments and will either reject with an error or resolve with a useable client. The client will automatically handle Data API session creation and expiration. Once a client is saved it will be stored on the datastore for reuse later.

<!--@snippet('./examples/index.js#client-save-example', { showSource: true })-->
```js
    return client.save();
  })
  .then(client => authentication(client))
  .then(client => creates(client))
  .then(client => gets(client))
  .then(client => lists(client))
  .then(client => finds(client))
  .then(client => edits(client))
  .then(client => scripts(client))
  .then(client => globals(client))
  .then(client => deletes(client))
  .then(client => uploads(client))
  .then(client => utilities(client))
```

> Excerpt from [./examples/index.js](./examples/index.js#L40-L52)
<!--/@-->

A client can be removed using either the `client.destroy()` method, the `Filemaker.deleteOne(query)` method or the `Filemaker.deleteMany(query)` method.

**Note** Only the `client.destroy()` method will close a FileMaker session. Any client removed using the the `Filemaker.deleteOne(query)` method or the `Filemaker.deleteMany(query)` method will not log out before being destroyed.

### Client Use

A client can be used after it is created and saved or recalled from the datastore. The `Filemaker.find(query)` or `Filemaker.findOne(query)` methods can be used to recall clients. The `filemaker.findOne(query)` method will return either an client or null. The `filemaker.find(query)` will return an array of clients. All public methods on the client are return promises.

<!--@snippet('./examples/create.examples.js#create-many-records', { showSource: true })-->
```js
const createManyRecords = client =>
  Promise.all([
    client.create('Heroes', { name: 'Anakin Skywalker' }, { merge: true }),
    client.create('Heroes', { name: 'Obi-Wan' }, { merge: true }),
    client.create('Heroes', { name: 'Yoda' }, { merge: true })
  ]).then(result => log('create-many-records-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L28-L33)
<!--/@-->

Results:

<!--@snippet('./examples/results/create-many-records-example.json', { showSource: true })-->
```json
[
  {
    "name": "Anakin Skywalker",
    "recordId": "747666",
    "modId": "0"
  },
  {
    "name": "Obi-Wan",
    "recordId": "747662",
    "modId": "0"
  },
  {
    "name": "Yoda",
    "recordId": "747664",
    "modId": "0"
  }
]
```

> File [./examples/results/create-many-records-example.json](./examples/results/create-many-records-example.json)
<!--/@-->

### Data API Sessions

The client will automatically handle creating and closing Data API sessions. If required the client will authenticate and generate a new session token with each method call. The Data API session is also monitored, updated, and saved as the client interacts with the Data API. A client will always attempt to reuse a valid token whenever possible.

The client contains two methods related to Data API sessions.These methods are `client.login()` and `client.logout()`. The login method is used to start a Data API session and the logout method will end a Data API session.

#### Login Method

The client will automatically call the login method if it does not have a valid token. This method returns an object with a token property. This method will also save the token to the client's connection for future use.

`client.login()`

<!--@snippet('./examples/authentication.examples.js#client-login-example', { showSource: true })-->
```js
const login = client => client.login();
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L11-L11)
<!--/@-->

#### Logout Method

The logout method is used to end a Data API session. This method will also remove the current client's authentication token.

`client.logout()`

**Note** The logout method will change in an upcoming release. It will be modified to accept a session parameter.

<!--@snippet('./examples/authentication.examples.js#client-logout-example', { showSource: true })-->
```js
const logout = client =>
  client.logout().then(result => log('client-logout-example', result));
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L6-L7)
<!--/@-->

### Create Records

Using the client you can create filemaker records. To create a record specify the layout to use and the data to insert on creation. The client will automatically convert numbers, arrays, and objects into strings so they can be inserted into a filemaker field. The create method will automatically create a fieldData and add data to that property if there is no fieldData property present.

`client.create(layout, data, parameters)`

| Input      |   Type | Description                                          |
| ---------- | -----: | ---------------------------------------------------- |
| layout     | String | The layout to use as context for creating the record |
| data       | Object | The data to use when creating a record.              |
| parameters | Object | The parameters to use when creating a record.        |

<!--@snippet('./examples/create.examples.js#create-record-example', { showSource: true })-->
```js
const createRecord = client =>
  client
    .create('Heroes', {
      name: 'George Lucas'
    })
    .then(result => log('create-record-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L6-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/create-record-example.json', { showSource: true })-->
```json
{
  "recordId": "747663",
  "modId": "0"
}
```

> File [./examples/results/create-record-example.json](./examples/results/create-record-example.json)
<!--/@-->

Both the create method and the edit method accept a merge boolean in their options. If merge is true the data used to create or edit the filemaker record will be merged with

<!--@snippet('./examples/create.examples.js#create-record-merge', { showSource: true })-->
```js
const mergeDataOnCreate = client =>
  client
    .create(
      'Heroes',
      {
        name: 'George Lucas'
      },
      { merge: true }
    )
    .then(result => log('create-record-merge-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L15-L24)
<!--/@-->

Result:

<!--@snippet('./examples/results/create-record-merge-example.json', { showSource: true })-->
```json
{
  "name": "George Lucas",
  "recordId": "747665",
  "modId": "0"
}
```

> File [./examples/results/create-record-merge-example.json](./examples/results/create-record-merge-example.json)
<!--/@-->

The create method also allows you to trigger scripts when creating a record. Notice the scripts property in the following example. You can specify scripts to run using either FileMaker's script.key syntax or specify an array of scripts with a name, phase, and script parameter.

<!--@snippet('./examples/create.examples.js#trigger-scripts-on-create', { showSource: true })-->
```js
const triggerScriptsOnCreate = client =>
  client
    .create(
      'Heroes',
      { name: 'Anakin Skywalker' },
      {
        merge: true,
        scripts: [
          { name: 'Create Droids', param: { droids: ['C3-PO', 'R2-D2'] } }
        ]
      }
    )
    .then(result => log('trigger-scripts-on-create-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L37-L49)
<!--/@-->

Result:

<!--@snippet('./examples/results/trigger-scripts-on-create-example.json', { showSource: true })-->
```json
{
  "name": "Anakin Skywalker",
  "scriptError": "0",
  "recordId": "747667",
  "modId": "0"
}
```

> File [./examples/results/trigger-scripts-on-create-example.json](./examples/results/trigger-scripts-on-create-example.json)
<!--/@-->

### Get Record Details

The Get method will return a specific FileMaker record based on the recordId passed to it. The recordId can be a string or a number.

`client.get(layout, recordId, parameters)`

| Input      |   Type | Description                                           |                                        |
| ---------- | -----: | ----------------------------------------------------- | -------------------------------------- |
| layout     | String | The layout to use as context for creating the record. |                                        |
| recordId   | String | Number                                                | The RecordId to use to get the record. |
| parameters | Object | The parameters to use when getting a record a record. |                                        |

<!--@snippet('./examples/get.examples.js#get-record-example', { showSource: true })-->
```js
      client
        .get('Heroes', response.data[0].recordId)
        .then(result => log('get-record-example', result))
```

> Excerpt from [./examples/get.examples.js](./examples/get.examples.js#L9-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/get-record-example.json', { showSource: true })-->
```json
{
  "data": [
    {
      "fieldData": {
        "name": "Yoda",
        "image(1)": "https://some-server.com/Streaming_SSL/MainDB/A4ED023904470F2AA08DE8FF00D5FC11EA9664FCE203211B932AB0AB463F4022?RCType=EmbeddedRCFileProcessor",
        "object": "",
        "array": "",
        "height": "",
        "id": "CCB7C32E-D64B-194D-8480-C99F824FDA39",
        "imageName": "placeholder.md",
        "faceDescriptor": ""
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "733129",
      "modId": "2"
    }
  ]
}
```

> File [./examples/results/get-record-example.json](./examples/results/get-record-example.json)
<!--/@-->

### List Records

You can use the client to list filemaker records. The list method accepts a layout and parameter variable. The client will automatically santize the limit, offset, and sort keys to correspond with the DAPI's requirements.

`client.list(layout, parameters)`

| Input      |   Type | Description                                       |
| ---------- | -----: | ------------------------------------------------- |
| layout     | String | The layout to use as context for listing records. |
| parameters | Object | The parameters to use when listing records.       |

<!--@snippet('./examples/list.examples.js#list-records-example', { showSource: true })-->
```js
const listHeroes = client =>
  client
    .list('Heroes', { limit: 2 })
    .then(result => log('list-records-example', result));
```

> Excerpt from [./examples/list.examples.js](./examples/list.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/list-records-example.json', { showSource: true })-->
```json
{
  "data": [
    {
      "fieldData": {
        "name": "George Lucas",
        "image(1)": "https://some-server.com/Streaming_SSL/MainDB/FD3683181DA1B693816002EBB87AB3C067EC689B1467A115E6B5E246443F7237?RCType=EmbeddedRCFileProcessor",
        "object": "",
        "array": "",
        "height": "",
        "id": "0E6DF26C-761E-7947-9A3C-C312C285EE55",
        "imageName": "placeholder.md",
        "faceDescriptor": ""
      },
      "portalData": {
        "Planets": [],
        "Vehicles": [
          {
            "recordId": "3",
            "Vehicles::name": "test",
            "Vehicles::type": "",
            "modId": "0"
          }
        ]
      },
      "recordId": "732765",
      "modId": "7"
    },
    {
      "fieldData": {
        "name": "George Lucas",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "id": "0F628510-432C-0E47-8D03-BA90AAF2EA17",
        "imageName": "",
        "faceDescriptor": ""
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "732766",
      "modId": "1"
    }
  ]
}
```

> File [./examples/results/list-records-example.json](./examples/results/list-records-example.json)
<!--/@-->

### Find Records

The client's find method will accept either a single object as find parameters or an array. The find method will also santize the limit, sort, and offset parameters to conform with the Data API's requirements.

`client.find(layout, query, parameters)`

| Input      |   Type | Description                                 |                                          |
| ---------- | -----: | ------------------------------------------- | ---------------------------------------- |
| layout     | String | The layout to use when performing a find.   |                                          |
| query      | Object | Array                                       | The query to use when performing a find. |
| parameters | Object | The parameters to use when listing records. |                                          |

<!--@snippet('./examples/find.examples.js#find-records-example', { showSource: true })-->
```js
const findRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(result => log('find-records-example', result));
```

> Excerpt from [./examples/find.examples.js](./examples/find.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/find-records-example.json', { showSource: true })-->
```json
{
  "data": [
    {
      "fieldData": {
        "name": "Anakin Skywalker",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "id": "7362F557-D812-D244-B207-8B5A6F36F194",
        "imageName": "",
        "faceDescriptor": ""
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "736994",
      "modId": "1"
    }
  ]
}
```

> File [./examples/results/find-records-example.json](./examples/results/find-records-example.json)
<!--/@-->

### Edit Records

The client's edit method requires a layout, recordId, and object to use for updating the record.

`client.edit(layout, recordId, data, parameters)`

| Input      |   Type | Description                                  |                                   |
| ---------- | -----: | -------------------------------------------- | --------------------------------- |
| layout     | String | The layout to use when editing the record.   |                                   |
| recordId   | String | Number                                       | The recordId to target for edits. |
| data       | Object | The data to use to edit the record.          |                                   |
| parameters | Object | The parameters to use when editing a record. |                                   |

<!--@snippet('./examples/edit.examples.js#edit-record-example', { showSource: true })-->
```js
const editRecord = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.edit('Heroes', recordId, { name: 'Darth Vader' }))
    .then(result => log('edit-record-example', result));
```

> Excerpt from [./examples/edit.examples.js](./examples/edit.examples.js#L6-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/edit-record-example.json', { showSource: true })-->
```json
{
  "modId": "3"
}
```

> File [./examples/results/edit-record-example.json](./examples/results/edit-record-example.json)
<!--/@-->

### Delete Records

The client's delete method requires a layout and a record id. The recordId can be a number or a string.

`client.delete(layout, recordId, parameters)`

| Input      |   Type | Description                                   |                                      |
| ---------- | -----: | --------------------------------------------- | ------------------------------------ |
| layout     | String | The layout to use when deleting the record.   |                                      |
| recordId   | String | Number                                        | The recordId to target for deletion. |
| parameters | Object | The parameters to use when deleting a record. |                                      |

<!--@snippet('./examples/delete.examples.js#delete-record-example', { showSource: true })-->
```js
const deleteRecords = client =>
  client
    .find('Heroes', [{ name: 'yoda' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.delete('Heroes', recordId))
    .then(result => log('delete-record-example', result));
```

> Excerpt from [./examples/delete.examples.js](./examples/delete.examples.js#L6-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/delete-record-example.json', { showSource: true })-->
```json
{}
```

> File [./examples/results/delete-record-example.json](./examples/results/delete-record-example.json)
<!--/@-->

### Trigger Script

The client's script method will trigger a script. You can also trigger scripts with the create, edit, list, find, and delete methods. This method performs a list with a limit of one on the specified layout before triggering the script. this is the most lightweight request possible while still being able to trigger a script.

`client.script(layout, script, param, parameters)`

| Input      |   Type | Description                                   |
| ---------- | -----: | --------------------------------------------- |
| layout     | String | The layout to use when triggering the script. |
| script     | String | The script to trigger.                        |
| param      |    Any | The parameter to send to the script           |
| parameters | Object | The parameters to use making the request.     |

<!--@snippet('./examples/script.examples.js#script-trigger-example', { showSource: true })-->
```js
const triggerScript = client =>
  client
    .script('Heroes', 'FMS Triggered Script', { name: 'Han' })
    .then(result => log('script-trigger-example', result));
```

> Excerpt from [./examples/script.examples.js](./examples/script.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/script-trigger-example.json', { showSource: true })-->
```json
{
  "result": {
    "answer": "Han shot first"
  }
}
```

> File [./examples/results/script-trigger-example.json](./examples/results/script-trigger-example.json)
<!--/@-->

### Upload Files

The upload method will upload binary data to a container. The file parameter should be either a path to a file or a buffer. If you need to set a field repetition, you can set that in parameters. If recordId is 0 or undefined a new record will be created.

`client.upload(file, layout, container, recordId, parameters)`

| Input      |   Type | Description                               |                                                                                           |
| ---------- | -----: | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| file       | Object | String                                    | The file to upload, Either an object with a buffer and name property or a path to a file. |
| layout     | String | The layout to use when uploading a file.  |                                                                                           |
| container  | String | The container field name to upload into.  |                                                                                           |
| recordId   | String | Number                                    | The recordId to upload to. If omitted or set to zero a record will be created.            |
| parameters | Object | The parameters to use making the request. |                                                                                           |

<!--@snippet('./examples/upload.examples.js#upload-image-example', { showSource: true })-->
```js
const uploadImage = client =>
  client
    .upload('./assets/placeholder.md', 'Heroes', 'image')
    .then(result => log('upload-image-example', result));
```

> Excerpt from [./examples/upload.examples.js](./examples/upload.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/upload-image-example.json', { showSource: true })-->
```json
{
  "modId": "1",
  "recordId": "747669"
}
```

> File [./examples/results/upload-image-example.json](./examples/results/upload-image-example.json)
<!--/@-->

You can also provide a record Id to the upload method and the file will be uploaded to that
record.

<!--@snippet('./examples/upload.examples.js#upload-specific-record-example', { showSource: true })-->
```js
          client
            .upload('./assets/placeholder.md', 'Heroes', 'image', recordId)
            .then(result => log('upload-specific-record-example', result)),
```

> Excerpt from [./examples/upload.examples.js](./examples/upload.examples.js#L20-L22)
<!--/@-->

Result:

<!--@snippet('./examples/results/upload-specific-record-example.json', { showSource: true })-->
```json
{
  "modId": "2",
  "recordId": "733129"
}
```

> File [./examples/results/upload-specific-record-example.json](./examples/results/upload-specific-record-example.json)
<!--/@-->

### Set Session Globals

The globals method will set global fields for the current session.

`client.globals(data, parameters)`

| Input |   Type | Description                              |
| ----- | -----: | ---------------------------------------- |
| data  | Object | The global fields to set for the session |

<!--@snippet('./examples/globals.examples.js#set-globals-example', { showSource: true })-->
```js
const setGlobals = client =>
  client
    .globals({ 'Globals::ship': 'Millenium Falcon' })
    .then(result => log('set-globals-example', result));
```

> Excerpt from [./examples/globals.examples.js](./examples/globals.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/set-globals-example.json', { showSource: true })-->
```json
{}
```

> File [./examples/results/set-globals-example.json](./examples/results/set-globals-example.json)
<!--/@-->

### Utility Methods

The client also provides utility methods to aid in parsing and manipulating FileMaker Data. The client exports the `recordId(data)`, `fieldData(data)`, and `transform(data, options)` to aid in transforming Data API response data into other formats. Each utility method is capable of recieving either an object or a array.

#### recordId Method

The recordId method retrieves the `recordId` properties for a response. This method will return either a single string or an array of strings.

`recordId(data)`

| Input |  Type | Description |                                                                    |
| ----- | ----: | ----------- | ------------------------------------------------------------------ |
| data  | Array | Object      | The FileMaker data to transform. This can be a object or an array. |

<!--@snippet('./examples/utility.examples.js#recordid-utility-example', { showSource: true })-->
```js
const extractRecordId = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => recordId(response.data))
    .then(result => log('recordid-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L7-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/recordid-utility-example.json', { showSource: true })-->
```json
[
  "733133",
  "733440"
]
```

> File [./examples/results/recordid-utility-example.json](./examples/results/recordid-utility-example.json)
<!--/@-->

#### fieldData Method

The fieldData method retrieves the `fieldData`, `recordId`, and `modId` properties from a Data API response. The fieldData method will merge the `recordId` and `modId` properties into fielData properties. This method will not convert `table::field` properties.

`fieldData(data)`

| Input |  Type | Description |                                                                    |
| ----- | ----: | ----------- | ------------------------------------------------------------------ |
| data  | Array | Object      | The FileMaker data to transform. This can be a object or an array. |

<!--@snippet('./examples/utility.examples.js#fielddata-utility-example', { showSource: true })-->
```js
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => fieldData(response.data))
    .then(result => log('fielddata-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L15-L19)
<!--/@-->

Result:

<!--@snippet('./examples/results/fielddata-utility-example.json', { showSource: true })-->
```json
[
  {
    "name": "yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "id": "9ABC4A20-4B02-3D49-95E4-0E0229814C7A",
    "imageName": "",
    "faceDescriptor": "",
    "recordId": "733133",
    "modId": "1"
  },
  {
    "name": "Yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "id": "F6AE1E3E-4BF2-194E-8A04-6FB3E1309B31",
    "imageName": "",
    "faceDescriptor": "",
    "recordId": "733440",
    "modId": "1"
  }
]
```

> File [./examples/results/fielddata-utility-example.json](./examples/results/fielddata-utility-example.json)
<!--/@-->

#### Transform Method

The transform method converts Data API response data by converting `table::field` properties to objects. This method will transverse the response data and converting `{ table::field : value}` properties to `{ table:{ field : value } }`. The transform method will also convert `portalData` into arrays of objects. 

The transform method accepts three option properties. The three option properties are all booleans and true by default. The three option properties are `convert`,`fieldData`,`portalData`. The `convert` property controls the transfomation of `table::field` properties. The `fieldData` property controls the merging of fieldData to the result. The `portalData` property controls the merging of portalData to the result. Setting any propery to false its transformation off. 

`transform(data, parameters)`

| Input      |   Type | Description                                     |                                                                    |
| ---------- | -----: | ----------------------------------------------- | ------------------------------------------------------------------ |
| data       |  Array | Object                                          | The FileMaker data to transform. This can be a object or an array. |
| parameters | Object | The parameters to use when converting the data. |                                                                    |

<!--@snippet('./examples/utility.examples.js#transform-utility-example', { showSource: true })-->
```js
const transformData = client =>
  client
    .find('Transform', { name: 'Han Solo' }, { limit: 1 })
    .then(result => transform(result.data))
    .then(result => log('transform-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L23-L27)
<!--/@-->

Result:

<!--@snippet('./examples/results/transform-utility-example.json', { showSource: true })-->
```json
[
  {
    "starships": "",
    "vehicles": "",
    "species": "",
    "biography": "",
    "birthYear": "",
    "id": "193B8CEE-00CE-D942-92F0-FEEF4DA87967",
    "name": "Han Solo",
    "Planets": [
      {
        "recordId": "2",
        "name": "Coriella",
        "modId": "2"
      }
    ],
    "Vehicles": [
      {
        "recordId": "1",
        "name": "Millenium Falcon",
        "type": "Starship",
        "modId": "2"
      }
    ],
    "recordId": "732824",
    "modId": "3"
  }
]
```

> File [./examples/results/transform-utility-example.json](./examples/results/transform-utility-example.json)
<!--/@-->

## Custom Request Agents, Custom Request Parameters and Proxies

The client has the ability to create custom agents and modify requests parameters or use a proxy. Agents, request parameters, and proxies can be configured either when the client is created or when a request is being made.

### Custom Request Agents

A client can have a custom [Agent](https://nodejs.org/api/http.html#http_class_http_agent). Using a custom request agent will allow you to configure an agent designed for your specific needs. A request agent can be configured to not reject unauthorized request such as those with invalid SSLs, keep the connection alive, or limit the number of sockets to a host. There is no need to create an agent unless theses options are needed.

**Note** If you are using a custom agent you are responsible for destroying that agent with `client.destroy` once the agent is no longer used.

### Custom Request Parameters

All client methods except `client.login()` and `client.logout()` accept request parameters. These parameters are `request.proxy` and `request.timeout`, `request.agent`. These properties will apply only to the current request. 

### Proxies

The client can be configured to use a proxy. The proxy can be configured either for every request by specifying the proxy during the creation of the client, or just for a particular request by specifying the proxy in the request parameters.

## Tests

```sh
npm install
npm test
```

<!--@execute('npm run test',[])-->
```default
> fms-api-client@1.7.3 test /Users/luidelaparra/Documents/Development/fms-api-client
> nyc _mocha --recursive  ./tests --timeout=30000 --exit



  Agent Configuration Capabilities
    ✓ should accept no agent configuration
    ✓ should not create an agent unless one is defined (281ms)
    ✓ adjusts the request protocol according to the server
    ✓ should create a https agent
    ✓ should use a created request agent
    ✓ should destory the agent when the client is deleted
    ✓ should create a http agent
    ✓ should accept a timeout property
    ✓ should use a timeout if one is set
    ✓ should use a proxy if one is set (263ms)
    ✓ should automatically recreate an agent if one is deleted (246ms)

  Authentication Capabilities
    ✓ should authenticate into FileMaker. (91ms)
    ✓ should automatically request an authentication token (215ms)
    ✓ should reuse a saved authentication token (179ms)
    ✓ should log out of the filemaker. (223ms)
    ✓ should not attempt a logout if there is no valid token.
    ✓ should reject if the logout request fails (226ms)
    ✓ should reject if the authentication request fails (1425ms)
    ✓ should attempt to log out before being removed (185ms)
    ✓ should catch the log out error before being removed if the login is not valid

  Create Capabilities
    ✓ should create FileMaker records without fieldData (192ms)
    ✓ should allow you to specify a timeout
    ✓ should create FileMaker records using fieldData (88ms)
    ✓ should create FileMaker records with portalData (91ms)
    ✓ should allow portalData to be an object or number (95ms)
    ✓ should reject bad data with an error (86ms)
    ✓ should create records with mixed types (83ms)
    ✓ should substitute an empty object if data is not provided (93ms)
    ✓ should return an object with merged data properties (91ms)
    ✓ should allow you to run a script when creating a record with a merge response (92ms)
    ✓ should allow you to specify scripts as an array (92ms)
    ✓ should allow you to specify scripts as an array with a merge response (99ms)
    ✓ should sanitize parameters when creating a new record (95ms)
    ✓ should accept both the default script parameters and a scripts array (96ms)
    ✓ should remove an expired token (80ms)

  Delete Capabilities
    ✓ should delete FileMaker records. (273ms)
    ✓ should allow you to specify a timeout (102ms)
    ✓ should trigger scripts via an array when deleting records. (172ms)
    ✓ should trigger scripts via parameters when deleting records. (171ms)
    ✓ should allow you to mix script parameters and scripts array when deleting records. (176ms)
    ✓ should stringify script parameters. (179ms)
    ✓ should reject deletions that do not specify a recordId (83ms)
    ✓ should reject deletions that do not specify an invalid recordId (82ms)
    ✓ should remove an expired token (84ms)

  Edit Capabilities
    ✓ should edit FileMaker records without fieldData
    ✓ should allow you to specify a timeout (219ms)
    ✓ should edit FileMaker records using fieldData
    ✓ should edit FileMaker records with portalData
    ✓ should edit FileMaker records with portalData and allow portalData to be an array.
    ✓ should reject bad data with an error (227ms)
    ✓ should return an object with merged filemaker and data properties
    ✓ should allow you to run a script when editing a record (184ms)
    ✓ should allow you to run a script via a scripts array when editing a record (205ms)
    ✓ should allow you to specify scripts as an array (190ms)
    ✓ should allow you to specify scripts as an array with a merge response (190ms)
    ✓ should sanitize parameters when creating a editing record (183ms)
    ✓ should accept both the default script parameters and a scripts array (190ms)
    ✓ should remove an expired token (174ms)

  FieldData Capabilities
    ✓ it should extract field data while maintaining the array (271ms)
    ✓ it should extract field data while maintaining the object (180ms)

  Find Capabilities
    ✓ should perform a find request (332ms)
    ✓ should allow you to use an object instead of an array for a find (237ms)
    ✓ should specify omit Criterea (128ms)
    ✓ should safely parse omit true and false (142ms)
    ✓ should allow additional parameters to manipulate the results (81ms)
    ✓ should allow you to limit the number of portal records to return (92ms)
    ✓ should allow you to use numbers in the find query parameters (85ms)
    ✓ should allow you to sort the results (722ms)
    ✓ should return an empty array if the find does not return results (96ms)
    ✓ should allow you run a pre request script (97ms)
    ✓ should return a response even if a script fails (99ms)
    ✓ should allow you to send a parameter to the pre request script (96ms)
    ✓ should allow you run script after the find and before the sort (530ms)
    ✓ should allow you to pass a parameter to a script after the find and before the sort (319ms)
    ✓ should reject of there is an issue with the find request (97ms)
    ✓ should remove an expired token (97ms)

  Get Capabilities
    ✓ should get specific FileMaker records. (275ms)
    ✓ should allow you to specify a timeout (103ms)
    ✓ should reject get requests that do not specify a recordId (160ms)
    ✓ should allow you to limit the number of portal records to return (170ms)
    ✓ should accept namespaced portal limit and offset parameters (279ms)
    ✓ should remove an expired token (85ms)

  Global Capabilities
    ✓ should allow you to set session globals (181ms)
    ✓ should allow you to specify a timeout
    ✓ should reject with a message and code if it fails to set a global (100ms)
    ✓ should remove an expired token (86ms)

  Request Interceptor Capabilities
    ✓ should reject if the server errors (122ms)
    ✓ should handle non JSON responses by rejecting with a json error (114ms)
    ✓ should reject non http requests to the server with a json error
    ✓ should reject non https requests to the server with a json error (139ms)

  List Capabilities
    ✓ should allow you to list records (314ms)
    ✓ should allow you to specify a timeout
    ✓ should allow you use parameters to modify the list response (79ms)
    ✓ should should allow you to use numbers in parameters (88ms)
    ✓ should should allow you to provide an array of portals in parameters (92ms)
    ✓ should should remove non used properties from a portal object (91ms)
    ✓ should modify requests to comply with DAPI name reservations (87ms)
    ✓ should allow strings while complying with DAPI name reservations (85ms)
    ✓ should allow you to offset the list response (80ms)
    ✓ should santize parameters that would cause unexpected parameters (86ms)
    ✓ should allow you to limit the number of portal records to return (84ms)
    ✓ should accept namespaced portal limit and offset parameters (85ms)
    ✓ should reject invalid parameters (88ms)
    ✓ should remove an expired token (83ms)

  RecordId Capabilities
    ✓ it should extract the recordId while maintaining the array (269ms)
    ✓ it should extract recordId while maintaining the object (182ms)

  Script Capabilities
    ✓ should allow you to trigger a script (189ms)
    ✓ should allow you to specify a timeout
    ✓ should allow you to trigger a script specifying a string as a parameter (95ms)
    ✓ should allow you to trigger a script specifying a number as a parameter (92ms)
    ✓ should allow you to trigger a script specifying an object as a parameter (87ms)
    ✓ should allow you to trigger a script in a find (232ms)
    ✓ should allow you to trigger a script in a list (89ms)
    ✓ should reject a script that does not exist (112ms)
    ✓ should allow return a result even if a script returns an error (86ms)
    ✓ should parse script results if the results are json (91ms)
    ✓ should not parse script results if the results are not json (87ms)
    ✓ should parse an array of scripts (98ms)
    ✓ should trigger scripts on all three script phases (110ms)
    ✓ should remove an expired token (88ms)

  Storage
    ✓ should allow an instance to be created
    ✓ should allow an instance to be saved.
    ✓ should reject if a client can not be validated
    ✓ should allow an instance to be recalled
    ✓ should allow instances to be listed
    ✓ should allow you to remove an instance

  Transform Capabilities
    ✓ should merge portal data and field data from an array (337ms)
    ✓ should merge portal data and field data from an object (138ms)
    ✓ should optionally not convert table::field keys from an array (142ms)
    ✓ should optionally not convert table::field keys from an object (131ms)
    ✓ should allow you to remove field data from an array (135ms)
    ✓ should allow you to remove field data from an object (145ms)
    ✓ should allow you to remove portal data from an array (136ms)
    ✓ should allow you to remove portal data from an object (134ms)
    ✓ should merge portal data and portal data from an array (133ms)

  File Upload Capabilities
    ✓ should allow you to specify a timeout (204ms)
    ✓ should allow you to upload a file to a new record (1399ms)
    ✓ should allow you to upload a buffer to a new record (1433ms)
    ✓ should allow you to upload a file to a specific container repetition (1331ms)
    ✓ should allow you to upload a buffer to a specific container repetition (1537ms)
    ✓ should reject with a message if it can not find the file to upload
    ✓ should allow you to upload a file to a specific record (2146ms)
    ✓ should allow you to upload a buffer object to a specific record (1533ms)
    ✓ should allow you to upload a file to a specific record container repetition (1536ms)
    ✓ should allow you to upload a buffer to a specific record container repetition (1536ms)
    ✓ should reject of the request is invalid (246ms)
    ✓ should reject an empty buffer object (85ms)
    ✓ should reject a null buffer object (88ms)
    ✓ should reject a number instead of an object (85ms)
    ✓ should reject an object without a filename (85ms)
    ✓ should reject an object without a buffer (83ms)
    ✓ should remove an expired token (82ms)

  Data Usage 
    Tracks Data Usage
      ✓ should track API usage data. (185ms)
      ✓ should allow you to reset usage data. (88ms)
    Does Not Track Data Usage
      ✓ should not track data usage in (174ms)
      ✓ should not track data usage out (83ms)

  Utility Capabilities
    Omit Utility
      ✓ it should remove properties while maintaing the array
      ✓ it should remove properties while maintaing the object
    Parse Utility
      ✓ it should return a string when given a string
      ✓ it should return an object when given a stringified object
    isJson Utility
      ✓ it should return true for an object
      ✓ it should return true for an empty object
      ✓ it should return true for a stringified object
      ✓ it should return false for a number
      ✓ it should return false for undefined
      ✓ it should return false for a string
      ✓ it should return false for null


  167 passing (33s)

------------------------------|----------|----------|----------|----------|-------------------|
File                          |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
------------------------------|----------|----------|----------|----------|-------------------|
All files                     |      100 |      100 |      100 |      100 |                   |
 fms-api-client               |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src           |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src/models    |      100 |      100 |      100 |      100 |                   |
  agent.model.js              |      100 |      100 |      100 |      100 |                   |
  client.model.js             |      100 |      100 |      100 |      100 |                   |
  connection.model.js         |      100 |      100 |      100 |      100 |                   |
  credentials.model.js        |      100 |      100 |      100 |      100 |                   |
  data.model.js               |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src/services  |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
  transform.service.js        |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src/utilities |      100 |      100 |      100 |      100 |                   |
  conversion.utilities.js     |      100 |      100 |      100 |      100 |                   |
  filemaker.utilities.js      |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
  request.utilities.js        |      100 |      100 |      100 |      100 |                   |
 fms-api-client/tests         |      100 |      100 |      100 |      100 |                   |
  transform.tests.js          |      100 |      100 |      100 |      100 |                   |
------------------------------|----------|----------|----------|----------|-------------------|
```
<!--/@-->

<!--@dependencies()-->
## <a name="dependencies">Dependencies</a>

- [axios](https://github.com/axios/axios): Promise based HTTP client for the browser and node.js
- [form-data](https://github.com/form-data/form-data): A library to create readable "multipart/form-data" streams. Can be used to submit forms and file uploads to other web applications.
- [into-stream](https://github.com/sindresorhus/into-stream): Convert a string/promise/array/iterable/buffer/typedarray/arraybuffer/object into a stream
- [lodash](https://github.com/lodash/lodash): Lodash modular utilities.
- [marpat](https://github.com/luidog/marpat): A class-based ES6 ODM for Mongo-like databases.
- [moment](https://github.com/moment/moment): Parse, validate, manipulate, and display dates
- [object-sizeof](https://github.com/miktam/sizeof): Sizeof of a JavaScript object in Bytes
- [prettysize](https://github.com/davglass/prettysize): Convert bytes to other sizes for prettier logging
- [uuid](https://github.com/kelektiv/node-uuid): RFC4122 (v1, v4, and v5) UUIDs

<!--/@-->

<!--@devDependencies()-->
## <a name="dev-dependencies">Dev Dependencies</a>

- [chai](https://github.com/chaijs/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
- [chai-as-promised](https://github.com/domenic/chai-as-promised): Extends Chai with assertions about promises.
- [coveralls](https://github.com/nickmerwin/node-coveralls): takes json-cov output into stdin and POSTs to coveralls.io
- [deep-map](https://github.com/mcmath/deep-map): Transforms nested values of complex objects
- [dotenv](https://github.com/motdotla/dotenv): Loads environment variables from .env file
- [eslint](https://github.com/eslint/eslint): An AST-based pattern checker for JavaScript.
- [eslint-config-google](https://github.com/google/eslint-config-google): ESLint shareable config for the Google style
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier): Runs prettier as an eslint rule
- [fs-extra](https://github.com/jprichardson/node-fs-extra): fs-extra contains methods that aren't included in the vanilla Node.js fs package. Such as mkdir -p, cp -r, and rm -rf.
- [http-proxy](https://github.com/nodejitsu/node-http-proxy): HTTP proxying for the masses
- [jsdoc](https://github.com/jsdoc3/jsdoc): An API documentation generator for JavaScript.
- [minami](https://github.com/Nijikokun/minami): Clean and minimal JSDoc 3 Template / Theme
- [mocha](https://github.com/mochajs/mocha): simple, flexible, fun test framework
- [mocha-lcov-reporter](https://github.com/StevenLooman/mocha-lcov-reporter): LCOV reporter for Mocha
- [mos](https://github.com/mosjs/mos): A pluggable module that injects content into your markdown files via hidden JavaScript snippets
- [mos-plugin-dependencies](https://github.com/mosjs/mos/tree/master/packages/mos-plugin-dependencies): A mos plugin that creates dependencies sections
- [mos-plugin-execute](https://github.com/team-767/mos-plugin-execute): Mos plugin to inline a process output
- [mos-plugin-installation](https://github.com/mosjs/mos/tree/master/packages/mos-plugin-installation): A mos plugin for creating installation section
- [mos-plugin-license](https://github.com/mosjs/mos-plugin-license): A mos plugin for generating a license section
- [mos-plugin-snippet](https://github.com/mosjs/mos/tree/master/packages/mos-plugin-snippet): A mos plugin for embedding snippets from files
- [nyc](https://github.com/istanbuljs/nyc): the Istanbul command line interface
- [prettier](https://github.com/prettier/prettier): Prettier is an opinionated code formatter
- [varium](https://npmjs.org/package/varium): A strict parser and validator of environment config variables

<!--/@-->

<!--@license()-->
## License

MIT © Lui de la Parra
<!--/@-->
