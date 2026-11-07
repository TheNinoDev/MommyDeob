const SIGNATURES = [
  {
    id: 'wearedevs',
    name: 'WeAreDevs / Prometheus-style',
    desc: 'VM based with string table and bytecode emulator',
    test: (code) => /return\s*\(\s*function\s*\(/.test(code) && (/\blocal\s+[A-Za-z0-9_]+\s*=\s*\{["']/.test(code) || /getfenv\s+and\s+getfenv/.test(code))
  },
  {
    id: 'luraph',
    name: 'Luraph (V14 / V15)',
    desc: 'Luraph VM with anti-tamper and bitwise virtualization',
    test: (code) => /LPH_/i.test(code) || /Luraph/i.test(code) || /LPH@/i.test(code) || /LPH\]/i.test(code)
  },
  {
    id: 'moonsec',
    name: 'MoonSec (V2 / V3)',
    desc: 'MoonSec bytecode virtual machine',
    test: (code) => /moonsec/i.test(code) || /MoonSec/i.test(code) || /MS3_/i.test(code) || /MS2_/i.test(code)
  },
  {
    id: 'ironbrew',
    name: 'IronBrew2',
    desc: 'IronBrew2 stack-based Lua VM',
    test: (code) => /ironbrew/i.test(code) || /IronBrew/i.test(code) || /IB2/i.test(code) || /Ironveil/i.test(code)
  },
  {
    id: 'psu',
    name: 'PSU Obfuscator',
    desc: 'PSU Obfuscator 4.x / 5.x',
    test: (code) => /PSU\s*Obfuscator/i.test(code) || /PSU/i.test(code)
  },
  {
    id: 'luaarmor',
    name: 'LuaArmor',
    desc: 'LuaArmor protection system',
    test: (code) => /luaarmor/i.test(code) || /LuaArmor/i.test(code)
  },
  {
    id: '77fuscator',
    name: '77fuscator',
    desc: '77fuscator Lua scrambler',
    test: (code) => /77fuscator/i.test(code) || /_77/i.test(code)
  },
  {
    id: 'goofy',
    name: 'Goofyscator',
    desc: 'Goofyscator V10+ Lua obfuscator',
    test: (code) => /goofy/i.test(code) || /goofyscator/i.test(code)
  }
];

function detect(code) {
  for (const sig of SIGNATURES) {
    try {
      if (sig.test(code)) return sig.id;
    } catch (_) {}
  }
  return 'unknown';
}

function detectName(id) {
  const sig = SIGNATURES.find(s => s.id === id);
  return sig ? sig.name : 'Unknown Obfuscator';
}

function getAllEngines() {
  return SIGNATURES.map(s => ({ id: s.id, name: s.name, desc: s.desc }));
}

module.exports = { detect, detectName, getAllEngines, SIGNATURES };