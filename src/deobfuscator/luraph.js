const fs = require('fs');
const path = require('path');
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const to_luastring = fengari.to_luastring;

const { parseTraceReport } = require('./traceToLua');

const MOCK_ENV_PATH = path.join(__dirname, 'mockEnv.lua');

/* ------------------------------------------------------------------ */
/* Tokenizer (string / long-string / comment / number aware)           */
/* ------------------------------------------------------------------ */

const KEYWORDS = new Set(['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'goto', 'if',
  'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while']);

const MERGE_OP_CHARS = '+-*/%<>~^.=:';

function tokenizeLua(code) {
  const tokens = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    // long comment
    if (ch === '-' && code[i + 1] === '-') {
      const lm = /^--\[(=*)\[/.exec(code.slice(i));
      if (lm) {
        const closer = ']' + lm[1] + ']';
        const ci = code.indexOf(closer, i + lm[0].length);
        const e = ci === -1 ? n : ci + closer.length;
        tokens.push({ type: 'other', start: i, end: e, text: code.slice(i, e) });
        i = e;
      } else {
        let j = i;
        while (j < n && code[j] !== '\n') j++;
        tokens.push({ type: 'other', start: i, end: j, text: '' });
        i = j;
      }
      continue;
    }
    // long string
    if (ch === '[') {
      const lm = /^\[(=*)\[/.exec(code.slice(i));
      if (lm) {
        const closer = ']' + lm[1] + ']';
        const ci = code.indexOf(closer, i + lm[0].length);
        const e = ci === -1 ? n : ci + closer.length;
        tokens.push({ type: 'string', start: i, end: e, text: code.slice(i, e) });
        i = e;
      } else {
        tokens.push({ type: 'op', start: i, end: i + 1, text: '[' });
        i++;
      }
      continue;
    }
    // short string
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === ch) { j++; break; }
        if (code[j] === '\n') break;
        j++;
      }
      tokens.push({ type: 'string', start: i, end: j, text: code.slice(i, j) });
      i = j;
      continue;
    }
    // identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const type = word === 'continue' ? 'continue' : (KEYWORDS.has(word) ? 'kw' : 'word');
      tokens.push({ type, start: i, end: j, text: word });
      i = j;
      continue;
    }
    // number (also .5 form)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i + 1]))) {
      let j = i;
      if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
        j += 2;
        while (j < n && /[0-9A-Fa-f_]/.test(code[j])) j++;
      } else if (code[j] === '0' && (code[j + 1] === 'b' || code[j + 1] === 'B')) {
        j += 2;
        while (j < n && /[01_]/.test(code[j])) j++;
      } else {
        while (j < n && /[0-9_]/.test(code[j])) j++;
        if (code[j] === '.') { j++; while (j < n && /[0-9_]/.test(code[j])) j++; }
        if (code[j] === 'e' || code[j] === 'E') {
          let k = j + 1;
          if (code[k] === '+' || code[k] === '-') k++;
          while (k < n && /[0-9_]/.test(code[k])) k++;
          if (/^e|E$|^[eE][0-9]/.test(code.slice(j, k)) || /[0-9]$/.test(code.slice(j, k).replace(/[eE+-]/g, ''))) j = k;
        }
      }
      tokens.push({ type: 'num', start: i, end: j, text: code.slice(i, j) });
      i = j;
      continue;
    }
    // operator runs
    if (MERGE_OP_CHARS.includes(ch)) {
      let j = i;
      while (j < n && MERGE_OP_CHARS.includes(code[j])) j++;
      tokens.push({ type: 'op', start: i, end: j, text: code.slice(i, j) });
      i = j;
      continue;
    }
    tokens.push({ type: 'op', start: i, end: i + 1, text: ch });
    i++;
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Luau -> Lua 5.3 transforms                                          */
/* ------------------------------------------------------------------ */

function convertNumeral(text) {
  if (/^0[xX][0-9A-Fa-f_]+$/.test(text)) {
    const v = parseInt(text.slice(2).replace(/_/g, ''), 16);
    return Number.isNaN(v) ? null : String(v);
  }
  if (/^0[bB][01_]+$/.test(text)) {
    const v = parseInt(text.slice(2).replace(/_/g, ''), 2);
    return Number.isNaN(v) ? null : String(v);
  }
  if (/_/.test(text) && /^\d[\d_.]*(?:[eE][+-]?\d+)?$/.test(text)) {
    return text.replace(/_/g, '');
  }
  return null;
}

