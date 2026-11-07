const { detect, detectName } = require('./detect');
const { deobfuscateWeAreDevs } = require('./wearedevs');

async function deobfuscate(code) {
  const type = detect(code);
  if (type === 'wearedevs') return deobfuscateWeAreDevs(code);
  throw new Error(`Unsupported obfuscator: ${detectName(type)} (${type}). Only WeAreDevs/Prometheus-style is supported right now.`);
}

module.exports = { deobfuscate, detect, detectName };