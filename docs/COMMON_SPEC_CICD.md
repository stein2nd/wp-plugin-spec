# COMMON_SPEC_CICD.md (Swift/SwiftUI プロジェクト向け共通仕様｜CI/CD workflow)

## 目的

* 本ドキュメントでは、Swift/SwiftUI プロジェクト向けの CI/CD ワークフローの共通仕様を定義します。
* 本仕様は、GitHub Actions を使用した CI/CD パイプラインの構築を想定しています。
* 本仕様に準拠することで、Swift/SwiftUI プロジェクトの CI/CD を標準化し、保守性と再現性を向上させます。

## 対象プロジェクト

本仕様は、以下のプロジェクト・タイプを対象とします。

* **Swift Package Manager プロジェクト**: Swift Package として配布されるライブラリ
* **Xcode プロジェクト**: XcodeGen を使用して生成される Xcode プロジェクト
* **マルチ・プラットフォーム対応**: macOS および iOS/iPadOS の両方に対応するプロジェクト

## 1. ワークフロー概要

### 1.1. 基本構成

本仕様では、以下の3つのジョブで構成されるワークフローを推奨します。

1. **`test-macos`**: macOS 向けテスト実行
2. **`test-ios`**: iOS/iPadOS 向けテスト実行
3. **`build-release`**: リリースビルド生成

### 1.2. ワークフロー実行条件

* **`push`**: `main` および `develop` ブランチへのプッシュ時に実行
* **`pull_request`**: `main` および `develop` ブランチへのプルリクエスト時に実行
* **マージ条件**: テストスイートが通ることをマージ条件とする

## 2. ワークフロー・ファイル構造

### 2.1. 基本構造

```yaml
name: Swift Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-macos:
    # macOS テスト・ジョブ
  test-ios:
    # iOS テスト・ジョブ
  build-release:
    needs: [test-macos, test-ios]
    # リリースビルド・ジョブ
```

### 2.2. Git 管理対象

* `.github/workflows` などの CI 設定ファイルは Git 管理対象
* ビルドキャッシュや生成物は Git 管理しない

## 3. 共通ステップ

### 3.1. Checkout

すべてのジョブで、最初にリポジトリをチェック・アウトします。

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    submodules: true  # Git サブモジュール (例: docs-linter) を含める場合
```

### 3.2. Xcode セットアップ

Xcode をセットアップします。バージョンはプロジェクトの要件に応じて指定します。

```yaml
- name: Setup Xcode
  uses: maxim-lobanov/setup-xcode@v1
  with:
    xcode-version: latest-stable  # または特定のバージョン
```

## 4. ジョブ仕様

### 4.1. `test-macos` ジョブ

#### 4.1.1. 基本設定

```yaml
test-macos:
  runs-on: macos-latest
```

#### 4.1.2. 必須ステップ

1. **Checkout** (共通)
2. **Setup Xcode** (共通)
3. **Run tests on macOS**
   ```yaml
   - name: Run tests on macOS
     run: |
       swift test --enable-code-coverage
   ```
4. **Upload coverage to Codecov**
   ```yaml
   - name: Upload coverage to Codecov
     uses: codecov/codecov-action@v3
     with:
       file: .build/coverage/coverage.xml
       flags: macos
       name: macos-coverage
   ```

### 4.2. `test-ios` ジョブ

#### 4.2.1. 基本設定

```yaml
test-ios:
  runs-on: macos-latest
  timeout-minutes: 60  # 長めに確保 (ビルド/シミュレーター起動で時間がかかる場合あり)
  env:
    LOG_DIR: /tmp/gha-ios-logs  # 出力ログ保存先
```

#### 4.2.2. Xcode バージョン選択 (フォールバック付き)

複数の Xcode バージョンを試行し、利用可能な最初のバージョンを使用します。

```yaml
- name: Try setup Xcode <version>
  uses: maxim-lobanov/setup-xcode@v1
  with:
    xcode-version: '<version>'
  continue-on-error: true
