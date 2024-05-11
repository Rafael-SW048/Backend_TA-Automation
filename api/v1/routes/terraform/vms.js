const express = require('express');
const router = express.Router();
const createVM = require('../../controllers/terraform/vms/createVM.js');
const deleteVM = require('../../controllers/terraform/vms/deleteVM.js');
const checkVMTemplate = require('../../controllers/terraform/vms/checkVMTemplates.js');

const createResponse = require('../../helpers/createResponse.js');

router.post('/', createVM);
router.delete('/:vm_sid', deleteVM);
router.get('/check-template', checkVMTemplate);


module.exports = router;