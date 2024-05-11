const express = require('express');
const router = express.Router();
const terraformRoutes = require('./routes/terraform/');
const app = express();

router.use('/terraform', terraformRoutes);

module.exports = router;
