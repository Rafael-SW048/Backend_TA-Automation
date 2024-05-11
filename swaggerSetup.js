const path = require('path');
const swaggerUi = require('swagger-ui-express');

const SWAGGER_URL_V1 = '/api/docs/v1';
const API_URL_V1 = path.join(__dirname, 'static/swagger_v1.json');

function setupSwagger(app) {
  app.use(SWAGGER_URL_V1, swaggerUi.serve, swaggerUi.setup({
    swaggerUrl: API_URL_V1,
    config: {
      app_name: "Test application - Version 1"
    }
  }));
}

module.exports = { setupSwagger, SWAGGER_URL_V1 };