# wp-plugin-spec - PHPUnit (wp-env なし / Local 開発)

* 本ドキュメントは、段階3 (PHPUnit) において **Docker / `@wordpress/env` (wp-env) を使わず** 開発マシン上で PHPUnit を実行する **共通手順** を定義します。
* CI では引き続き wp-env 等を使ってよい ([`SMOKE_AND_WP_ENVIRONMENTS.md`](./SMOKE_AND_WP_ENVIRONMENTS.md))。
* 各プラグインのテスト件数、npm スクリプト名、結果記録は `./docs/test-results.md` および `./docs/SPEC_TEST_AND_CICD.md` (ひな型: `TEST_AND_CICD_TEMPLATE.md`) に書きます。

## 1. 目的と原則

| 項目 | 内容 |
| --- | --- |
| ローカル | MySQL (Local 等) + Composer PHPUnit。**Docker 不要** |
| 開発サイト DB | **使わない**。Local の Database 名 `local` 等はサイト用 |
| テスト DB | **別名** の専用 DB のみ (推奨: `wordpress_test`)。統合テストはここに書き込む |
| 取得物 | リポジトリ内 `tests/.wordpress` (コア)、`tests/.wordpress-tests-lib` (PHPUnit lib)。gitignore |

統合テスト (`WP_UnitTestCase`) は post 作成、meta 更新、REST など **DB に副作用** があります (接続先 DB 名を開発サイトと同一にしないこと)。実装では `WP_TESTS_DB_NAME=local` を **拒否** するスクリプトを推奨します (参考実装を参照)。

ユニットテスト (WordPress bootstrap なし) は **DB 不要** です。ドメイン純関数を `phpunit.unit.xml.dist` 等で分離します ([`SPECS.md`](./SPECS.md) §5)。

## 2. 下準備

### 2.1. PHP と Composer

* PHP **8.x** (プラグインの `Requires PHP` に合わせる)。
* リポジトリルートで `composer install`。
* PHPUnit **v9** を `vendor/bin/phpunit` で使う構成を推奨 (WP テストスイートとの互換。wp-env コンテナ同梱の PHPUnit v10は非互換のことがある)。

### 2.2. MySQL クライアント

統合テストの **初回** に `bin/install-wp-tests.sh` (各リポジトリ) が `CREATE DATABASE` します。

* macOS 例: Homebrew `mysql-client` 等で `mysql` が PATH にあること。
* 確認:

```bash
mysql --version
```

Local の MySQL に接続できること (socket または TCP。`.env.tests` と一致):

```bash
mysql --user=root --password='***' --socket='/Users/<you>/Library/Application Support/Local/run/<site-id>/mysql/mysqld.sock' --execute='SELECT 1;'
```

(`<you>` / `<site-id>` は環境ごとに異なる。パスワードは Local の Database タブの値)

### 2.3. Subversion (`svn`)

初回 install で WordPress **PHPUnit 用 includes / data** を SVN から取得します。

1. **インストール** … macOS: `brew install subversion` 等 (Xcode CLT だけでは `svn` がない環境がある)。
2. **PATH** … `which svn` が成功すること (例: `/opt/homebrew/bin/svn`)。

```bash
# Apple Silicon の例 (Intel は /usr/local を参照)
export PATH="/opt/homebrew/bin:${PATH}"
```

3. **確認** … `svn --version`

### 2.4. Local by Flywheel (開発サイト)

複数プラグインを `~/Local Sites/<site-name>/app/public/wp-content/plugins/` に clone する構成を想定します。`<site-name>` は公開資料では必要に応じてマスクします。

#### Database タブ

Local アプリ → 対象サイト → **Database**:

| 項目 | 典型的な値 | PHPUnit |
| --- | --- | --- |
| Database name | `local` | **使わない** |
| Username / Password | `root` / `root` 等 | `.env.tests` の `WP_TESTS_DB_*` |
| Host | `localhost` | socket 利用時も WP 形式で `localhost` |
| Socket | `…/Local/run/<site-id>/mysql/mysqld.sock` | `WP_TESTS_DB_HOST` (下記) |

