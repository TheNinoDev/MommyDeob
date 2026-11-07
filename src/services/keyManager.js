const fs = require('fs');
const path = require('path');
const { PwfAuth } = require('./pwfauth');
const { verifyLinkvertiseHash, getLinkvertiseUrl } = require('./linkvertise');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');

class KeyManager {
  constructor() {
    this.auth = new PwfAuth(process.env.PWFAUTH_APP_SECRET || 'dd4192f6404e531b9fb644e2c840b31a5f9d67e452317c9706817f62e6588c2f');
    this.users = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        this.users = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      } else {
        this.save();
      }
    } catch (e) {
      console.error('[KeyManager] Failed to load users database:', e);
      this.users = {};
    }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (e) {
      console.error('[KeyManager] Failed to save users database:', e);
    }
  }

  getKeyUrl(userId) {
    if (process.env.KEY_GENERATOR_URL) {
      return `${process.env.KEY_GENERATOR_URL}?user=${userId}`;
    }
    return getLinkvertiseUrl(userId);
  }

  hasAccess(userId) {
    const ownerId = process.env.OWNER_ID;
    if (ownerId && String(userId) === String(ownerId)) return true;

    const record = this.users[String(userId)];
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      return false;
    }
    return true;
  }

  getUserStatus(userId) {
    const record = this.users[String(userId)];
    if (!record) return { active: false };

    const remainingMs = record.expiresAt - Date.now();
    if (remainingMs <= 0) {
      return { active: false, expired: true, key: record.key };
    }

    const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    return {
      active: true,
      key: record.key,
      expiresAt: new Date(record.expiresAt).toUTCString(),
      daysRemaining
    };
  }

  async redeemKey(userId, inputToken) {
    const clean = inputToken.trim();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // 1. Try Linkvertise Anti-Bypass verification first
    const linkvertiseResult = await verifyLinkvertiseHash(clean);
    if (linkvertiseResult.valid) {
      const expiresAt = now + SEVEN_DAYS_MS;
      this.users[String(userId)] = {
        key: clean,
        type: 'linkvertise_hash',
        hwid: `discord_${userId}`,
        redeemedAt: now,
        expiresAt
      };
      this.save();
      return {
        success: true,
        method: 'Linkvertise Anti-Bypass',
        message: 'Linkvertise completion confirmed. Granted 7 days of mommy access.',
        daysRemaining: 7,
        expiresAt: new Date(expiresAt).toUTCString()
      };
    }

    // 2. Fall back to PWFAuth license key check & login
    const hwid = `discord_${userId}`;
    try {
      const res = await this.auth.login(clean, hwid);
      if (res && res.success) {
        let expiresAt;
        if (res.user && res.user.expires_at) {
          expiresAt = new Date(res.user.expires_at).getTime();
        } else {
          expiresAt = now + SEVEN_DAYS_MS;
        }

        this.users[String(userId)] = {
          key: clean,
          type: 'pwfauth_license',
          hwid,
          sessionId: res.session_id,
          redeemedAt: now,
          expiresAt
        };
        this.save();

        const daysRemaining = Math.max(1, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
        return {
          success: true,
          method: 'PWFAuth License',
          message: 'PWFAuth license verified. Granted 7 days of mommy access.',
          daysRemaining,
          expiresAt: new Date(expiresAt).toUTCString()
        };
      }
    } catch (_) {}

    throw new Error('Pathetic. That key or hash is invalid or bypassed. Complete the linkvertise properly without cheat extensions, baka.');
  }
}

const keyManager = new KeyManager();
module.exports = { keyManager, KeyManager };