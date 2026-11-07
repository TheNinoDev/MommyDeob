const { detect, detectName } = require('./detect');
const { deobfuscateWeAreDevs } = require('./wearedevs');
const { deobfuscateLuraph } = require('./luraph');

async function deobfuscate(code) {
  const type = detect(code);
  if (type === 'wearedevs') return deobfuscateWeAreDevs(code);
  if (type === 'luraph') return deobfuscateLuraph(code);
  throw new Error(`Unsupported obfuscator: ${detectName(type)} (${type}). Fully supported: WeAreDevs/Prometheus, Luraph (trace recovery).`);
}

module.exports = { deobfuscate, detect, detectName };