```

**推奨される優先順位**: 最新バージョン → 安定版 → 旧バージョン

#### 4.2.3. 環境検出

Xcode バージョン、SDK、シミュレーター・ランタイム、デバイス情報を検出し、ログに保存します。

```yaml
- name: 'Environment detection: Xcode / SDKs / Simulators (save logs)'
  id: detect
  run: |
    set -euo pipefail
    echo "::group::Xcode / SDK / Runtimes detection"
    xcodebuild -version | tee $LOG_DIR/xcodebuild-version.txt
    xcodebuild -showsdks 2>&1 | tee -a $LOG_DIR/showsdks.txt || true
    xcrun simctl list runtimes 2>&1 | tee -a $LOG_DIR/simctl-runtimes.txt || true
    xcrun simctl list devices available 2>&1 | tee -a $LOG_DIR/simctl-devices.txt || true
    echo "::endgroup::"
    
    # 出力変数を設定
    XCODE_VER=$(xcodebuild -version | head -1 | sed 's/Xcode //g' | cut -d" " -f1 || echo "")
    echo "xcode_version=${XCODE_VER}" >> $GITHUB_OUTPUT
```

#### 4.2.4. Xcode プロジェクト生成 (XcodeGen 使用時)

`project.yml` が存在する場合、XcodeGen を使用して Xcode プロジェクトを生成します。

```yaml
- name: Install XcodeGen
  run: |
    brew install xcodegen

- name: Generate Xcode Project
  run: |
    if [ -f "project.yml" ]; then
      xcodegen generate
    else
      echo "Error: project.yml not found. Cannot generate Xcode project."
      exit 1
    fi
```

#### 4.2.5. シミュレーター・ランタイムとデバイスの選択 (フォールバック付き)

優先順位に従って、利用可能な iOS シミュレーター・ランタイムとデバイスを選択します。

```yaml
- name: Choose simulator runtime & device
  id: choose_sim
  run: |
    set -euo pipefail
    # ランタイム優先順位: 最新 → 安定版 → 旧バージョン → 最初に利用可能な iOS ランタイム
    RUNTIMES=$(xcrun simctl list runtimes || true)
    CHOSEN_RUNTIME=""
    if echo "$RUNTIMES" | grep -q "iOS <latest>"; then
      CHOSEN_RUNTIME="iOS <latest>"
    elif echo "$RUNTIMES" | grep -q "iOS <stable>"; then
      CHOSEN_RUNTIME="iOS <stable>"
    else
      CHOSEN_RUNTIME=$(echo "$RUNTIMES" | grep "iOS " | head -1 | sed -E 's/.*(iOS [0-9]+(\.[0-9]+)?).*/\1/' || true)
    fi

    # デバイス選択 (優先デバイス名 → 最初に利用可能な iPhone/iPad)
    DEVICE_LINE=$(xcrun simctl list devices available | grep -E "iPhone|iPad" | head -1 || true)

    # 出力変数を設定
    UDID=$(echo "$DEVICE_LINE" | grep -oE '[A-F0-9-]{36}' | head -1 || true)
    NAME=$(echo "$DEVICE_LINE" | sed -E 's/^[[:space:]]*([^(]+) .*/\1/' | xargs || true)
    echo "udid=$UDID" >> $GITHUB_OUTPUT
    echo "name=$NAME" >> $GITHUB_OUTPUT
    echo "runtime=$CHOSEN_RUNTIME" >> $GITHUB_OUTPUT
```

#### 4.2.6. シミュレーターの起動 (ポーリング付き)

選択されたシミュレーターを起動し、起動完了まで待機します。

```yaml
- name: Boot simulator (with polling)
  id: boot
  run: |
    set -euo pipefail
    UDID="${{ steps.choose_sim.outputs.udid }}"

    # シミュレーターを起動
    xcrun simctl boot "$UDID" 2>&1 || true
    open -a Simulator || true

    # ポーリング (最大60回、約2分)
    MAX=60
    i=0
    while [ $i -lt $MAX ]; do
      status=$(xcrun simctl list devices | grep "$UDID" | sed -E 's/.*\(([^)]+)\).*/\1/' | tr -d '[:space:]' || true)
      if echo "$status" | grep -qi "Booted"; then
        break
      fi
      i=$((i+1))
      sleep 2
    done

    if [ $i -ge $MAX ]; then
      echo "Simulator failed to boot within timeout"
      exit 1
    fi

    echo "booted_udid=$UDID" >> $GITHUB_OUTPUT
