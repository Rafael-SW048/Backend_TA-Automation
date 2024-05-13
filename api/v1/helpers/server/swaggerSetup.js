const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');

const SWAGGER_URL_V1 = '/api/docs/v1';
const API_URL_V1 = path.join(__dirname, 'static/swagger_v1.yaml');

function setupSwagger(app) {
  const swaggerDocument = yaml.load(fs.readFileSync(API_URL_V1, 'utf8'));
  
  app.use(SWAGGER_URL_V1, swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customSiteTitle: "Test application - Version 1"
  }));
}

module.exports = { setupSwagger, SWAGGER_URL_V1 };