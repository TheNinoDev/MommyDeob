# MommyDeob 🌸

A Discord bot for analyzing, dumping, and deobfuscating Roblox Luau scripts.  
Supports both `.` and `/` prefixes and uses modern **Discord v2 components** (containers & action rows).

---

## 📜 Commands

### 🔍 Deobfuscation & Analysis
- **`.deobf`** / **`.do`** / **`.deo`** / **`/deobfuscate`** — Interactive Deobfuscation panel with a dropdown select menu. Detects the obfuscator automatically and places the detected engine right at the top of the dropdown!
- **`.dump`** / **`.l`** / **`.log`** / **`/dump`** — Universal environment logger and constant dumper.
- **`.spy`** / **`/spy`** — HTTP & Network spy: sandbox execution that intercepts `HttpGet`, `HttpPost`, `request`, `WebSocket`, `FireServer`, extracting Discord webhooks, endpoints, and IPs.
- **`.detect`** / **`.d`** / **`.dtc`** / **`/detect`** — Identifies which obfuscator a script is using (WeAreDevs/Prometheus, Luraph, MoonSec, IronBrew, PSU, LuaArmor, 77fuscator, Goofyscator).

### 🧰 Tools
- **`.get <URL>`** / **`.g`** — Automatically fetches raw code from GitHub, Pastebin, Pastefy, Rentry, etc.
- **`.rename`** / **`.rn`** / **`.r`** — Renames unreadable barcode/hex identifiers (`lIllI1`, `_0x1a4f`) into clean sequential names (`var_1`, `var_2`).
- **`.beautify`** / **`.b`** / **`.btf`** — Indents and cleans up compressed or messy Luau code.
- **`.minify`** — Removes comments and strips unneeded whitespace.
- **`.paste`** / **`.p`** — Uploads a script to Pastefy / Hastebin and provides a shareable URL.
- **`.supported`** — Displays a table of all supported obfuscators and tools.

### 💎 7-Day Key System (PWF Auth)
- **`.getkey`** / **`.key`** — Generates a Linkvertise link for a free 7-day license key.
- **`.redeem <KEY>`** — Activates your key with PWF Auth.
- **`.status`** — Checks how many days remain on your active key.

---

## 🛡️ Supported Obfuscators

| Obfuscator | Status | Method |
|---|---|---|
| **WeAreDevs / Prometheus** | ✅ Full Support | Trace Emulation & AST Reconstruction |
| **Universal Dumper (.l)** | ✅ Full Support | Fengari sandbox & constant table dumper |
| **HTTP Spy (.spy)** | ✅ Full Support | Webhook, URL, and remote call extraction |
| **Luraph (V14/V15)** | 🔄 Detect & Dump | Engine detection + trace recovery |
| **MoonSec (V2/V3)** | 🔄 Detect & Dump | Engine detection + trace recovery |
| **IronBrew2 / Ironveil** | 🔄 Detect & Dump | Engine detection + trace recovery |
| **PSU Obfuscator** | 🔄 Detect & Dump | Engine detection + trace recovery |
| **LuaArmor** | 🔄 Detect & Dump | Engine detection + trace recovery |
| **77fuscator / Goofyscator** | 🔄 Detect & Dump | Engine detection + trace recovery |

---

## 🚀 Setup & Hosting

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your `DISCORD_TOKEN`, `CLIENT_ID`, and optional `GUILD_ID`.
3. Start the bot:
   ```bash
   npm start
   ```
   Or in development with auto-reload:
   ```bash
   npm run dev
   ```
