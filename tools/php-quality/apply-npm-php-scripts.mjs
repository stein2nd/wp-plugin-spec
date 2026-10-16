#!/usr/bin/env node
/**
 * Add lint:php / test:unit:php:local npm scripts (composer-backed) to package.json.
 * Usage: node apply-npm-php-scripts.mjs [--wpcs] /path/to/package.json
 */
import { readFileSync, writeFileSync } from 'fs';

const wpcs = process.argv.includes('--wpcs');
const paths = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const base = {
	'pretest:unit:php:local': 'composer install --no-interaction --prefer-dist',
	'test:unit:php:local': 'composer test',
	'pretest:lint:php': 'composer install --no-interaction --prefer-dist',
	'lint:php': 'composer lint:php',
	phpstan: 'composer phpstan',
	phpcs: 'composer phpcs',
};

if (wpcs) {
	base['phpcs:wpcs'] = 'composer phpcs:wpcs';
}

for (const file of paths) {
	const pkg = JSON.parse(readFileSync(file, 'utf8'));
	pkg.scripts = { ...pkg.scripts, ...base };
	writeFileSync(file, JSON.stringify(pkg, null, wpcs ? 4 : 4) + '\n');
	console.log('updated', file, wpcs ? '(wpcs)' : '');
}