function rewriteNumericLiterals(code) {
  const tokens = tokenizeLua(code);
  const edits = [];
  for (const tok of tokens) {
    if (tok.type !== 'num') continue;
    const text = code.slice(tok.start, tok.end);
    const out = convertNumeral(text);
    if (out !== null && out !== text) edits.push({ start: tok.start, end: tok.end, text: out });
  }
  if (!edits.length) return code;
  edits.sort((a, b) => b.start - a.start);
  let outc = code;
  for (const e of edits) outc = outc.slice(0, e.start) + e.text + outc.slice(e.end);
  return outc;
}

/**
 * Fix Luau string escapes that are invalid in Lua 5.3 (e.g. \d inside a
 * regex pattern string). Turns \d into \\d (literal backslash + d).
 */
function fixStringEscapes(code) {
  const tokens = tokenizeLua(code);
  const edits = [];
  for (const tok of tokens) {
    if (tok.type !== 'string' || code[tok.start] === '[') continue; // long strings rarely need it
    const text = code.slice(tok.start, tok.end);
    const quote = text[0];
    if (quote !== '"' && quote !== "'") continue;
    let newTxt = quote + quote === text ? text : '';
    if (newTxt === '') {
      // walk content
      let content = text.slice(1, -1);
      let changed = false;
      let fixed = '';
      for (let k = 0; k < content.length; k++) {
        const c = content[k];
        fixed += c;
        if (c !== '\\') continue;
        const nxt = content[k + 1];
        if (nxt === undefined) break;
        if ('abfnrtv\'"\\\nz'.includes(nxt) || nxt === '\n' || nxt === '\r') { fixed += nxt; k++; continue; }
        if ((nxt === 'x' || nxt === 'X') && /[0-9A-Fa-f]/.test(content[k + 2] || '')) { fixed += nxt; k++; continue; }
        if ((nxt === 'u' || nxt === 'U') && content[k + 2] === '{') { fixed += nxt; k++; continue; }
        if (/[0-9]/.test(nxt)) { fixed += nxt; k++; continue; } // decimal escape
        // invalid escape: add a second backslash
        fixed += '\\';
        fixed += nxt;
        k++;
        changed = true;
      }
      if (!changed) continue;
      newTxt = quote + fixed + quote;
    }
    edits.push({ start: tok.start, end: tok.end, text: newTxt });
  }
  if (!edits.length) return code;
  edits.sort((a, b) => b.start - a.start);
  let outc = code;
  for (const e of edits) outc = outc.slice(0, e.start) + e.text + outc.slice(e.end);
  return outc;
}

const COMPOUND_MAP = { '+=': '+', '-=': '-', '*=': '*', '/=': '/', '%=': '%', '..=': '..', '^=': '^', '//=': '//' };

/**
 * Rewrite Luau compound assignments using the token stream.
 * Handles i+=1, f[1]+=v, (t)[i]/=v, etc.
 */
