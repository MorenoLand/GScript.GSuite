const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const releaseType = (process.argv[2] || 'patch').toLowerCase();
const versionPattern = /^\d+\.\d+\.\d+$/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`);
}

function bumpVersion(version) {
  if (!versionPattern.test(version)) throw new Error(`Unsupported version format: ${version}`);
  const parts = version.split('.').map(Number);
  if (releaseType === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (releaseType === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else if (releaseType === 'patch') {
    parts[2] += 1;
  } else {
    throw new Error(`Unsupported release type: ${releaseType}`);
  }
  return parts.join('.');
}

function updateCargoToml(version) {
  const file = path.join(root, 'src-tauri', 'Cargo.toml');
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`));
}

function updateCargoLock(version) {
  const file = path.join(root, 'src-tauri', 'Cargo.lock');
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.replace(/(\[\[package\]\]\r?\nname = "GSuite"\r?\nversion = ")[^"]+(")/, `$1${version}$2`));
}

function updateTauriConfig(version) {
  const config = readJson('src-tauri/tauri.conf.json');
  config.version = version;
  writeJson('src-tauri/tauri.conf.json', config);
}

function updateChangelog(oldVersion, nextVersion) {
  const changelog = readJson('changelog.json');
  if (Array.isArray(changelog) && changelog[0]?.version === oldVersion) {
    changelog[0].version = nextVersion;
    changelog[0].date = new Date().toISOString().slice(0, 10);
    writeJson('changelog.json', changelog);
  }
}

const pkg = readJson('package.json');
const oldVersion = pkg.version;
const nextVersion = releaseType === 'set'
  ? (process.argv[3] || '').replace(/^v/i, '')
  : bumpVersion(pkg.version);
if (!versionPattern.test(nextVersion)) throw new Error(`Unsupported version format: ${nextVersion}`);
pkg.version = nextVersion;
writeJson('package.json', pkg);

updateCargoToml(nextVersion);
updateCargoLock(nextVersion);
updateTauriConfig(nextVersion);
updateChangelog(oldVersion, nextVersion);

console.log(nextVersion);