```

#### 4.2.7. ランタイム・バージョンの抽出と SDK の自動検出

シミュレーターのランタイム・バージョンを抽出し、利用可能な SDK を確認して、ランタイム・バージョンと一致する SDK を自動検出します。

```yaml
- name: Extract runtime version and detect SDK
  run: |
    set -euo pipefail
    UDID="${{ steps.boot.outputs.booted_udid }}"

    # シミュレーターのランタイム情報を取得
    RUNTIME_SECTION=$(xcrun simctl list devices available | grep -B 50 "$UDID" | grep "^--" | tail -1 | sed 's/^-- //' | sed 's/ --$//' || echo "")

    # ランタイム・バージョンを抽出 (例: "iOS 26.0" -> "26.0")
    RUNTIME_VERSION=$(echo "$RUNTIME_SECTION" | sed -E 's/.*iOS ([0-9]+\.[0-9]+).*/\1/' || echo "")
    if [ -z "$RUNTIME_VERSION" ]; then
      RUNTIME_VERSION=$(echo "$RUNTIME_SECTION" | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "")
    fi

    # 利用可能な SDK を確認
    AVAILABLE_SDKS=$(xcodebuild -showsdks 2>&1 | grep -i "iphonesimulator" || echo "")

    # ランタイム・バージョンと一致する SDK を検出
    MATCHING_SDK=$(echo "$AVAILABLE_SDKS" | grep -iE "iphonesimulator.*${RUNTIME_VERSION}" | head -1 | sed -E 's/.*-sdk[[:space:]]*(iphonesimulator[0-9.]+).*/\1/' | sed -E 's/.*(iphonesimulator[0-9.]+).*/\1/' || echo "")
    if [ -z "$MATCHING_SDK" ]; then
      # メジャー・バージョンで一致する SDK を検索
      MAJOR_VERSION=$(echo "$RUNTIME_VERSION" | cut -d. -f1)
      MATCHING_SDK=$(echo "$AVAILABLE_SDKS" | grep -iE "iphonesimulator.*${MAJOR_VERSION}" | head -1 | sed -E 's/.*-sdk[[:space:]]*(iphonesimulator[0-9.]+).*/\1/' | sed -E 's/.*(iphonesimulator[0-9.]+).*/\1/' || echo "")
    fi
    if [ -z "$MATCHING_SDK" ]; then
      # 任意の iphonesimulator SDK を使用
      MATCHING_SDK=$(echo "$AVAILABLE_SDKS" | head -1 | sed -E 's/.*-sdk[[:space:]]*(iphonesimulator[0-9.]+).*/\1/' | sed -E 's/.*(iphonesimulator[0-9.]+).*/\1/' || echo "")
    fi

    echo "runtime_version=$RUNTIME_VERSION" >> $GITHUB_ENV
    echo "matching_sdk=$MATCHING_SDK" >> $GITHUB_ENV
