import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { createThumbnail } from '../worker';

const atob = (str) => Buffer.from(str, 'base64').toString('binary');

export async function files(req, res) {
  // retrive the x-token
  const token = req.headers['x-token'];

  // retrive the user based on the token
  // created a key to retrive a value=userid from redis
  const key = `auth_${token}`;

  const valueUserid = await redisClient.get(key);
  if (!valueUserid) {
    const resp = { error: 'Unauthorized' };
    return res.status(401).send(resp);
  }

  // get the user object while converting valueUserid to Objectid
  const objectId = new ObjectId(valueUserid);

  const user = await dbClient.userByid(objectId);
  if (!user) {
    const resp = { error: 'Unauthorized' };
    return res.status(401).send(resp);
  }

  // grab the file creation requirements
  const { name, type, data } = req.body;
  let { parentId, isPublic } = req.body;
  if (!parentId) {
    parentId = 0;
  }

  if (!isPublic) {
    isPublic = false;
  }

  // if name is missing return an error
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  // if type missing or not part of accepted list return error
  const types = ['folder', 'file', 'image'];
  if (!type || !types.includes(type)) {
    return res.status(400).send({ error: 'Missing type' });
  }

  // if data is missing and type not folder error
  if (!data && type !== 'folder') {
    return res.status(400).send({ error: 'Missing data' });
  }

  // If the parentId is set get the filefolder
  if (parentId) {
    const fId = new ObjectId(parentId);
    const fileObj = await dbClient.parentid(fId);
    // if no file present error
    if (!fileObj) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    // if file present but not type folder error
    if (fileObj && fileObj.type !== 'folder') {
      return res.status(400).send({ error: 'Parent is not a folder' });
    }

    // update the document saved in db with user id as owner of the folder
    const folderid = fileObj._id;
    // update
    const value = user._id.toString();

    await dbClient.addnewfield(folderid, 'userId', value);
  }

  // If the type is folder, add the new file document in the DB
  const value = user._id.toString();
  if (type === 'folder') {
    const contents = {
      name,
      type,
      parentId,
      isPublic,
      userId: value,
    };
    const newfolder = await dbClient.newfile(contents);
    if (newfolder) {
      return res.status(201).send(newfolder);
    }
  }

  // All file will be stored locally in a folder
  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

  // generate a filename as uuid
  const filename = v4();

  const pathFile = `${folderPath}/${filename}`;

  // decode data to be written to a file
  const details = atob(data);

  // Create a dir if not exists
  const directory = path.dirname(pathFile);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // write to file
  fs.writeFile(pathFile, details, async (err) => {
    if (err) {
      console.error('Error saving file:', err.message);
    } else {
      // Add the new file document in the collection files
      const value = user._id.toString();
      const fileOrimage = {
        userId: value,
        name,
        type,
        isPublic,
        parentId,
        localPath: pathFile,
      };

      const newfile = await dbClient.newfile(fileOrimage);
      console.log(newfile);
      // console.log(`userid: ${value}, fileid: ${newFile._id}`);
      // create thumbnail in background
      createThumbnail(newfile._id, value);

      return res.status(201).json(newfile);
    }
  });
}

//  retrieve the file document based on the ID
export async function filesById(req, res) {
  // get the id
  const fileId = req.params.id;

  // convert id to object id
  const objId = new ObjectId(fileId);

  // retrive the file document
  const fileDoc = await dbClient.parentid(objId);

  // get the token and get the user
  const token = req.headers['x-token'];

  // get the user id from redis
  const key = `auth_${token}`;
  const useridredis = await redisClient.get(key);
  if (!useridredis) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // If no file document is linked to the user and the
  // ID passed as parameter, return an error Not found
  if (fileDoc.userId !== useridredis) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(200).json(fileDoc);
}

// retrieve all users file documents for a specific parentId and with pagination
export async function usersfiles(req, res) {
  // get the token
  const token = req.headers['x-token'];

  // get user id from redis
  const key = `auth_${token}`;
  const useridredis = await redisClient.get(key);
  if (!useridredis) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // get query parameters
  const page = parseInt(req.query.page) || 0;
  const parentId = req.query.parentId || 0;

  const limit = 20;

  const filesParent = await dbClient.parentidPagination(parentId, useridredis, page, limit);
  return res.status(200).json(filesParent);
}

// publish by setting isPublic to true
export async function publish(req, res) {
  // get the token
  const token = req.headers['x-token'];

  const key = `auth_${token}`;
  const useridredis = await redisClient.get(key);
  if (!useridredis) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  // get file id param
  const fileId = req.params.id;
  const objId = new ObjectId(fileId);
  const fileObj = await dbClient.parentid(objId);
  // if no file is linked to user error
  if (useridredis !== fileObj.userId) {
    return res.status(404).json({ error: 'Not found' });
  }
  // updated isPublic to true
  const val = true;
  const updated = await dbClient.publishUpublish(objId, val);

  return res.status(200).json(updated);
}

export async function unPublish(req, res) {
  // get the token
  const token = req.headers['x-token'];

  const key = `auth_${token}`;
  const useridredis = await redisClient.get(key);
  if (!useridredis) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  // get file id param
  const fileId = req.params.id;
  const objId = new ObjectId(fileId);
  const fileObj = await dbClient.parentid(objId);
  // if no file is linked to user error
  if (useridredis !== fileObj.userId) {
    return res.status(404).json({ error: 'Not found' });
  }
  // updated isPublic to true
  const val = false;
  const updated = await dbClient.publishUpublish(objId, val);

  return res.status(200).json(updated);
}

// should return the content of the file document based on the ID
export async function data(req, res) {
  const fileId = req.params.id;
  const idFileObj = new ObjectId(fileId);
  const fileObject = await dbClient.parentid(idFileObj);
  if (!fileObject) {
    return res.status(404).json({ error: 'Not found' });
  }

  // get token to retrive the userid
  const token = req.headers['x-token'];
  const key = `auth_${token}`;
  const useridredis = await redisClient.get(key);
  // if file not public and no user authecticated or not the owner error
  if (fileObject.isPublic === true && !useridredis) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (useridredis !== fileObject.userId) {
    console.log(useridredis);
  }
  if (fileObject.isPublic === false && !useridredis) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (useridredis && useridredis !== fileObject.userId) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (fileObject.type === 'folder') {
    return res.status(400).json({ error: "folder doesn't have content" });
  }

  // check if file exists localy
  fs.access(fileObject.localPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Not found' });
    }
    console.log('Exist');
  });

  // determine the MIME type based on file name
  const mimeType = mime.lookup(fileObject.name);

  // read the file
  fs.readFile(fileObject.localPath, (err, data) => {
    if (!err) {
      // set the appropriate mime-type
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    }
  });
}
