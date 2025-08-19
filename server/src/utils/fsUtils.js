const fs = require('fs');
const path = require('path');

function ensureDirectory(dirPath) {
  const absolute = path.isAbsolute(dirPath) ? dirPath : path.resolve(process.cwd(), dirPath);
  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

module.exports = { ensureDirectory };

