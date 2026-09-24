import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const EMPTY = { organizations: [], members: [], projects: [], tasks: [], comments: [], files: [], notifications: [], notificationPreferences: [] };

export class JsonStore {
  constructor(path) { this.path = path; this.queue = Promise.resolve(); }
  async read() {
    try { return { ...EMPTY, ...JSON.parse(await readFile(this.path, 'utf8')) }; }
    catch (error) { if (error.code === 'ENOENT') return structuredClone(EMPTY); throw error; }
  }
  async write(data) {
    await mkdir(dirname(this.path), { recursive: true });
    this.queue = this.queue.then(() => writeFile(this.path, JSON.stringify(data, null, 2)));
    await this.queue;
    return data;
  }
  async update(mutator) { const data = await this.read(); const result = await mutator(data); await this.write(data); return result; }
}
