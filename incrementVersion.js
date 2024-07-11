const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, 'version');
const jsFiles = [
  path.join(__dirname, 'deboucled.user.js'),
  path.join(__dirname, 'deboucled.meta.js')
];

// Read the current version from the version file
fs.readFile(versionFile, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file ${versionFile}:`, err);
    return;
  }

  const currentVersion = data.trim();
  const newVersion = incrementPatch(currentVersion);
  console.log(`Updating version from ${currentVersion} to ${newVersion}`);

  // Update the version in all files
  updateVersionInFiles(newVersion);
});

function updateVersionInFiles(newVersion) {
  // Update version in JavaScript files
  jsFiles.forEach(file => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${file}:`, err);
        return;
      }

      const updatedData = data.replace(/(@version\s+)(\d+\.\d+\.\d+)/, (match, prefix, version) => {
        const newLine = `${prefix}${newVersion}`;
        return newLine.padEnd(match.length, ' ');
      });

      fs.writeFile(file, updatedData, 'utf8', err => {
        if (err) {
          console.error(`Error writing file ${file}:`, err);
        } else {
          console.log(`Successfully updated ${file}`);
        }
      });
    });
  });

  // Update version in the version file itself
  fs.writeFile(versionFile, newVersion, 'utf8', err => {
    if (err) {
      console.error(`Error writing file ${versionFile}:`, err);
    } else {
      console.log(`Successfully updated ${versionFile}`);
    }
  });
}

function incrementPatch(version) {
  const parts = version.split('.').map(Number);
  parts[2]++;
  return parts.join('.');
}