function rewriteCompoundOps(code) {
  const tokens = tokenizeLua(code);
  const edits = [];

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok.type !== 'op') continue;
    const raw = code.slice(tok.start, tok.end);
    const sym = COMPOUND_MAP[raw];
    if (!sym || tok.end - tok.start !== raw.length) continue;

    // find LHS by walking backwards in the token stream
    let L = t - 1;
    let sq = 0, pa = 0, br = 0;
    let gotRoot = false;
    while (L >= 0) {
      const p = tokens[L];
      if (p.type === 'kw' || p.type === 'other') break;
      if (p.type === 'op') {
        const w = p.text;
        if (/^\s+$/.test(w)) { L--; continue; }
        if (w === ']' ) { sq++; L--; continue; }
        if (w === ')') { pa++; L--; continue; }
        if (w === '}') { br++; L--; continue; }
        if (w === '[') { if (sq > 0) { sq--; L--; continue; } break; }
        if (w === '(') { if (pa > 0) { pa--; L--; continue; } break; }
        if (w === '{') { if (br > 0) { br--; L--; continue; } break; }
        if (w === '.') { L--; continue; }
        break;
      }
      if (p.type === 'word' || p.type === 'num' || p.type === 'string') {
        if (sq > 0 || pa > 0 || br > 0) { L--; continue; }
        gotRoot = true;
        break;
      }
      L--;
    }
    if (!gotRoot || sq !== 0 || pa !== 0 || br !== 0) continue;

    // find RHS: forward in the token stream, tracking nesting depth
    let R = t + 1;
    sq = 0; pa = 0; br = 0;
    let rhsEndChar = tok.end;
    let done = false;
    let rhsStarted = false;
    while (R < tokens.length) {
      const p = tokens[R];
      if (p.type === 'other') { rhsEndChar = p.start; done = true; break; }
      if (p.type === 'string') { rhsStarted = true; R++; continue; }
      if (p.type === 'op') {
        const w = p.text;
        if (w === '(') { pa++; rhsStarted = true; R++; continue; }
        if (w === ')') { if (pa === 0 && sq === 0 && br === 0) { rhsEndChar = p.start; done = true; break; } pa--; R++; continue; }
        if (w === '[') { sq++; rhsStarted = true; R++; continue; }
        if (w === ']') { if (sq === 0 && pa === 0 && br === 0) { rhsEndChar = p.start; done = true; break; } sq--; R++; continue; }
        if (w === '{') { br++; rhsStarted = true; R++; continue; }
        if (w === '}') { if (br === 0 && pa === 0 && sq === 0) { rhsEndChar = p.start; done = true; break; } br--; R++; continue; }
        if (w === ';' && pa === 0 && sq === 0 && br === 0) { rhsEndChar = p.start; done = true; break; }
        if (w.length > 1 && /[;,),][[{]/.test(w) && pa === 0 && sq === 0 && br === 0) {
          if (rhsStarted) { rhsEndChar = p.start; done = true; break; }
          break;
        }
        rhsStarted = true;
        R++;
        continue;
      }
      if (p.type === 'kw' && pa === 0 && sq === 0 && br === 0) { rhsEndChar = p.start; done = true; break; }
      rhsStarted = true;
      R++;
    }
    if (!done && rhsStarted) { rhsEndChar = code.length; done = true; }
    if (!done) continue;

    const lhsSlice = code.slice(tokens[L].start, tok.start);
    const rhsSlice = code.slice(tok.end, rhsEndChar);
    const lhs = lhsSlice.replace(/\s+$/, '');
    const rhs = rhsSlice.replace(/^\s+|\s+$/g, '');
    if (!lhs || !rhs) continue;
    edits.push({ start: tokens[L].start, end: rhsEndChar, text: `${lhs} = ${lhs} ${sym} ${rhs}` });
  }

  if (!edits.length) return code;
  edits.sort((a, b) => b.start - a.start);
  let out = code;
  let lastStart = null;
  for (const e of edits) {
    if (lastStart !== null && e.end > lastStart) continue;
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    lastStart = e.start;
  }
  return out;
}

/**
 * Rewrite Luau `continue` statements into Lua 5.3 goto/label pairs.
 */
