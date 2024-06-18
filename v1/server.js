import express from 'express';

// import router
import router from './routes/index';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// use the router middleware
app.use('/', router);

// start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
