#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename, dirname } from 'path';

const dir = process.argv[2];
if (!dir) {
	console.error('Usage: apply-composer-plugin.mjs /path/to/plugin');
	process.exit(1);
}

const composerPath = `${dir}/composer.json`;
const slug = basename(dir);
const pkgName = `s2j/${slug}`;

let composer = {};
if (existsSync(composerPath)) {
	const raw = readFileSync(composerPath, 'utf8').trim();
	if (raw) {
		composer = JSON.parse(raw);
	}
}

composer.name = composer.name || pkgName;
composer.type = composer.type || 'wordpress-plugin';
composer.license = composer.license || 'GPL-3.0-or-later';
composer.require = composer.require || { php: '>=8.1' };
composer['require-dev'] = {
	...(composer['require-dev'] || {}),
	'phpunit/phpunit': composer['require-dev']?.['phpunit/phpunit'] || '^9.6',
	'yoast/phpunit-polyfills': composer['require-dev']?.['yoast/phpunit-polyfills'] || '^2.0',
	'phpstan/phpstan': '^2.1',
	'squizlabs/php_codesniffer': '^3.10',
	'wp-coding-standards/wpcs': '^3.1',
	'dealerdirect/phpcodesniffer-composer-installer': '^1.1',
	'php-stubs/wordpress-stubs': '^6.8',
};

const testCmd =
	composer.scripts?.test ||
	(existsSync(`${dir}/phpunit.xml.dist`) ? 'phpunit -c phpunit.xml.dist' : 'phpunit');

composer.scripts = {
	...(composer.scripts || {}),
	test: testCmd,
	phpstan: '@php vendor/bin/phpstan analyse -c phpstan.neon.dist --memory-limit=512M',
	phpcs: '@php vendor/bin/phpcs -p',
	'phpcs:wpcs': '@php vendor/bin/phpcs -p --standard=phpcs.wpcs.xml.dist',
	phpcbf: '@php vendor/bin/phpcbf',
	'lint:php': ['@phpstan', '@phpcs', '@phpcs:wpcs'],
};

composer.config = {
	...(composer.config || {}),
	'sort-packages': true,
	'allow-plugins': {
		...(composer.config?.['allow-plugins'] || {}),
		'dealerdirect/phpcodesniffer-composer-installer': true,
	},
	platform: composer.config?.platform || { php: '8.2.34' },
};

const out = JSON.stringify(composer, null, '\t') + '\n';
writeFileSync(composerPath, out);
console.log('composer plugin', composerPath);
