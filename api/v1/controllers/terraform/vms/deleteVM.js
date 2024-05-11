const { ServerError, MissingKeyError, InvalidTypeError, ValueRestrictionError, OperationError } = require('../../../helpers/error');
const createResponse = require('../../../helpers/createResponse');
const { deleteVmConfig, updatePciData } = require('../../../helpers/terraform/vmsHelpers')

const deleteVM = async (req, res) => {
  try {
    await deleteVmConfig(req.params.vm_sid);
    await updateTfvars({});
    // await updateTerraformState();
    res.status(200).json(createResponse(200, 'VM configuration deleted successfully'));
  } catch (err) {
    if (err instanceof MissingKeyError) {
      console.error("Missing key error during deletion", err);
      res.status(400).json(createResponse(400, err.message, 'error'));
    } else if (err instanceof ServerError) {
      console.error("Server error during deletion", err);
      res.status(500).json(createResponse(500, "Server", 'error'));
    } else {
      console.error("Unexpected error during vm deletion", err);
    }
  }
}

module.exports = deleteVM;