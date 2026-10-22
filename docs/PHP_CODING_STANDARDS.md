# wp-plugin-spec - PHP コーディング規約 (PHPCS / PHPCBF)

* 本ドキュメントは **WordPress プラグイン** 向けの PHP スタイルと PHPCS の運用を定義する。
* **Composer ライブラリ** (純ドメイン / 計算サービス) には **WPCS を適用しない**。PSR-12 (または当該リポジトリが選んだ PHP-FIG 系ルール) と PHPUnit / PHPStan を正とする。
* CI での `lint-php` ジョブ全体像は [`CICD.md`](./CICD.md) §6.2を参照する。

## 1. なぜ二系統か

名前空間付きアダプタ (`includes/`) は `PSR-4` クラス、4スペースインデント、`PSR-12` にそろえます。

一方、プラグイン本体の bootstrap (`{slug}.php`、`uninstall.php` 等) は WordPress コーディング規約 (WPCS) の手順的 PHP に近いものになります。

**PSR-12と WPCS を同一ディレクトリに同時適用すると、インデント (スペース vs タブ) やファイル名規則が衝突します。** そのためプラグインでは **ルールセットをパスで分けます**。

## 2. WordPress プラグイン (推奨レイアウト)

| 対象パス | ルール | 設定ファイルの例 | 内容 |
| --- | --- | --- | --- |
| `includes/` (および `phpstan/bootstrap.php` 等の解析用スタブ) | **PSR-12** | `phpcs.xml.dist` | 名前空間アダプタ。4スペース。`vendor/bin/phpcs -p` |
| プラグインルートの手続き PHP | **WPCS** | `phpcs.wpcs.xml.dist` | `{plugin-slug}.php`、`uninstall.php` 等。**`includes/` は exclude** |

### 2.1. Composer scripts (例)

`phpcs` のデフォルト standard は `phpcs.xml.dist` (PSR-12) に置きます。WPCS は `--standard=phpcs.wpcs.xml.dist` で明示します。

```json
"scripts": {
  "phpstan": "@php vendor/bin/phpstan analyse -c phpstan.neon.dist --memory-limit=512M",
  "phpcs": "@php vendor/bin/phpcs -p",
  "phpcs:wpcs": "@php vendor/bin/phpcs -p --standard=phpcs.wpcs.xml.dist",
  "phpcbf": "@php vendor/bin/phpcbf -p --standard=phpcs.xml.dist includes/ phpstan/bootstrap.php",
  "lint:php": ["@phpstan", "@phpcs", "@phpcs:wpcs"]
}
```

### 2.2. 自動修正 (PHPCBF) — 重要

スタイルを直すときは **PSR-12用の PHPCBF だけ** を `includes/` に当てます。

```bash
composer phpcbf
# 実体例: vendor/bin/phpcbf -p --standard=phpcs.xml.dist includes/ phpstan/bootstrap.php
```

**WPCS 用の `phpcbf` を `includes/` に実行しない。**

WPCS はタブインデント等を適用し、PSR-12の「スペースのみインデント」と衝突します。両方当てると `Generic.WhiteSpace.DisallowTabIndent` 等が再発します。

WPCS 側の手直しが必要なときは、**ルートの bootstrap PHP のみ** `phpcs.wpcs.xml.dist` 対象に限定して修正します。

### 2.3. `PSR-1` メソッド名 (snake_case)

WordPress フックコールバック (`array( self::class, 'save_post_handler' )` 等) では **snake_case メソッド名** を使ってよい。PSR-12設定で `PSR1.Methods.CamelCapsMethodName.NotCamelCaps` を exclude する例があります (S2J 系プラグイン)。

### 2.4. 静的解析 (PHPStan)

* 解析対象は通常 `includes/`。
* プラグイン定数 (`{PREFIX}_PLUGIN_DIR` 等) はメインファイルで `define` されるため、PHPStan 用に `phpstan/bootstrap.php` でスタブ定義する。

## 3. Composer ライブラリ

プラグインが `vendor/` 経由でライブラリを取り込む場合、ライブラリ側のスタイルは PSR-12で統一し、プラグイン側 WPCS とは混ぜません。

| 項目 | 方針 |
| --- | --- |
| WPCS | **導入しない** (WordPress スタブも本番コードに不要なら最小限) |
| PHPCS | **PSR-12** のみ (1ルールセットでよい) |
| PHPCBF | 同上 standard で `src/` 等 |
| ドメイン | 純 PHP。副作用はリポジトリ境界のテストダブルに閉じる |

## 4. 各プラグインの `SPEC_TEST_AND_CICD.md` に書くこと

* `phpcs.xml.dist` / `phpcs.wpcs.xml.dist` の有無と対象パス
* `composer phpcbf` の引数 (標準名とディレクトリ)
* `lint:php` が `phpstan` + `phpcs` + `phpcs:wpcs` のどれを含むか

## 5. 関連ドキュメント

* [`SPECS.md`](./SPECS.md) §2.7 (要約)
* [`CICD.md`](./CICD.md) §6.2 (CI `lint-php`)
* [`TEST_AND_CICD_TEMPLATE.md`](./TEST_AND_CICD_TEMPLATE.md) — プラグイン固有の記入欄
