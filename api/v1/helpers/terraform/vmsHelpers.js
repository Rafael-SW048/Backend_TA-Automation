const fs = require('fs');
const path = require('path');
const hcl = require("js-hcl-parser")
// const { assignPciToVm } = require('./validateVGA'); // Import the assignPciToVm function from VGA.js
const { ServerError, MissingKeyError, InvalidTypeError, ValueRestrictionError, OperationError } = require('../error');

exports.updatePciData = (vmConfig) => {
  for (let vmSid in vmConfig) {
    let vmInfo = vmConfig[vmSid];
    let pciDevice = vmInfo['pci_device'];
    if (pciDevice) {
      try {
        let [availablePciIds, _] = assignPciToVm(pciDevice);
        if (availablePciIds) {
          vmInfo['pci_device'] = availablePciIds[0];
        } else {
          vmInfo['pci_device'] = "";
        }
      } catch (err) {
        throw new ServerError(`Error while assigning PCI device for ${vmSid}: ${err}`);
      }
    }
  }
  return vmConfig;
};

exports.validateAndFillDefaults = async (vmConfig, getTemplatesName) => {
  const requiredKeys = ["name", "desc", "SID"];

  const optionalKeysWithDefaults = {
    "cores": 6,
    "cpu_type": "host",
    "memory": 8192,
    "clone": "Win11x64-VM-template-cloudbaseInit-raw-NoSysPrep",
    "dns": "",
    "ip": "",
    "gateway": "",
    "pci_device": "GeForce RTX 4070 Ti"
  };

  const templatesName = await getTemplatesName();
  
  // In your validateAndFillDefaults function
  if (templateNames.length > 0) {
    optionalKeysWithDefaults["clone"] = templateNames[0];
  } else {
    throw new ServerError("No templates available");
  }

  if (templatesName.length > 0) {
    optionalKeysWithDefaults["clone"] = templatesName[0];
  } else {
    throw new ServerError("No templates available");
  }

  for (let key of requiredKeys) {
    if (!(key in vmConfig)) {
      throw new MissingKeyError(key);
    }
    if (typeof vmConfig[key] !== 'string') {
      throw new InvalidTypeError(key, 'string', typeof vmConfig[key]);
    }
    if (key === 'dns' || key === 'ip' || key === 'gateway') {
      if (vmConfig[key]) {
        throw new ValueRestrictionError(key, "empty", vmConfig[key]);
      }
    }
  }

  return vmConfig;
};

exports.loadHclConfig = async (path) => {
  try {
    const data = await fs.readFileSync(path, 'utf8');
    return  hcltojson(data);
  } catch (err) {
    throw new ServerError(`Error while loading HCL config: ${err.message}`);
  }
};

exports.saveHclConfig = async (data, path) => {
  // let fileContent = hcl.stringify(data);
  let fileContent = 'vms_config = {\n';
  for (let [vm, config] of Object.entries(data['vms_config'])) {
    fileContent += `  ${vm} = {\n`;
    for (let [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        fileContent += `    ${key} = "${value}"\n`;
      } else {
        fileContent += `    ${key} = ${value}\n`;
      }
    }
    fileContent += '  }\n';
  }
  fileContent += '}\n';
  try {
    await fs.promises.writeFile(path, fileContent);
  } catch (err) {
    throw new ServerError(`Error while saving HCL config: ${err.message}`);
  }
};

exports.addVmConfig = async (vmConfig) => {
  try {
    const configPath = '~/TA-Automation/terraform/proxmox/vms_config.auto.tfvars';
    let data = await exports.loadHclConfig(configPath);
    
    const vmId = Object.keys(vmConfig)[0];
    if (vmId in data['vms_config']) {
      throw new OperationError(`VM configuration for ${vmId} already exists`);
    }
    
    await exports.updatePciData(vmConfig);
    data['vms_config'] = {...data['vms_config'], ...vmConfig};
    exports.saveHclConfig(data, configPath);
  } catch (err) {
    throw new ServerError(`Error while adding VM configuration: ${err}`);
  }
};

exports.updateTfvars = async (vmTemplates) => {
  try {
    const vmTemplateId = {};
    for (let [name, id] of Object.entries(vmTemplates)) {
      vmTemplateId[name] = parseInt(id);
    }

    // Read existing tfvars content
    const tfvarsPath = path.resolve('~/TA-Automation/terraform/proxmox/win11_cloudbase-init.auto.tfvars');
    let tfvarsContent = await (fs.readFileSync(tfvarsPath, 'utf8')).split('\n');

    // Find the start and end lines of the vm_template_id section
    const startLine = tfvarsContent.findIndex(line => line.trim().startsWith('vm_template_id = {')) + 1;
    const endLine = tfvarsContent.slice(startLine).findIndex(line => line.trim() === '}') + startLine;

    // Remove the old vm_template_id section, including the closing brace
    tfvarsContent.splice(startLine, endLine - startLine + 1);

    // Insert the new vm_template_id section
    const newSection = Object.entries(vmTemplateId).map(([name, id]) => `  "${name}" = ${id},`);
    newSection.push('}');
    tfvarsContent.splice(startLine, 0, ...newSection);

    // Write updated content back to tfvars file
    await fs.writeFileSync(tfvarsPath, tfvarsContent.join('\n'));
  } catch (err) {
    throw new ServerError(`Error while updating tfvars: ${err.message}`);
  }
};

exports.deleteVmConfig = async (vmSid) => {
  try {
    const configPath = path.resolve('~/TA-Automation/terraform/proxmox/vms_config.auto.tfvars');
    let data = await exports.loadHclConfig(configPath);

    if (!(vmSid in data['vms_config'])) {
      throw new MissingKeyError(vmSid);
    }

    delete data['vms_config'][vmSid];
    await saveHclConfig(data, configPath); // Assuming you have a function to save JSON as HCL
  } catch (err) {
    throw new ServerError(`Error while deleting VM configuration: ${err.message}`);
  }
};