`<site-id>` は Local がサイトごとに発行する識別子です。**公開資料では `<site-id>` とマスク** し、実パスは `.env.tests` (gitignore) のみです。

#### Socket パス

* Database タブの **Socket** をコピーする。
* 目安: `~/Library/Application Support/Local/run/<site-id>/mysql/mysqld.sock`

#### `.env.tests` (gitignore)

テンプレート `.env.tests.example` をコピーし、**コミットしません**。

WordPress の `DB_HOST` 形式: **`localhost:` + socket 絶対パス**。空白 (`Application Support`) があるため **ダブルクオート** で囲む。

```dotenv
WP_TESTS_DB_NAME=wordpress_test
WP_TESTS_DB_USER=root
WP_TESTS_DB_PASSWORD=root
WP_TESTS_DB_HOST="localhost:/Users/<you>/Library/Application Support/Local/run/<site-id>/mysql/mysqld.sock"
```

TCP のみの場合は、`WP_TESTS_DB_HOST=localhost` でもかまいません。

## 3. 推奨リポジトリ構成

各プラグインが採用するファイル例 (参考実装: [s2j-media-library-date-corrector](https://github.com/stein2nd/s2j-media-library-date-corrector)):

| パス | 役割 |
| --- | --- |
| `.env.tests.example` | 共有テンプレート (マスク済み例) |
| `.env.tests` | 実接続 (gitignore) |
| `phpunit.unit.xml.dist` | ユニット (DB なし) |
| `phpunit.xml.dist` | 統合 (`WP_UnitTestCase`) |
| `tests/bootstrap-unit.php` | ユニット bootstrap |
| `tests/bootstrap.php` | 統合 bootstrap (`WP_TESTS_DIR`) |
| `bin/install-wp-tests.sh` | コア + テスト lib + テスト DB 作成 |
| `bin/phpunit-local.sh` | ローカル runner (ユニット → 統合) |
| `bin/phpunit-ci.sh` | wp-env コンテナ内 runner |

`WP_VERSION=latest` では、WordPress.org API で得た **同一リリース** のコア tarball と SVN `tags/x.y.z` の PHPUnit lib をそろえます (core と trunk tests の不一致を避ける)。

### 3.1. npm / Composer スクリプト (例)

| コマンド | 用途 |
| --- | --- |
| `npm run test:unit:php:unit-only` | ユニットのみ (DB / Docker 不要) |
| `npm run test:unit:php:local` | 全件 (初回 install あり) |
| `composer test:unit` / `composer test:all` | Node なしでも可 |
| `npm run test:unit:php` | **CI** (wp-env) |

## 4. 推奨フロー (ローカル)

初回は `Using WordPress x.y.z for core and test library.` のあと `tests/.wordpress*` が作成され、統合テストが走ります。

```bash
composer install
cp .env.tests.example .env.tests   # 編集
npm run test:unit:php:local        # または composer test:all
```

## 5. トラブルシューティング

`wordpress_test` は、Local の Database ツールから DROP してかまいません (次回 install で再作成)。

| 症状 | 対処 |
| --- | --- |
| `Could not create database "wordpress_test"` | `.env.tests` の user / password / socket。`mysql … SELECT 1` で確認 |
| `spawn docker ENOENT` | wp-env 用。ローカルは `test:unit:php:local` |
| `Interface "WP_Secrets_Store" not found` 等 | コアとテスト lib のバージョン不一致。`rm -rf tests/.wordpress tests/.wordpress-tests-lib` 後に再実行 |
| `svn: command not found` | Subversion を PATH に追加 |
| 開発 DB を汚したくない | `WP_TESTS_DB_NAME` を `local` にしない。ユニットのみ実行 |

## 6. 関連

* [`SMOKE_AND_WP_ENVIRONMENTS.md`](./SMOKE_AND_WP_ENVIRONMENTS.md) — Local / Studio / PHPUnit の役割
* [`SPECS.md`](./SPECS.md) §5 (テスト、結果マーク)
* [`TEST_AND_CICD_TEMPLATE.md`](./TEST_AND_CICD_TEMPLATE.md) — プラグイン固有 CI
* [`CICD.md`](./CICD.md) — 共通 CI
