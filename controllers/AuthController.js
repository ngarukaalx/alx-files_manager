import { v4 } from 'uuid';
import { hassPassword } from './UsersController';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const atob = (str) => Buffer.from(str, 'base64').toString('binary');

export async function connect(req, res) {
  // get authorization header
  const authHeader = req.headers.authorization;
  const basicValue = authHeader.split(' ');
  // get emailpassword encoded value
  const encodedPassEmail = basicValue[1];

  // decode using atob() function
  const decoded = atob(encodedPassEmail);

  // split to get email and password using the first :
  const emailAndpass = decoded.split(':');
  const emailUser = emailAndpass[1];
  if (!emailUser) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  // hash the pass with SHA1
  const hashedpasss = hassPassword(emailUser);
  const email = emailAndpass[0];

  // check if the user exists
  const exists = await dbClient.finduserEp(email, hashedpasss);

  // if no user found return an error
  if (!exists) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  // generate a random string using uuid
  const randomString = v4();
  // create key and value as userid
  const redisKey = `auth_${randomString}`;
  const redisvalue = exists._id;
  // set value with an expiration of 24hours
  redisClient.set(redisKey, redisvalue.toString(), 86400);

  const returnToken = { token: randomString };
  return res.status(200).send(returnToken);
}

// disconnect should sign-out the user based on the token
export async function disconnect(req, res) {
  // get the header X-Token
  const token = req.headers['x-token'];
  // create the key using token
  const key = `auth_${token}`;

  // retrive the user bazed on the key from redis
  const value = await redisClient.get(key);
  console.log('this the value: ', value);
  if (!value) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  // delete the token in redis and return nothing with status 204
  redisClient.del(key);
  return res.status(204).send();
}
