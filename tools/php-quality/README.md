# PHP quality npm scripts (Local / no wp-env)

Adds **`npm run lint:php`** (PHPStan + PHPCS [+ WPCS on plugins]) and **`npm run test:unit:php:local`** (`composer test`) without Docker.

## Apply to a repo

```bash
bash tools/php-quality/apply-all.sh
```

Or per plugin:

```bash
cp tools/php-quality/phpcs.*.xml.dist /path/to/plugin/
cp tools/php-quality/phpstan.plugin.neon.dist /path/to/plugin/phpstan.neon.dist
node tools/php-quality/apply-composer-plugin.mjs /path/to/plugin
node tools/php-quality/apply-npm-php-scripts.mjs --wpcs /path/to/plugin/package.json
```

Services: `apply-composer-service.mjs` + `apply-npm-php-scripts.mjs` (no `--wpcs`).

## Usage

```bash
composer install
npm run lint:php
npm run test:unit:php:local
```

Plugins additionally:

```bash
npm run phpcs:wpcs
```

WPCS / PHPStan may report existing violations until code is adjusted; scripts are wired for incremental cleanup.
