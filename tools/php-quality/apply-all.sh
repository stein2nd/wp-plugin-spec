#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
T="$ROOT"

PLUGINS=(
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-site-policy-manager"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-alliance-manager"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-slug-generater"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-media-library-date-corrector"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-video-publisher"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-webinar"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-webinar-source-qr"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-webinar-survey"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-content-dates"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-query-pinned"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/s2j-inquiry-destination"
	"/Users/stein/Local Sites/blockpluginbase/app/public/wp-content/plugins/kis-wordpress"
)

SERVICES=(
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-similarity-service"
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-video-publisher-service"
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-webinar-service"
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-webinar-survey-service"
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-content-dates-service"
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-query-pinned-service"
	"/Users/stein/Library/CloudStorage/Dropbox/GitHub/s2j-inquiry-destination-service"
)

for d in "${PLUGINS[@]}"; do
	cp "$T/phpcs.plugin.xml.dist" "$d/phpcs.xml.dist"
	cp "$T/phpcs.wpcs.xml.dist" "$d/phpcs.wpcs.xml.dist"
	cp "$T/phpstan.plugin.neon.dist" "$d/phpstan.neon.dist"
	node "$T/apply-composer-plugin.mjs" "$d"
	node "$T/apply-npm-php-scripts.mjs" --wpcs "$d/package.json"
done

for d in "${SERVICES[@]}"; do
	if [[ ! -s "$d/phpcs.xml.dist" ]]; then
		cp "$T/phpcs.service.xml.dist" "$d/phpcs.xml.dist"
	fi
	node "$T/apply-composer-service.mjs" "$d"
	node "$T/apply-npm-php-scripts.mjs" "$d/package.json"
done

echo "Done."
