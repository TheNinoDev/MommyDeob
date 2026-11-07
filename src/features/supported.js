const SUPPORTED_LIST = [
  { name: 'WeAreDevs / Prometheus', status: 'FULL DEOBFUSCATION', desc: 'Trace emulation, bytecode recovery, AST reconstruction. Ripped to pieces.' },
  { name: 'Environment Dumper (.l)', status: 'UNIVERSAL DUMP', desc: 'Hooks sandbox to dump all strings, globals, calls, and metamethods.' },
  { name: 'HTTP / Network Spy (.spy)', status: 'FULL EXTRACTION', desc: 'Exposes Discord webhooks, endpoints, sockets, and remote calls.' },
  { name: 'Luraph (V14/V15)', status: 'DETECTION & DUMP', desc: 'Anti-tamper bypassed, string table and runtime trace extracted.' },
  { name: 'MoonSec (V2/V3)', status: 'DETECTION & DUMP', desc: 'Stack VM logged and constants dumped.' },
  { name: 'IronBrew2 / Ironveil', status: 'DETECTION & DUMP', desc: 'Opcode trace captured and constants recovered.' },
  { name: 'PSU Obfuscator', status: 'DETECTION & DUMP', desc: 'Header signature detected and execution flow traced.' },
  { name: 'LuaArmor', status: 'DETECTION & DUMP', desc: 'Protection analyzed and memory hooked.' },
  { name: '77fuscator / Goofy', status: 'DETECTION & DUMP', desc: 'Basic scrambler patterns recognized and logged.' }
];

function getSupportedSummary() {
  return SUPPORTED_LIST.map(item => `[ ${item.status} ] **${item.name}**\n*${item.desc}*`).join('\n\n');
}

module.exports = { SUPPORTED_LIST, getSupportedSummary };