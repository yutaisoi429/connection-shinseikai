import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(scryptCallback);
export const tokenHash=token=>createHash('sha256').update(token).digest('hex');
export async function hashPassword(password){if(typeof password!=='string'||password.length<8)throw Object.assign(new Error('パスワードは8文字以上で入力してください'),{status:422});const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64);return `scrypt$${salt}$${Buffer.from(key).toString('hex')}`;}
export async function verifyPassword(password,encoded){try{const [,salt,hex]=encoded.split('$');const key=await scrypt(password,salt,64);return timingSafeEqual(Buffer.from(hex,'hex'),Buffer.from(key));}catch{return false;}}
export const createToken=()=>randomBytes(32).toString('base64url');
export function bearer(req){const value=req.headers.authorization||'';return value.startsWith('Bearer ')?value.slice(7):null;}
export function publicMember(member){const {passwordHash,...safe}=member;return safe;}
