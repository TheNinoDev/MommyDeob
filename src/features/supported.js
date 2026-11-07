const SUPPORTED_LIST = [
  { name: 'WeAreDevs / Prometheus', status: '✅ Full Deobfuscation', desc: 'Trace emulation, string recovery, AST reconstruction' },
  { name: 'Environment Dumper (.l)', status: '✅ Universal Supported', desc: 'Dumps constants, global accesses, method calls from any Lua VM' },
  { name: 'HTTP / Network Spy (.spy)', status: '✅ Universal Supported', desc: 'Extracts Webhooks, HttpGet/Post, WebSockets, Remotes, IPs' },
  { name: 'Luraph (V14/V15)', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' },
  { name: 'MoonSec (V2/V3)', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' },
  { name: 'IronBrew2', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' },
  { name: 'PSU Obfuscator', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' },
  { name: 'LuaArmor', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' },
  { name: '77fuscator', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' },
  { name: 'Goofyscator', status: '🔄 Detection & Dump Only', desc: 'Deobfuscation planned in future update' }
];

function getSupportedSummary() {
  return SUPPORTED_LIST.map(item => `• **${item.name}** — ${item.status}\n  *${item.desc}*`).join('\n\n');
}

module.exports = { SUPPORTED_LIST, getSupportedSummary };