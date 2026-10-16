#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';

const dir = process.argv[2];
if (!dir) {
	console.error('Usage: apply-composer-service.mjs /path/to/service');
	process.exit(1);
}

const composerPath = `${dir}/composer.json`;
if (!existsSync(composerPath)) {
	console.error('missing', composerPath);
	process.exit(1);
}

const composer = JSON.parse(readFileSync(composerPath, 'utf8'));

const testCmd = composer.scripts?.test || '@php vendor/bin/phpunit';
composer.scripts = {
	...(composer.scripts || {}),
	test: testCmd,
	phpstan:
		composer.scripts?.phpstan ||
		'@php vendor/bin/phpstan analyse --memory-limit=512M',
	phpcs: composer.scripts?.phpcs || '@php vendor/bin/phpcs -p',
	phpcbf: composer.scripts?.phpcbf || '@php vendor/bin/phpcbf',
	'lint:php': ['@phpstan', '@phpcs'],
};

writeFileSync(composerPath, JSON.stringify(composer, null, 4) + '\n');
console.log('composer service', composerPath);
