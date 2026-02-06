const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const dir = __dirname;
const outputDir = path.join(dir, 'obfuscated');
const ignoreFiles = ['obf.js', 'index.js'];
const translationsFile = 'translations.js';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

let translationsContent = '';
let hasTranslations = false;

const files = fs.readdirSync(dir)
  .filter(file => file.endsWith('.js') && !ignoreFiles.includes(file))
  .sort((a, b) => a === translationsFile ? -1 : b === translationsFile ? 1 : 0);

files.forEach(file => {
  if (file !== translationsFile) return;

  const filePath = path.join(dir, file);
  translationsContent = fs.readFileSync(filePath, 'utf8');
  hasTranslations = true;

  let cleanContent = translationsContent;

  if (cleanContent.includes('export default') || cleanContent.includes('module.exports')) {
    cleanContent = cleanContent.replace(/export\s+default\s+/, '');
    cleanContent = cleanContent.replace(/module\.exports\s*=\s*/, '');
    cleanContent = cleanContent.trim().replace(/;$/, ''); // убираем ;
  }

  cleanContent = cleanContent.replace(/export\s+(const|let|var)\s+\w+\s*=\s*/, '');
  cleanContent = cleanContent.replace(/export\s*\{[^}]*\}/, '');

  const globalWrapper = `
    (function() {
      const translations = ${cleanContent.includes('{') ? cleanContent : '{' + cleanContent + '}'};
      window.translations = translations;
    })();
  `;

  const shortName = 'tr.js';
  const outputPath = path.join(outputDir, shortName);
  fs.writeFileSync(outputPath, globalWrapper, 'utf8');
  console.log(`${file} → ${shortName} (экспорт → window.translations) ✅`);
});

if (!hasTranslations) {
  console.log('❌ translations.js НЕ НАЙДЕН — пиздец неизбежен!');
  process.exit(1);
}

files.forEach(file => {
  if (file === translationsFile) return;

  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content
    .split('\n')
    .filter(line => !line.trim().startsWith('import ') && !line.trim().startsWith('export '))
    .join('\n');

  const obfuscationResult = JavaScriptObfuscator.obfuscate(content, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,
    deadCodeInjectionThreshold: 0.8,
    // debugProtection: true,
    // debugProtectionInterval: 2000,
    // disableConsoleOutput: true,
    identifierNamesGenerator: 'mangled',
    numbersToExpressions: true,
    renameGlobals: false,
    reservedNames: ['translations'],
    // selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 1,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 5,
    transformObjectKeys: true,
    unicodeEscapeSequence: true
  });

  const obfuscatedCode = obfuscationResult.getObfuscatedCode();
  const shortName = file.slice(0, 2) + '.js';
  const outputPath = path.join(outputDir, shortName);

  fs.writeFileSync(outputPath, obfuscatedCode, 'utf8');
});

console.log('obfuscated')