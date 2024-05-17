import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// GET /status should return if Redis is alive and if
// the DB is alive too by using the 2 utils created
// previously: { "redis": true, "db": true } with
// a status code 200
export function getStatus(request, response) {
  const redisStatus = redisClient.isAlive();
  const mongoStatus = dbClient.isAlive();
  const statusRes = { redis: redisStatus, db: mongoStatus };
  response.status(200).send(statusRes);
}

// GET /stats should return the number of users and files
// in DB: { "users": 12, "files": 1231 } with a status code 200
// users collection must be used for counting all users
// files collection must be used for counting all files
export async function getStats(request, response) {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();
  const statusRes = { users, files };
  response.status(200).send(statusRes);
}
