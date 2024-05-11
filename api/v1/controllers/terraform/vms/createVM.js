const createResponse = require('../../../helpers/createResponse')
const { ServerError, MissingKeyError, InvalidTypeError, ValueRestrictionError, OperationError } = require('../../../helpers/error');
const { validateAndFillDefaults } = require('../../../helpers/terraform/vmsHelpers')

const createVM = async (req, res) => {
  try {
    const vmConfig = req.body;
    if (!vmConfig) {
      throw new Error("Request data is not JSON");
    }
    const validatedConfig = {};
    for (let [key, value] of Object.entries(vmConfig)) {
      validatedConfig[key] = await validateAndFillDefaults(value);
    }
    const pciUpdatedConfig = updatePciData(validatedConfig);
    await addVmConfig(pciUpdatedConfig);
    await updateTfvars(pciUpdatedConfig);
    // await updateTerraformState();
    res.status(200).json(createResponse(200, 'VM configuration added successfully'));
  } catch (err) {
    if (err instanceof MissingKeyError) {
      console.error("Missing key in VM configuration", err);
      res.status(400).json(createResponse(400, `Missing key in VM configuration: ${err.key}`, 'error', "Ensure all required keys are provided."));
    } else if (err instanceof OperationError) {
      console.log("Operation error", err);
      res.status(400).json(createResponse(400, err.message, 'error', "Operation cannot proceed."));
    } else if (err instanceof InvalidTypeError) {
      console.error("Invalid type for key in VM configuration", err);
      res.status(400).json(createResponse(400, `Invalid type for key in VM configuration: ${err.key}, expected ${err.expectedType}, got ${err.actualType}`, 'error', "Ensure all data types are valid."));
    } else if (err instanceof ValueRestrictionError) {
      console.error("Value restriction error", err);
      res.status(400).json(createResponse(400, `Value restriction error: ${err.message}`, 'error', `The value for ${err.key} must be ${err.expectedValue}.`));
    } else if (err instanceof ServerError) {
      console.error("Server error", err);
      res.status(500).json(createResponse(500, err.message, 'error', err));
    } else {
      console.error("Unexpected error during vm creation", err);
    }
  }
};

module.exports = createVM;