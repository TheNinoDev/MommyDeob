# MommyDeob

A Discord bot (JavaScript) that deobfuscates Roblox Luau scripts.  
Commands work with both `.` and `/` prefixes. Replies use **Discord v2 components** (containers).

## Supported obfuscators

| Obfuscator | Status |
|---|---|
| WeAreDevs / Prometheus-style (trace-based) | ✅ Supported |
| Luraph | ❌ Detected only |
| Moonsec | ❌ Detected only |
| Ironbrew | ❌ Detected only |
| LuaArmor | ❌ Detected only |

## Setup

```bash
npm install
cp .env.example .env
# fill DISCORD_TOKEN, CLIENT_ID, optional GUILD_ID
npm start
```

## Usage

- `.deobfuscate` / `/deobfuscate` with a `.lua`/`.txt` attachment or a code block.
- `.detect` / `/detect` to identify the obfuscator.
- `.help`, `.ping`.

## How deobfuscation works

WeAreDevs-style scripts are VM-based: the original code is hidden behind a string table and a bytecode interpreter. This project runs the script inside a **mock Luau environment** (via `fengari`) that logs every access, call, property set, print and `loadstring`, then reconstructs readable Luau from that trace. This is the same approach as the Python "Prometheus-WeAreDevs-Dumper".

## Adding a new obfuscator

1. Add a signature to `src/deobfuscator/detect.js`.
2. Implement a deobfuscator module in `src/deobfuscator/` and wire it in `src/deobfuscator/index.js`.
3. Add it to the supported table above.

## On auto-detection / auto-deobfuscation

Detecting the obfuscator from a sample is **easy** (signature matching on keywords/structure).  
Building a deobfuscator for an *unknown* obfuscator automatically is **hard**: each obfuscator uses a different VM, string encoding and control-flow scheme. A fully automatic approach would need a generic Lua trace engine plus heuristics, which is feasible for "access/call logging" but not for perfect reconstruction. Realistically you detect by signature, then write a targeted deobfuscator per family.