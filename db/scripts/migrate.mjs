/* Aplica las migraciones pendientes en orden. Idempotente. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { query, exec } from '../../lib/db.js';

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'migrations');

await query(`create table if not exists schema_migrations (
  name text primary key, applied_at timestamptz not null default now())`);

const applied = new Set((await query('select name from schema_migrations')).rows.map((r) => r.name));
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  process.stdout.write(`aplicando ${file} ... `);
  await exec(readFileSync(path.join(DIR, file), 'utf8'));
  await query('insert into schema_migrations (name) values ($1)', [file]);
  console.log('listo');
  count += 1;
}
console.log(count ? `${count} migración(es) aplicada(s).` : 'Sin migraciones pendientes.');
