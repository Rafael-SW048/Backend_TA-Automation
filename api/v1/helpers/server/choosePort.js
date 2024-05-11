const net = require('net');

function checkPortAvailability(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        server.once('close', () => {
          resolve(true);
        }).close();
      })
      .listen(port);
  });
}

async function findAvailablePort(startPort) {
  let availablePort = startPort;
  let portAvailable = await checkPortAvailability(availablePort);

  while (!portAvailable) {
    availablePort++;
    portAvailable = await checkPortAvailability(availablePort);
  }

  return availablePort;
}

module.exports = findAvailablePort;