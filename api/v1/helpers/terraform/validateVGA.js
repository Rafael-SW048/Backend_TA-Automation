const { execSync } = require('child_process');

function getVgaInfo() {
  const lspciOutput = execSync('lspci | grep VGA').toString();
  const vgaLines = lspciOutput.trim().split('\n');

  const vgaInfo = {};
  vgaLines.forEach(line => {
    const match = line.match(/(\d+:\d+\.\d+) VGA compatible controller: (.+)/);
    if (match) {
      let pciId = match[1];
      if (pciId.split(':')[0].length < 4) {
        pciId = '0000:' + pciId;
      }
      vgaInfo[pciId] = match[2];
    }
  });

  return vgaInfo;
}

function getVmPciDevices(vmId) {
  const output = execSync(`qm config ${vmId}`).toString();
  const lines = output.split('\n');

  const pciDevices = [];
  lines.forEach(line => {
    if (line.includes('hostpci')) {
      const match = line.match(/hostpci\d*: ([\w:.]+)/);
      if (match) {
        let pciDevice = match[1];
        if (!pciDevice.match(/\.\d+$/)) {
          pciDevice += '.0';
        }
        pciDevices.push(pciDevice);
      }
    }
  });

  return pciDevices;
}

function getAllVmPciDevices() {
  const output = execSync('qm list').toString();
  const lines = output.split('\n').slice(1);

  const vmPciDevices = {};
  lines.forEach(line => {
    const vmId = parseInt(line.split(' ')[0]);
    vmPciDevices[vmId] = getVmPciDevices(vmId);
  });

  return vmPciDevices;
}

// function assignPciToVm(vgaType = 'GeForce RTX 4070 Ti') {
//   const existingVgaInfo = getVgaInfo();
//   const matchingPciIds = Object.keys(existingVgaInfo).filter(pciId => existingVgaInfo[pciId].includes(vgaType));

//   if (matchingPciIds.length === 0) {
//     throw new Error(`No PCI VGA devices found matching the type '${vgaType}'.`);
//   }

//   const vmPciDevices = getAllVmPciDevices();
//   const usedPciIds = {};
//   Object.entries(vmPciDevices).forEach(([vmId, pciIds]) => {
//     pciIds.forEach(pciId => {
//       if (matchingPciIds.includes(pciId)) {
//         if (!usedPciIds[pciId]) {
//           usedPciIds[pciId] = [];
//         }
//         usedPciIds[pciId].push(vmId);
//       }
//     });
//   });

//   const availablePciIds = matchingPciIds.filter(pciId => !Object.keys(usedPciIds).includes(pciId));

//   return [availablePciIds, usedPciIds];
// }

function assignPciToVm(vgaType = 'GeForce RTX 4070 Ti') {
  const existingVgaInfo = getVgaInfo();
  const matchingPciIds = new Set(Object.keys(existingVgaInfo).filter(pciId => existingVgaInfo[pciId].includes(vgaType)));

  if (matchingPciIds.size === 0) {
    throw new Error(`No PCI VGA devices found matching the type '${vgaType}'.`);
  }

  const vmPciDevices = getAllVmPciDevices();
  const usedPciIds = {};
  Object.entries(vmPciDevices).forEach(([vmId, pciIds]) => {
    pciIds.forEach(pciId => {
      if (matchingPciIds.has(pciId)) {
        if (!usedPciIds[pciId]) {
          usedPciIds[pciId] = [];
        }
        usedPciIds[pciId].push(vmId);
        matchingPciIds.delete(pciId);
      }
    });
  });

  return [Array.from(matchingPciIds), usedPciIds];
}

// try {
//   const [availablePciIds, usedPciIds] = assignPciToVm('GeForce RTX 4070 Ti');

//   if (availablePciIds.length > 0) {
//     console.log('Available PCI IDs for assignment:');
//     availablePciIds.forEach(pciId => console.log(pciId));
//   } else {
//     console.log('All PCI IDs for the specified VGA type are already used.');
//   }

//   if (Object.keys(usedPciIds).length > 0) {
//     console.log('\nUsed PCI IDs:');
//     Object.entries(usedPciIds).forEach(([pciId, vmIds]) => console.log(`PCI ID: ${pciId}, Used by VMs: ${vmIds}`));
//   }
// } catch (error) {
//   console.error(error);
// }