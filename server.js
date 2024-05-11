// Importing required modules
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const fs = require('fs');
const winston = require('winston');
const { setupSwagger, SWAGGER_URL_V1 } = require('./swaggerSetup');

// Importing routes and helpers
const v1Route = require('./api/v1/index');
const createResponse = require('./api/v1/helpers/createResponse');
const findAvailablePort = require('./api/v1/helpers/server/choosePort');

// Creating express app and setting up middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());

// Setting up rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Setting up logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logfile.log' })
  ]
});

// Setting up port
let port = process.env.PORT || 6969;

// Starting server
(async () => {
  try {
    const availablePort = await findAvailablePort(port);
    port = availablePort;
    console.log(`Using port ${port}`);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Error finding available port:', err);
    process.exit(1);
  }
})();

// Setting up Swagger
setupSwagger(app);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Setting up routes
app.use('/api/v1', v1Route);
app.get('/v1', (req, res) => {
  res.redirect(SWAGGER_URL_V1);
});

// Setting up root route
const versions = fs.readdirSync('./api', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);
app.get('/', (req, res) => {
  res.send(`Welcome to the API! You can specify the version of the API in the URL, like /api/v1 or /api/v2. Currently, the available versions are: ${versions.join(', ')}`);
});

// Error handling
app.use((req, res) => {
  res.status(404).json(createResponse(404, 'Not found. Invalid route.', 'error', 'Please check the URL and the method used.'));
});
app.use((err, req, res, next) => {
  const errorCode = err.status || 500;
  res.status(errorCode).json(createResponse(errorCode, err.message, 'error', 'An error occurred. Please try again later.'));
});

// Function to handle shutdown
function handleShutdown(signal) {
  console.info(`${signal} signal received.`);
  console.log('Closing http server.');
  server.close(() => {
    console.log('Http server closed.');
    // It's important to exit the process explicitly
    // to ensure that no other tasks are still running
    process.exit(0);
  });
}

// Handling shutdown signals
process.on('SIGINT', handleShutdown.bind(null, 'SIGINT'));
process.on('SIGTERM', handleShutdown.bind(null, 'SIGTERM'));
process.on('SIGQUIT', handleShutdown.bind(null, 'SIGQUIT'));