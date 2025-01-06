const fs = require('fs');
const path = require('path');

// Create dist/nodes directory if it doesn't exist
const distNodesDir = path.join(__dirname, 'dist', 'nodes');
if (!fs.existsSync(distNodesDir)) {
    fs.mkdirSync(distNodesDir, { recursive: true });
}

// Copy teams.svg from src/nodes to dist/nodes
const srcSvg = path.join(__dirname, 'src', 'nodes', 'teams.svg');
const destSvg = path.join(distNodesDir, 'teams.svg');

try {
    fs.copyFileSync(srcSvg, destSvg);
    console.log('Successfully copied teams.svg to dist folder');
} catch (err) {
    console.error('Error copying teams.svg:', err);
    process.exit(1);
} 