function rewriteContinues(code) {
  const tokens = tokenizeLua(code);
  const out = [];
  let pos = 0;
  const stack = [];
  let contId = 0;
  const emit = (s) => out.push(s);

  const loopIdx = () => {
    for (let s = stack.length - 1; s >= 0; s--) {
      const st = stack[s];
      if ((st.kind === 'while' || st.kind === 'for' || st.kind === 'repeat') && st.opened) return s;
    }
    return -1;
  };

  for (const tok of tokens) {
    if (tok.start > pos) emit(code.slice(pos, tok.start));
    pos = tok.end;

    if (tok.type === 'other' || tok.type === 'string' || tok.type === 'num' || tok.type === 'word') {
      emit(code.slice(tok.start, tok.end));
      continue;
    }
    if (tok.type === 'op') {
      emit(code.slice(tok.start, tok.end));
      continue;
    }
    if (tok.type === 'continue') {
      contId++;
      const label = `MDC_${contId}`;
      const s = loopIdx();
      if (s !== -1) {
        if (!stack[s].pendingContinues) stack[s].pendingContinues = [];
        stack[s].pendingContinues.push(`::${label}::`);
        emit(`goto ${label};`);
      } else {
        emit('do end');
      }
      continue;
    }
    const w = tok.text;
    if (w === 'while' || w === 'for') {
      stack.push({ kind: w, opened: false, pendingContinues: null });
      emit(w + ' ');
    } else if (w === 'repeat') {
      stack.push({ kind: 'repeat', opened: true, pendingContinues: null });
      emit(w + ' ');
    } else if (w === 'function' || w === 'if') {
      stack.push({ kind: w, opened: true, pendingContinues: null });
      emit(w + ' ');
    } else if (w === 'do') {
      let matched = false;
      for (let s = stack.length - 1; s >= 0; s--) {
        const st = stack[s];
        if (st.kind === 'for' || st.kind === 'while') {
          if (!st.opened) { st.opened = true; matched = true; }
          break;
        }
      }
      if (!matched) stack.push({ kind: 'do', opened: true, pendingContinues: null });
      emit('do ');
    } else if (w === 'until') {
      const top = stack[stack.length - 1];
      if (top && top.kind === 'repeat') {
        if (top.pendingContinues && top.pendingContinues.length) {
          emit(' ' + top.pendingContinues.join(' ') + ' ');
          top.pendingContinues = null;
        }
        stack.pop();
      }
      emit('until ');
    } else if (w === 'end') {
      const top = stack.pop();
      if (top && top.pendingContinues && top.pendingContinues.length) {
        emit(' ' + top.pendingContinues.join(' ') + ' ');
      }
      emit('end ');
    } else {
      emit(w + ' ');
    }
  }
  if (pos < code.length) emit(code.slice(pos));
  return out.join('');
}

/**
 * Preprocess a Luau/Luraph chunk so it parses under fengari (Lua 5.3).
 */
function preprocessLuau(code) {
  let out = fixStringEscapes(code);
  out = rewriteNumericLiterals(out);
  out = rewriteCompoundOps(out);
  out = rewriteContinues(out);
  // Luau generalized iteration on tables: `for ... in <id> do` -> `for ... in pairs(<id>) do`
  out = out.replace(/\bfor\s+([a-zA-Z0-9_,\s]+)\s+in\s+([a-zA-Z0-9_]+)\s+do\b/g, 'for $1 in pairs($2) do');
  return out;
}

/**
 * Luau-accurate bit32/bit libraries, implemented in JavaScript so results are
 * unsigned doubles in [0, 2^32) exactly like Luau. Fengari uses 32-bit Lua
 * integers and cannot do bitwise ops on values >= 2^31, so pure-Lua shims
 * break Luraph's constant arithmetic.
 */
