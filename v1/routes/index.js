// Write the routes
import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';

const router = express.Router();

// link to GET /status
router.get('/status', getStatus);

// link GET /stats
router.get('/stats', getStats);

// Export router
module.exports = router;
