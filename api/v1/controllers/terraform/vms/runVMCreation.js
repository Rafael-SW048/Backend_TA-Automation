const { spawn } = require('child_process');
const fs = require('fs');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);

    process.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.log("Error during command execution. Exiting.");
        process.exit(1);
      }
      resolve();
    });
  });
}

async function updateTerraformState() {
  try {
    // Run the user_vm_config.py script
    await runCommand("python3", ["/root/TA-Automation/terraform/proxmox/win11_cloudbase-init/scripts/user_vm_config.py"]);

    // Run the Terraform commands
    await runCommand("terraform", ["validate"]);
    await runCommand("terraform", ["apply", "-auto-approve", "--var-file=../credentials.tfvars"]);

    fs.unlinkSync("test.plan");
  } catch (err) {
    if (err instanceof Error) {
      console.log("Script interrupted. Exiting.");
      process.exit(1);
    }
  }
}

updateTerraformState();