```

#### 4.2.8. デスティネーションの構築

デスティネーションを構築します。**重要**: OS バージョンを指定せず、UDID のみを使用します。これにより、xcodebuild が自動的に適切な SDK/ランタイムをマッチングし、SDK とランタイムのバージョン不一致の問題を回避します。

```yaml
- name: Build destination
  run: |
    set -euo pipefail
    UDID="${{ steps.boot.outputs.booted_udid }}"

    # xcodebuild -showdestinations から UDID に一致するデスティネーションを検索
    DEST_OUTPUT=$(xcodebuild -project <project>.xcodeproj -scheme <scheme> -showdestinations 2>&1 || true)
    DEST=$(echo "$DEST_OUTPUT" | grep "platform=iOS Simulator" | grep "$UDID" | head -1 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' || echo "")

    # 見つからない場合は、UDID のみでデスティネーションを構築
    if [ -z "$DEST" ]; then
      DEST="platform=iOS Simulator,id=$UDID"
    fi

    echo "destination=$DEST" >> $GITHUB_ENV
```

**注意**: OS バージョン (`OS=26.0` など) を指定しないことが重要です。xcodebuild が自動的に適切な SDK/ランタイムをマッチングします。

#### 4.2.9. テスト実行 (マルチ・ストラテジー)

複数のアプローチでテストを実行し、いずれかが成功すれば CI を継続します。**優先順位**: SDK を指定せずに実行を優先し、xcodebuild の自動選択を活用します。

```yaml
- name: Build + Run tests (multi-strategy)
  id: run_tests
  run: |
    set -euo pipefail
    UDID="${{ steps.boot.outputs.booted_udid }}"
    DEST="${{ env.destination }}"
    MATCHING_SDK="${{ env.matching_sdk }}"
    RESULT_BUNDLE="$LOG_DIR/result.xcresult"
    rm -rf "$RESULT_BUNDLE" || true

    # ストラテジー A: test-without-building (SDK 指定なし、xcodebuild が自動選択)
    if xcodebuild test-without-building \
      -project <project>.xcodeproj \
      -scheme <scheme> \
      -destination "$DEST" \
      -enableCodeCoverage YES \
      -resultBundlePath "$RESULT_BUNDLE" 2>&1; then
      echo "test-without-building succeeded"
    else
      # ストラテジー A-2: test-without-building (検出された SDK を明示的に指定)
      rm -rf "$RESULT_BUNDLE" || true
      if [ -n "$MATCHING_SDK" ]; then
        if xcodebuild test-without-building \
          -project <project>.xcodeproj \
          -scheme <scheme> \
          -sdk "$MATCHING_SDK" \
          -destination "$DEST" \
          -enableCodeCoverage YES \
          -resultBundlePath "$RESULT_BUNDLE" 2>&1; then
          echo "test-without-building succeeded with matching SDK"
        else
          # ストラテジー B: test (SDK 指定なし、xcodebuild が自動選択)
          rm -rf "$RESULT_BUNDLE" || true
          if xcodebuild test \
            -project <project>.xcodeproj \
            -scheme <scheme> \
            -destination "$DEST" \
            -enableCodeCoverage YES \
            -resultBundlePath "$RESULT_BUNDLE" 2>&1; then
            echo "xcodebuild test succeeded"
          else
            # ストラテジー B-2: test (検出された SDK を明示的に指定)
            rm -rf "$RESULT_BUNDLE" || true
            if [ -n "$MATCHING_SDK" ]; then
              xcodebuild test \
                -project <project>.xcodeproj \
                -scheme <scheme> \
                -sdk "$MATCHING_SDK" \
                -destination "$DEST" \
                -enableCodeCoverage YES \
                -resultBundlePath "$RESULT_BUNDLE" 2>&1
            else
              echo "All xcodebuild attempts failed"
              exit 1
            fi
          fi
        fi
      else
        # ストラテジー B: test (SDK 指定なし)
        rm -rf "$RESULT_BUNDLE" || true
        xcodebuild test \
          -project <project>.xcodeproj \
          -scheme <scheme> \
          -destination "$DEST" \
          -enableCodeCoverage YES \
          -resultBundlePath "$RESULT_BUNDLE" 2>&1
      fi
    fi
```

**注意**: `<project>` と `<scheme>` はプロジェクト固有の値に置き換えてください。

#### 4.2.10. 診断情報のアップロード

すべてのログファイルをアーティファクトとしてアップロードします。テストが失敗しても診断情報をアップロードするため、`if: always()` を設定します。

```yaml
- name: Upload diagnostics artifact
  if: ${{ always() }}
  uses: actions/upload-artifact@v4
  with:
    name: ios-test-diagnostics
    path: ${{ env.LOG_DIR }}
```

#### 4.2.11. カバレッジのアップロード (ベスト・エフォート)

テスト・カバレッジを Codecov にアップロードします (失敗しても CI を継続)。

```yaml
- name: Upload coverage to Codecov (iOS) (best-effort)
  if: ${{ always() }}
  uses: codecov/codecov-action@v3
  with:
    file: .build/coverage/coverage.xml
    flags: ios
    name: ios-coverage
    fail_ci_if_error: false
```

### 4.3. `build-release` ジョブ

#### 4.3.1. 基本設定

```yaml
build-release:
  runs-on: macos-latest
  needs: [test-macos, test-ios]
```

#### 4.3.2. 必須ステップ

1. **Checkout** (共通)
2. **Setup Xcode** (共通)
3. **Build Universal Binary**
   ```yaml
   - name: Build Universal Binary
     run: |
       swift build -c release
   ```
4. **Upload build artifacts**
   ```yaml
   - name: Upload build artifacts
     uses: actions/upload-artifact@v4
     with:
       name: <project-name>-build
       path: .build/release/
   ```

**注意**: `<project-name>` はプロジェクト名に置き換えてください。

## 5. 品質保証と CI 連携

### 5.1. 自動検査ツール

| ツール | 検査対象 | 実行タイミング |
| --- | --- | --- |
| Docs Linter | ドキュメントの表記揺れ・文体統一 | PR 時 |
| SwiftLint / SwiftFormat | Swift コード規約 | コミット時または CI |
| SnapshotTesting | SwiftUI ビューの UI 再現性 | テスト実行時 |

### 5.2. 推奨ワークフロー例

AI 伴走開発との統合を想定したワークフロー例:

```yaml
# .github/workflows/ai-ci.yml
name: AI CI
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: cd tools/docs-linter && npm ci && npm run lint
      - run: swift test --enable-code-coverage
```

## 6. ベスト・プラクティス

### 6.1. フォールバック戦略

* **Xcode バージョン**: 複数のバージョンを試行し、利用可能な最初のバージョンを使用します。
* **シミュレーター・ランタイム**: 複数のランタイムを試行し、利用可能な最初のランタイムを使用します。
* **デバイス選択**: 複数のデバイス名を試行し、利用可能な最初のデバイスを使用します。
* **SDK とランタイムの自動マッチング**: ランタイム・バージョンと一致する SDK を自動検出し、SDK とランタイムのバージョン不一致の問題を回避します。
* **デスティネーション構築**: OS バージョンを指定せず、UDID のみを使用することで、xcodebuild が自動的に適切な SDK/ランタイムをマッチングします。
* **テスト実行**: 複数のアプローチでテストを実行し、いずれかが成功すれば CI を継続します。SDK を指定せずに実行を優先し、xcodebuild の自動選択を活用します。

### 6.2. エラーハンドリング

* **カバレッジ・アップロード**: `fail_ci_if_error: false` を設定し、失敗しても CI を継続します。
* **診断情報の保存**: すべてのログファイルをアーティファクトとして保存し、デバッグを容易にします。`if: always()` を設定し、テストが失敗しても診断情報をアップロードします。
* **タイムアウト設定**: iOS テストジョブに `timeout-minutes: 60` を設定し、長時間実行を防止します。
* **SDK とランタイムの不一致**: OS バージョンを指定せず、UDID のみを使用することで、xcodebuild が自動的に適切な SDK/ランタイムをマッチングし、バージョン不一致の問題を回避します。

### 6.3. ログ記録

* **環境検出ログ**: Xcode バージョン、SDK、シミュレーター情報をログに記録します。
* **ランタイム・バージョンと SDK 情報**: シミュレーターのランタイム・バージョンと検出された SDK をログに記録します。
* **デスティネーション情報**: 構築されたデスティネーションをログに記録します。
* **テスト実行ログ**: すべてのテスト実行コマンドの出力をログに記録します。
* **結果バンドル**: `xcresult` 形式の結果バンドルを保存し、詳細な分析を可能にします。

## 7. プロジェクト固有のカスタマイズ

### 7.1. 必須カスタマイズ項目

以下の項目は、プロジェクト固有の値に置き換える必要があります。

* **プロジェクト名**: `<project-name>` → 実際のプロジェクト名
* **Xcode プロジェクト名**: `<project>.xcodeproj` → 実際の Xcode プロジェクト名
* **スキーム名**: `<scheme>` → 実際のスキーム名
* **Xcode バージョン**: プロジェクトの要件に応じて指定
* **iOS ランタイム優先順位**: プロジェクトの要件に応じて指定
* **デバイス優先順位**: プロジェクトの要件に応じて指定

### 7.2. オプション・カスタマイズ項目

以下の項目は、プロジェクトの要件に応じて追加・変更できます。

* **追加のテスト・ステップ**: プロジェクト固有のテストを追加
* **追加のビルド・ステップ**: プロジェクト固有のビルド・ステップを追加
* **キャッシュ設定**: Swift Package の依存関係をキャッシュ
* **並列実行**: ジョブを並列実行して CI 時間を短縮

## 8. ローカルテストとの整合性

### 8.1. ローカルテスト・スクリプト

CI/CD と同じテストをローカルで実行するスクリプトを用意することを推奨します。

* **スクリプト名**: `scripts/test-local.sh`
* **互換性**: CI/CD 環境 (bash) とローカル環境 (zsh) の両方で動作
* **実行内容**: CI/CD と同じテストを実行

### 8.2. 実行内容の整合性

* **macOS テスト**: `swift test --enable-code-coverage` を実行
* **iOS テスト**: Xcode プロジェクトの生成、シミュレーターの起動、`xcodebuild test` の実行

## 9. 参考実装

### 9.1. 実装例

本仕様に準拠した実装例は、以下のリポジトリを参照してください。

* [s2j-about-window](https://github.com/stein2nd/s2j-about-window): 本仕様に準拠した実装例

### 9.2. ワークフロー・ファイル

実装例のワークフロー・ファイルは、以下のパスにあります。

* `.github/workflows/swift-test.yml`

## 10. 今後の改善予定

### 10.1. 短期での改善予定 (1-3ヵ月)

* **並列実行の最適化**: `test-macos` と `test-ios` ジョブを並列実行し、CI 時間を短縮
* **キャッシュの活用**: Swift Package の依存関係をキャッシュし、ビルド時間を短縮

### 10.2. 中期での改善予定 (3-6ヵ月)

* **マトリックス・ビルド**: 複数の Xcode バージョンと iOS ランタイムでテストを実行
* **UI テストの統合**: SnapshotTesting フレームワークを使用した UI テストの統合

---

## Appendix A: ワークフロー・テンプレート

### A.1. 最小構成テンプレート

```yaml
name: Swift Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable
      - run: swift test --enable-code-coverage
      - uses: codecov/codecov-action@v3
        with:
          file: .build/coverage/coverage.xml
          flags: macos
          name: macos-coverage

  test-ios:
    runs-on: macos-latest
    timeout-minutes: 60
    env:
      LOG_DIR: /tmp/gha-ios-logs
    steps:
      - uses: actions/checkout@v4
      # Xcode バージョン選択 (フォールバック付き)
      # シミュレーター選択と起動
      # テスト実行 (マルチ・ストラテジー)
      # 診断情報のアップロード
      # カバレッジのアップロード

  build-release:
    runs-on: macos-latest
    needs: [test-macos, test-ios]
    steps:
      - uses: actions/checkout@v4
      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable
      - run: swift build -c release
      - uses: actions/upload-artifact@v4
        with:
          name: <project-name>-build
          path: .build/release/
```

### A.2. 完全版テンプレート

完全版テンプレートは、実装例 ([s2j-about-window](https://github.com/stein2nd/s2j-about-window)) の `.github/workflows/swift-test.yml` を参照してください。

---

## Appendix B: 参考資料

* [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
* [Swift Package Manager ドキュメント](https://www.swift.org/package-manager/)
* [XcodeGen ドキュメント](https://github.com/yonaskolb/XcodeGen)
* [Codecov ドキュメント](https://docs.codecov.com/)
* [maxim-lobanov/setup-xcode アクション](https://github.com/maxim-lobanov/setup-xcode)
