const crypto = require('crypto');

class PwfAuth {
  constructor(appSecret) {
    this.secret = appSecret;
    this.encKey = crypto.createHash('sha256').update('enc:' + appSecret).digest();
    this.macKey = crypto.createHash('sha256').update('mac:' + appSecret).digest();
    this.baseUrl = 'https://pwfauth.com/api';
  }

  seal(data) {
    const iv = crypto.randomBytes(16);
    const jsonStr = JSON.stringify(data);

    const cipher = crypto.createCipheriv('aes-256-cbc', this.encKey, iv);
    const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);

    const p = Buffer.concat([iv, encrypted]).toString('base64');
    const t = Math.floor(Date.now() / 1000);
    const s = crypto.createHmac('sha256', this.macKey).update(p + String(t)).digest('hex');

    return { p, t, s };
  }

  openReply(envelope) {
    if (!envelope || !envelope.p || !envelope.s || envelope.t === undefined) {
      return envelope;
    }
    const expect = crypto.createHmac('sha256', this.macKey).update(envelope.p + String(envelope.t)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expect, 'hex'), Buffer.from(envelope.s, 'hex'))) {
      throw new Error('PWFAuth signature mismatch on reply');
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - envelope.t) > 300) {
      throw new Error('PWFAuth reply timestamp skewed (>300s)');
    }

    const blob = Buffer.from(envelope.p, 'base64');
    const iv = blob.subarray(0, 16);
    const ciphertext = blob.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encKey, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  async checkKey(licenseKey) {
    const payload = this.seal({ license_key: licenseKey });
    const res = await fetch(`${this.baseUrl}/auth/check-key.php`, {
      method: 'POST',
      headers: {
        'X-App-Secret': this.secret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json.p ? this.openReply(json) : json;
  }

  async login(licenseKey, hwid) {
    const payload = this.seal({ license_key: licenseKey, hwid });
    const res = await fetch(`${this.baseUrl}/auth/login.php`, {
      method: 'POST',
      headers: {
        'X-App-Secret': this.secret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json.p ? this.openReply(json) : json;
  }
}

module.exports = { PwfAuth };