function pushBitLibs(L) {
  const numOf = (Ls, k) => {
    const v = lua.lua_tonumberx(Ls, k, null);
    if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
    return v;
  };
  const normU = (v) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
    let t = Math.trunc(v) % 4294967296;
    if (t < 0) t += 4294967296;
    return t >>> 0;
  };
  const pushU = (Ls, r) => lua.lua_pushnumber(Ls, r >>> 0);
  const clampW = (w, def) => {
    let n = Math.trunc(typeof w === 'number' ? w : def);
    if (!Number.isFinite(n)) n = def;
    if (n < 1) n = 1; else if (n > 32) n = 32;
    return n;
  };

  const fold = (f, start) => function foldFn(Ls) {
    const n = lua.lua_gettop(Ls);
    let r = start >>> 0;
    for (let k = 1; k <= n; k++) r = f(r, normU(numOf(Ls, k)));
    pushU(Ls, r);
    return 1;
  };

  const disp = (v) => {
    let d = Math.trunc(typeof v === 'number' ? v : 0);
    d = d % 32;
    if (d < 0) d += 32;
    return d;
  };

  const bit32 = {
    band: fold((a, b) => a & b, 0xFFFFFFFF),
    bor: fold((a, b) => a | b, 0),
    bxor: fold((a, b) => a ^ b, 0),
    bnot: function (Ls) { pushU(Ls, ~normU(numOf(Ls, 1))); return 1; },
    lshift: function (Ls) {
      const x = normU(numOf(Ls, 1));
      const d = disp(numOf(Ls, 2));
      if (d === 0) { pushU(Ls, x); return 1; }
      pushU(Ls, x << d);
      return 1;
    },
    rshift: function (Ls) {
      const x = normU(numOf(Ls, 1));
      const d = disp(numOf(Ls, 2));
      if (d === 0) { pushU(Ls, x); return 1; }
      pushU(Ls, x >>> d);
      return 1;
    },
    arshift: function (Ls) {
      const x = normU(numOf(Ls, 1)) | 0;
      const d = disp(numOf(Ls, 2));
      lua.lua_pushnumber(Ls, x >> d); // sign-extending, may be negative like Luau
      return 1;
    },
    lrotate: function (Ls) {
      const x = normU(numOf(Ls, 1));
      const d = disp(numOf(Ls, 2));
      if (d === 0) { pushU(Ls, x); return 1; }
      pushU(Ls, ((x << d) | (x >>> (32 - d))) >>> 0);
      return 1;
    },
    rrotate: function (Ls) {
      const x = normU(numOf(Ls, 1));
      const d = disp(numOf(Ls, 2));
      if (d === 0) { pushU(Ls, x); return 1; }
      pushU(Ls, ((x >>> d) | (x << (32 - d))) >>> 0);
      return 1;
    },
    btest: function (Ls) {
      const n = lua.lua_gettop(Ls);
      let r = 0xFFFFFFFF;
      for (let k = 1; k <= n; k++) r &= normU(numOf(Ls, k));
      lua.lua_pushboolean(Ls, r !== 0);
      return 1;
    },
    tohex: function (Ls) {
      const x = normU(numOf(Ls, 1));
      let upper = false;
      let w = 8;
      if (lua.lua_gettop(Ls) >= 2) {
        const wv = numOf(Ls, 2);
        w = Math.trunc(typeof wv === 'number' ? wv : 8);
        upper = w < 0;
        if (!Number.isFinite(w)) w = 8;
        w = Math.abs(w);
        if (w < 1) w = 1; else if (w > 8) w = 8;
      }
      let s = x.toString(16);
      while (s.length < w) s = '0' + s;
      if (upper) s = s.toUpperCase();
      lua.lua_pushstring(Ls, to_luastring(s));
      return 1;
    },
    tobit: function (Ls) {
      lua.lua_pushnumber(Ls, normU(numOf(Ls, 1)) | 0);
      return 1;
    },
    countlz: function (Ls) {
      const x = normU(numOf(Ls, 1));
      const w = lua.lua_gettop(Ls) >= 2 ? clampW(numOf(Ls, 2), 32) : 32;
      let count = 0;
      for (let i = w - 1; i >= 0; i--) {
        if (((x >>> i) & 1) === 1) break;
        count++;
      }
      lua.lua_pushnumber(Ls, count);
      return 1;
    },
    countrz: function (Ls) {
      const x = normU(numOf(Ls, 1));
      const w = lua.lua_gettop(Ls) >= 2 ? clampW(numOf(Ls, 2), 32) : 32;
      let count = 0;
      for (let i = 0; i < w; i++) {
        if (((x >>> i) & 1) === 1) break;
        count++;
      }
      lua.lua_pushnumber(Ls, count);
      return 1;
    },
    byteswap: function (Ls) {
      const x = normU(numOf(Ls, 1));
      pushU(Ls, (((x & 0xFF) << 24) | (((x >>> 8) & 0xFF) << 16) | (((x >>> 16) & 0xFF) << 8) | ((x >>> 24) & 0xFF)));
      return 1;
    },
    extract: function (Ls) {
      const x = normU(numOf(Ls, 1));
      let f = Math.trunc(numOf(Ls, 2));
      if (!Number.isFinite(f)) f = 0;
      if (f < 0) f = 0; else if (f > 32) f = 32;
      const w = clampW(numOf(Ls, 3), 1);
      let ww = w;
      if (f + ww > 32) ww = 32 - f;
      const mask = (ww >= 32) ? 0xFFFFFFFF : ((1 << ww) - 1);
      pushU(Ls, (x >>> f) & mask);
      return 1;
    },
    replace: function (Ls) {
      let x = normU(numOf(Ls, 1));
      let f = Math.trunc(numOf(Ls, 2));
      if (!Number.isFinite(f)) f = 0;
      if (f < 0) f = 0; else if (f > 32) f = 32;
      const w = clampW(numOf(Ls, 3), 1);
      let ww = w;
      if (f + ww > 32) ww = 32 - f;
      const mask = (ww >= 32) ? 0xFFFFFFFF : ((1 << ww) - 1);
      const v = normU(numOf(Ls, 4));
      x = (x & ~(mask << f)) | ((v & mask) << f);
      pushU(Ls, x);
      return 1;
    }
  };

  const bit = {
    band: bit32.band, bor: bit32.bor, bxor: bit32.bxor, bnot: bit32.bnot,
    lshift: bit32.lshift, rshift: bit32.rshift, arshift: bit32.arshift,
    rol: bit32.lrotate, ror: bit32.rrotate,
    tobit: bit32.tobit, tohex: bit32.tohex, byteswap: bit32.byteswap,
    bswap: bit32.byteswap,
    btst: function (Ls) {
      bit32.band(Ls); // pushes band result on top; leftover args are discarded by the VM
      const r = lua.lua_tonumberx(Ls, -1, null);
      lua.lua_pop(Ls, 1);
      lua.lua_pushboolean(Ls, r !== 0);
      return 1;
    }
  };

  const setLib = (tbl, gname) => {
    lua.lua_createtable(L, 0, 24);
    for (const [name, fn] of Object.entries(tbl)) {
      lua.lua_pushjsfunction(L, fn);
      lua.lua_setfield(L, -2, to_luastring(name));
    }
    lua.lua_setglobal(L, to_luastring(gname));
  };
  setLib(bit32, '__MD_BIT32');
  setLib(bit, '__MD_BITXX');

  // Convert raw JS exceptions escaping a C-function call into proper Lua
  // errors, so xpcall handlers / debug.traceback see a real message.
  if (L.l_G && L.l_G.atnativeerror === undefined) {
    L.l_G.atnativeerror = function (Ls) {
      const e = lua.lua_touserdata(Ls, 1);
      const msg = e && e.message ? String(e.message) : String(e);
      lua.lua_pushstring(Ls, to_luastring('JS error: ' + msg));
      return 1;
    };
  }
}

