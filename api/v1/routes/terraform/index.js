const express = require('express');
const router = express.Router();
const vms = require('./vms');

router.use('/vms', vms);

module.exports = router;
