const fs = require('fs');
const path = require('path');
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const to_luastring = fengari.to_luastring;

const { normalizeLuau } = require('./normalize');

const MOCK_ENV_PATH = path.join(__dirname, 'mockEnv.lua');

function runLua(code) {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const collected = [];

  const logFn = function (Lstate) {
    const n = lua.lua_gettop(Lstate);
    const args = [];
    for (let i = 1; i <= n; i++) {
      const v = lua.lua_tojsstring(Lstate, i);
      args.push(v === null || v === undefined ? '' : String(v));
    }
    collected.push(args.join('\t'));
    return 0;
  };

  lua.lua_pushjsfunction(L, logFn);
  lua.lua_setglobal(L, to_luastring('_JSLOG'));
  lua.lua_pushjsfunction(L, logFn);
  lua.lua_setglobal(L, to_luastring('print'));

  const status = lauxlib.luaL_dostring(L, to_luastring(code));
  if (status !== lua.LUA_OK) {
    const err = lua.lua_tojsstring(L, -1);
    lua.lua_pop(L, 1);
    throw new Error(String(err || 'Lua execution failed'));
  }
  lua.lua_close(L);
  return collected;
}

function findInjectionPoints(content) {
  let idxArgs = content.lastIndexOf('(getfenv');
  const alt = content.lastIndexOf('( getfenv');
  if (alt > idxArgs) idxArgs = alt;
  if (idxArgs === -1) idxArgs = content.length;
  let idxRet = content.lastIndexOf('return(function', idxArgs);
  if (idxRet === -1) idxRet = content.lastIndexOf('return (function', idxArgs);
  if (idxRet === -1) idxRet = content.length;
  return { idxArgs, idxRet };
}

function deobfuscateWeAreDevs(code) {
  const content = normalizeLuau(code);

  const varMatch = content.match(/\blocal\s+([A-Za-z0-9_]+)\s*=\s*\{/);
  if (!varMatch) throw new Error('Could not identify string table variable.');
  const varName = varMatch[1];

  const { idxRet } = findInjectionPoints(content);

  const mockEnv = fs.readFileSync(MOCK_ENV_PATH, 'utf8');

  const dumperCode = `
    real_print("--- CONSTANTS START ---")
    if ${varName} then
        local sorted_keys = {}
        for k in pairs(${varName}) do table.insert(sorted_keys, k) end
        table.sort(sorted_keys)
        local out = "local Constants = {"
        for i, k in ipairs(sorted_keys) do
            local v = ${varName}[k]
            local v_str = escape_lua_string(v)
            out = out .. " [" .. k .. "] = " .. v_str .. ","
        end
        out = out .. " }"
        real_print(out)
    end
    real_print("--- CONSTANTS END ---")
`;

  let newContent = mockEnv + '\n' + content.slice(0, idxRet) + '\n' + dumperCode + '\n' + content.slice(idxRet);
  newContent = newContent.replace(/getfenv\s+and\s+getfenv\(\)\s*or\s+_ENV/g, 'MockEnv');

  const collected = runLua(newContent);

  const stdoutLines = collected.map((s) => String(s).trim());
  const RELEVANT_PREFIXES = [
    'ACCESSED', 'CALL_RESULT', 'local Constants =',
    'URL DETECTED', 'SET GLOBAL', 'UNPACK CALLED',
    'CAPTURED CHUNK', 'CLOSURE', 'TRACE_PRINT',
    'PROP_SET', 'LOADSTRING'
  ];

  let constantsStr = '';
  const traceLines = [];
  let inConstants = false;
  for (const line of stdoutLines) {
    if (line === '--- CONSTANTS START ---') { inConstants = true; continue; }
    if (line === '--- CONSTANTS END ---') { inConstants = false; continue; }
    if (inConstants) { constantsStr += line + '\n'; continue; }
    if (RELEVANT_PREFIXES.some((p) => line.includes(p))) traceLines.push(line);
  }

  const report = [
    '--- DEOBFUSCATION REPORT ---',
    `File: inline`,
    '',
    '--- TRACE ---',
    ...traceLines,
    '',
    '--- CONSTANTS ---',
    constantsStr.trim()
  ].join('\n');

  const { parseTraceReport } = require('./traceToLua');
  const deobf = parseTraceReport(report);

  return {
    type: 'wearedevs',
    code: deobf,
    report,
    traceLines,
    constants: constantsStr.trim()
  };
}

module.exports = { deobfuscateWeAreDevs, runLua };