/**
 * Run a Luau chunk (Luraph VM etc.) inside a mocked environment and collect
 * the trace produced by mockEnv.lua.
 *
 * The processed code is loaded as its own main chunk with `_ENV` swapped to
 * MockEnv via `load(src, name, mode, env)` — the main chunk is a vararg
 * function (required by Luraph VM code), and top-level statements stay legal.
 */
function runLuauTraced(code, opts = {}) {
  let processed;
  try {
    processed = preprocessLuau(code);
  } catch (e) {
    throw new Error(`Preprocess failed: ${e.message}`);
  }

  const mockEnv = fs.readFileSync(MOCK_ENV_PATH, 'utf8');
  const maxEvents = opts.maxEvents || 60000;

  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  pushBitLibs(L); // JS bit32/bit overrides (__MD_BIT32 / __MD_BITXX globals)
  const collected = [];
  let limitHit = false;

  const logFn = function (Ls) {
    const n = lua.lua_gettop(Ls);
    const args = [];
    for (let k = 1; k <= n; k++) {
      const v = lua.lua_tojsstring(Ls, k);
      args.push(v === null || v === undefined ? '' : String(v));
    }
    if (collected.length >= maxEvents) {
      limitHit = true;
      lua.lua_pushliteral(Ls, 'MD_TRACE_LIMIT');
      return lua.lua_error(Ls);
    }
    collected.push(args.join('\t'));
    return 0;
  };

  lua.lua_pushjsfunction(L, logFn);
  lua.lua_setglobal(L, to_luastring('print'));

  // 1) Boot the mock environment (exports __MD_MOCK_ENV = MockEnv)
  const boot = lauxlib.luaL_dostring(L, to_luastring(mockEnv + '\n__MD_MOCK_ENV = MockEnv\n__MD_REAL_UNPACK = real_unpack\n'));
  if (boot !== lua.LUA_OK) {
    const err = lua.lua_tojsstring(L, -1);
    lua.lua_close(L);
    throw new Error(`Mock env boot failed: ${err}`);
  }

  // 2) Hand the processed source to Lua and run it with _ENV = MockEnv
  lua.lua_pushstring(L, to_luastring(processed));
  lua.lua_setglobal(L, to_luastring('__MD_SRC'));

  const runner = [
    'local f, lerr = load(__MD_SRC, "luraph_chunk", "t", __MD_MOCK_ENV)',
    'if not f then error("load error: " .. tostring(lerr)) end',
    'local ins = 0',
    'local maxIns = 12000', // 12,000 * 100,000 = 1.2 billion instructions
    'debug.sethook(function()',
    '  ins = ins + 1',
    '  if ins > maxIns then',
    '    debug.sethook()',
    '    error("WATCHDOG: max instruction count reached (" .. tostring(ins * 100000) .. ")")',
    '  end',
    'end, "", 100000)',
    'local __MD_OK, __MD_ERR = xpcall(f, function(e)',
    '  debug.sethook()',
    '  local out = {"RUNNER_ERR: " .. tostring(e)}',
    '  local tb = table.concat(out, "\\n")',
    '  print(tb)',
    '  return tb',
    'end)',
    'debug.sethook()',
    'if not __MD_OK then error(__MD_ERR, 0) end'
  ].join('\n');

  const rt = lauxlib.luaL_dostring(L, to_luastring(runner));
  let runtimeErr = null;
  if (rt !== lua.LUA_OK) {
    runtimeErr = lua.lua_tojsstring(L, -1);
    lua.lua_pop(L, 1);
  }
  lua.lua_close(L);

  const RELEVANT_PREFIXES = [
    'ACCESSED', 'CALL_RESULT', 'URL DETECTED', 'SET GLOBAL', 'UNPACK CALLED',
    'CAPTURED CHUNK', 'CLOSURE', 'TRACE_PRINT', 'PROP_SET', 'LOADSTRING',
    'RUN_STATUS'
  ];
  const traceLines = collected.filter((l) => RELEVANT_PREFIXES.some((p) => l.includes(p)));

  return {
    traceLines,
    allLines: collected,
    limitHit,
    runtimeErr,
    raw: traceLines.length ? traceLines.join('\n') : collected.slice(0, 2000).join('\n')
  };
}

