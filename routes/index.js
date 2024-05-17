// Write the routes
import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { postNew, usersMe } from '../controllers/UsersController';
import { connect, disconnect } from '../controllers/AuthController';
import {
  files, usersfiles, filesById, publish, unPublish, data,
} from '../controllers/FilesController';

const router = express.Router();

// link to GET /status
router.get('/status', getStatus);

// link GET /stats
router.get('/stats', getStats);

// POST /users
router.post('/users', postNew);

// GET /connect
router.get('/connect', connect);

// GET /disconnect
router.get('/disconnect', disconnect);

// GET /users/me
router.get('/users/me', usersMe);

// POST /files
router.post('/files', files);

// GET /files/:id
router.get('/files/:id', filesById);

// GET /files
router.get('/files', usersfiles);

// /files/:id/publish
router.put('/files/:id/publish', publish);

// /files/:id/unpublish
router.put('/files/:id/unpublish', unPublish);

// /files/:id/data
router.get('/files/:id/data', data);

// Export router
module.exports = router;
