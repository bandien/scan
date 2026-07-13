const { spawn } = require('child_process');

console.log("Starting ngrok tunnel 'erpnext' using config in AppData...");

// Spawn ngrok in a shell so it resolves path aliases correctly on Windows
const ngrok = spawn('ngrok', ['start', 'erpnext'], {
  stdio: 'inherit',
  shell: true
});

ngrok.on('error', (err) => {
  console.error('Failed to start ngrok child process:', err);
  process.exit(1);
});

ngrok.on('close', (code) => {
  console.log(`ngrok process exited with code ${code}`);
  process.exit(code || 0);
});