/**
 * Luraph deobfuscator: Luraph VMs are not statically devirtualizable,
 * so run the chunk in a traced sandbox and reconstruct readable Luau.
 */
function deobfuscateLuraph(code) {
  const result = runLuauTraced(code);

  const traceText = result.raw;
  const report = [
    '--- DEOBFUSCATION REPORT ---',
    'Engine: Luraph trace emulation',
    '',
    '--- TRACE ---',
    ...traceText.split('\n')
  ].join('\n');

  let reconstructed = '';
  try {
    reconstructed = parseTraceReport(report);
  } catch (_) {
    reconstructed = '';
  }

  if ((!reconstructed || reconstructed.trim().length === 0) && traceText.trim().length > 0) {
    reconstructed = [
      '-- MommyDeob Luraph trace reconstruction',
      '-- (readable actions recovered from execution trace)',
      '',
      ...traceText.split('\n')
    ].join('\n');
  }

  const notes = [];
  if (!result.runtimeErr) notes.push('Chunk executed fully.');
  else notes.push(`Chunk halted in sandbox: ${String(result.runtimeErr).slice(0, 200)}`);
  if (result.limitHit) notes.push('Trace event budget exhausted; output truncated.');

  return {
    type: 'luraph',
    code: reconstructed,
    report,
    traceLines: result.traceLines,
    allLines: result.allLines,
    notes: notes.join(' ')
  };
}

module.exports = {
  deobfuscateLuraph,
  runLuauTraced,
  preprocessLuau,
  pushBitLibs,
  tokenizeLua,
  fixStringEscapes,
  rewriteNumericLiterals,
  rewriteCompoundOps,
  rewriteContinues
};