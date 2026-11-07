const SIGNATURES = [
  {
    id: 'wearedevs',
    name: 'WeAreDevs / Prometheus-style',
    test: (code) => /return\s*\(\s*function\s*\(/.test(code) && /\blocal\s+[A-Za-z0-9_]+\s*=\s*\{"/.test(code)
  },
  {
    id: 'luraph',
    name: 'Luraph',
    test: (code) => /LPH_/i.test(code) || /luraph/i.test(code)
  },
  {
    id: 'moonsec',
    name: 'Moonsec',
    test: (code) => /moonsec/i.test(code) || /Moonsec/i.test(code)
  },
  {
    id: 'ironbrew',
    name: 'Ironbrew',
    test: (code) => /ironbrew/i.test(code) || /IronBrew/i.test(code)
  },
  {
    id: 'luaarmor',
    name: 'LuaArmor',
    test: (code) => /luaarmor/i.test(code) || /LuaArmor/i.test(code)
  }
];

function detect(code) {
  for (const sig of SIGNATURES) {
    try { if (sig.test(code)) return sig.id; } catch (_) {}
  }
  return 'unknown';
}

function detectName(id) {
  const sig = SIGNATURES.find(s => s.id === id);
  return sig ? sig.name : 'Unknown';
}

module.exports = { detect, detectName, SIGNATURES };