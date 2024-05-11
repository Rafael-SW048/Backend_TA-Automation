const { ServerError, MissingKeyError, InvalidTypeError, ValueRestrictionError, OperationError } = require('../../../helpers/error');
const { exec } = require('child_process');
const util = require('util');
const createResponse = require('../../../helpers/createResponse');
const { updateTfvars } = require('../../../helpers/terraform/vmsHelpers')
const execPromise = util.promisify(exec);


const checkVMTemplate = async () => {
  try {
    const command = 'pvesh get /pools/Templates --output-format json | jq -r \'.members[] | select(.id | startswith("qemu")) | {id: (.id | split("/")[1]), name: .name}\'';
    const { stdout } = await execPromise(command);
    
    const lines = stdout.split('\n');
    const jsonObjects = lines.join('').split('}').filter(Boolean).map(str => str + '}');
    const output = jsonObjects.reduce((acc, jsonStr) => {
      const jsonObj = JSON.parse(jsonStr);
      acc[jsonObj.name] = jsonObj.id;
      return acc;
    }, {});

    await updateTfvars(output);

    if (!Object.keys(output).length) {
      return createResponse(200, 'No VM templates exist', 'success', 'No VM templates found');
    }

    return createResponse(200, 'VM templates retrieved successfully', 'success', Object.keys(output));
  } catch (err) {
    if (err instanceof ServerError) {
      console.error("Server error while checking VM templates", err);
      return createResponse(500, 'Internal server error', 'error', err.message);
    } else {
      console.error("Unexpected error while checking VM templates", err);
    }
  }
}

module.exports = checkVMTemplate;