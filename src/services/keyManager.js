const fs = require('fs');
const path = require('path');
const { PwfAuth } = require('./pwfauth');

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
      console.error('Failed to load users database:', e);
      this.users = {};
    }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save users database:', e);
    }
  }

  getKeyUrl(userId) {
    if (process.env.KEY_GENERATOR_URL) {
      return `${process.env.KEY_GENERATOR_URL}?user=${userId}`;
    }
    const pubId = process.env.LINKVERTISE_USER_ID || '10452071';
    return `https://linkvertise.com/${pubId}/mommydeob-7day-key`;
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

  async redeemKey(userId, licenseKey) {
    const hwid = `discord_${userId}`;
    const res = await this.auth.login(licenseKey.trim(), hwid);

    if (!res || !res.success) {
      const msg = (res && res.message) || 'Invalid or expired key.';
      throw new Error(msg);
    }

    let expiresAt;
    if (res.user && res.user.expires_at) {
      expiresAt = new Date(res.user.expires_at).getTime();
    } else {
      expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    this.users[String(userId)] = {
      key: licenseKey.trim(),
      hwid,
      sessionId: res.session_id,
      redeemedAt: Date.now(),
      expiresAt
    };
    this.save();

    const daysRemaining = Math.max(1, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
    return {
      success: true,
      message: res.message || 'Key activated successfully!',
      daysRemaining,
      expiresAt: new Date(expiresAt).toUTCString()
    };
  }
}

const keyManager = new KeyManager();
module.exports = { keyManager, KeyManager };