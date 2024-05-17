import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// fucction to hash a password with SHA1
export default function hassPassword(password) {
  // create a SHA1 obj
  const sha1 = crypto.createHash('sha1');

  // update with the password
  sha1.update(password);

  // get the pass in hexadecimal format
  const hashed = sha1.digest('hex');

  return hashed;
}

// create a new user and validation
export async function postNew(req, res) {
  // get the email and password
  const { email, password } = req.body;
  // use     newUser()    findUser()
  // return an error if email is missing
  if (!email) {
    res.status(400).send('Missing email');
  }

  // return an error if password is missing
  if (!password) {
    res.status(400).send('Missing password');
  }

  // check if email alredy exists and return an error
  const existEmail = await dbClient.findUser(email);
  if (existEmail) {
    return res.status(400).send('Already exists');
  }

  // hass the password with SHA1
  const hashedPassword = hassPassword(password);

  // create a new user
  const userid = await dbClient.newUser(email, hashedPassword);

  if (userid) {
    const response = { id: userid, email };
    return res.status(201).send(response);
  }
  return res.status(500).send('Failed to create a user');
}

// should retrieve the user base on the token used
export async function usersMe(req, res) {
  // grab the x-Token headers
  const token = req.headers['x-token'];

  // construct the key to get the value from redis
  const key = `auth_${token}`;

  // get the value from redis
  const value = await redisClient.get(key);
  if (!value) {
    // if not value/userid the user does not exist
    const errRes = { error: 'Unauthorized' };
    return res.status(401).send(errRes);
  }
  // the user object based on id
  // convert the string value to mongoDB Objectid
  const objectId = new ObjectId(value);
  const user = await dbClient.userByid(objectId);
  if (!user) {
    const erruser = { error: 'Unauthorized' };
    return res.status(401).send(erruser);
  }
  // Otherwise, return the user object (email and id only)
  const returnObj = { email: user.email, id: user._id };
  return res.status(200).send(returnObj);
}
