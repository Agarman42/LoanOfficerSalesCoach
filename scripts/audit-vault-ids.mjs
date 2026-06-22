#!/usr/bin/env node
/**
 * Audits showVaultItemModal('id') references in index.html against id: fields
 * in VALUE_VAULT_ITEMS (including POPBY_LIBRARY_ITEMS spread).
 */
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

const modalIds = [...indexHtml.matchAll(/showVaultItemModal\('([^']+)'\)/g)].map((m) => m[1]);
const uniqueModalIds = [...new Set(modalIds)];

const itemIdMatches = [...indexHtml.matchAll(/^\s*id:\s*'([^']+)'/gm)].map((m) => m[1]);
const definedIds = new Set(itemIdMatches);

// Also load popby-library + lo-fact-vault ids
for (const dataFile of ['js/data/popby-library.js', 'js/data/lo-fact-vault.js']) {
  const src = readFileSync(join(root, dataFile), 'utf8');
  [...src.matchAll(/id:\s*'([^']+)'/g)].forEach((m) => definedIds.add(m[1]));
  [...src.matchAll(/fact\('([^']+)'/g)].forEach((m) => definedIds.add(m[1]));
}

const missing = uniqueModalIds.filter((id) => !definedIds.has(id));
const orphanPopbys = [...definedIds].filter((id) => id.startsWith('popby-') && !uniqueModalIds.includes(id) && !indexHtml.includes(`'${id}'`));

console.log('Vault card references:', uniqueModalIds.length);
console.log('Defined item ids (index + popby):', definedIds.size);
console.log('Pop-by items in library:', [...definedIds].filter((id) => id.startsWith('popby-')).length);

if (missing.length) {
  console.log('\nMISSING (cards with no VALUE_VAULT_ITEMS entry):');
  missing.forEach((id) => console.log('  -', id));
  process.exit(1);
}

console.log('\nAll vault card IDs resolve to content.');
if (orphanPopbys.length > 10) {
  console.log(`\nNote: ${orphanPopbys.length} pop-by ids exist only in the searchable grid (not as static cards) — expected.`);
}