# rakuraku-transportation-request

## 概要

- desknetsに登録された予定をもとに出社した営業日を割り出し、全ての日付についてまとめて楽々清算の申請を作成して一時保存、slackにて通知します。

- desknetsに一切予定を登録しなくても本システムは実行でき、当月の全営業日の申請をまとめて作成して一時保存してくれます。

- 秘書が作成した申請書に承認の判を押すだけのスマートな社長気分が味わえます。

## 処理内容

1. getOfficeDayFromDesknets
    - desknetsにログイン
    - スケジュール(個人月間)の表から予定を全取得
    - 予定のタイトルがあらかじめ環境変数に設定した DESKNETS_REMOTE_TITLE, DESKNETS_VACATION_TITLE と一致するか確認し、リモートの日付と休暇の日付を割り出す
    - 出社営業日を割り出す
    - 出社営業日リスト, リモート日リスト, 休暇日リストを返す
1. makeRakurakuRequest
    - 楽々清算にログイン
    - 交通費精算を押下
    - 前回までの明細が残っている場合は削除
    - マイパターンに登録されているパターンをすべて選択し、引数で受け取った出社営業日分明細を追加する
    - 申請を一時保存
1. postSlack
    - 申請を一時保存した旨と出社営業日リスト, リモート日リスト, 休暇日リストをslackで送信

## 処理の注意点

- getOfficeDayFromDesknets
    - リモートや休暇としてdesknetsに登録する予定について
        - 色や付箋はタイトルに影響を与えません
        - **アイコンやオプションを付けたり、閲覧先を制限するとタイトルが変わるので注意してください**
            - オプションを付けた場合は下記がタイトルの先頭につきます
                - [外]
                - [仮]
                - [重]
                - [フ]
            - 閲覧先を制限した場合は下記がタイトルの先頭につきます
                - [制限有]
        - **複数日にまたがる予定や年をまたぐ予定についても対応しています**
- makeRakurakuRequest
    - 前回までの明細が残っている場合は削除したうえで申請を作成します
    - マイパターンに複数のパターンが登録されている場合、全てのパターンが選択されます
- postSlack
    - エラーの場合もエラー内容をslack送信してくれるので気づけます
        - (そのエラー通知slackがエラーした場合は気づけないので適宜確認してあげてください)

## 環境変数

<span style="color:red">※slackのトークン、サインインシークレットが欲しい場合は個別で言ってください</span>

- DESKNETS_URL
    - desknetsのログインURL
- DESKNETS_USER
    - desknetsのユーザー名
- DESKNETS_PASSWORD
    - desknetsのパスワード
- DESKNETS_REMOTE_TITLE
    - desknetsにおいて、リモートの日に追加する予定のタイトル
- DESKNETS_VACATION_TITLE
    - desknetsにおいて、休暇の日に追加する予定のタイトル
- RAKURAKU_URL
    - 楽々清算のログインURL
- RAKURAKU_USER
    - 楽々清算のユーザー名
- RAKURAKU_PASSWORD
    - 楽々清算のパスワード
- SLACK_BOT_TOKEN
    - slackのアプリ vulnerability-bot のトークン
- SLACK_SIGNIN_SECRET
    - slackのアプリ vulnerability-bot のサインインシークレット
- SLACK_CHANNEL
    - slackを送信したいチャンネル
    - 先頭に`#`を付ける
        - 例: `#テストチャンネル`

## 導入方法-ローカル

- 任意の場所で本プロジェクトをgit clone
- Node.js 20 LTS をインストール
    - https://nodejs.org/en/download/package-manager
- ライブラリインストール
```shell
npm install
npx playwright install
```
- .envファイルの作成
    - プロジェクト直下に.envファイルを作成
    - 環境変数を記載
        - [環境変数](#環境変数)を参照
- slack通知したい場合は[slack通知導入方法](#slack通知導入方法)を参照
- テスト実行
```shell
npx playwright test
```

## 導入方法-AWS Lambda

- AWSコンソールからLambdaを選択
- 関数から関数の作成を選択
    - 関数名は任意
    - ランタイムは Node.js 20.x を選択
    - アーキテクチャは x86_64 をチェック
    - 関数の作成を押下
- 設定より一般設定の編集
    - メモリを1024MBに変更
        - 任意で変更可能
        - lambdaの無料枠は1ヶ月あたり400,000GB秒であり、メモリサイズ1024MBで1回の実行が20分だとしても333回実行できる（計算間違ってたらすいません）
    - タイムアウトを5分に変更
    - 保存を押下
- 設定より環境変数の設定
    - [環境変数](#環境変数)を参照
- レイヤーの設定
    - レイヤーの追加を押下
    - 新しいレイヤーの作成を押下
    - [./lambda/layers](./lambda/layers)配下の2つのzipについて下記を実施
        - 名前は任意
        - .zipファイルをアップロードを選択
        - アップロードボタンを押下し、該当のzipを選択
        - 互換性のあるアーキテクチャ - オプションにて x86_64 を選択
        - 互換性のあるランタイム - オプションにて Node.js 20.x を選択
        - 作成を押下
        - 表示されるバージョン ARNをコピー
        - 関数の画面に戻り、レイヤーの追加を押下
        - ARNを指定を選択し、先ほどのARNをペースト
        - 追加を押下し正常に追加されることを確認
    - レイヤーの追加を押下
    - ARNを指定を選択し、下記のARNをペースト
        - arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:49
        - 追加を押下し正常に追加されることを確認
    - レイヤーについて知りたい人は[レイヤーの説明](#レイヤーの説明)を参照
- [slack通知導入方法](#slack通知導入方法)を参照してチャンネルにアプリを追加
- コードのデプロイ
    - 関数のコードエディタ画面を開く
    - index.mjs を[./lambda](./lambda)配下のindex.mjsに書き換え
    - [./lambda](./lambda)配下の下記3つのファイルをコピー
        - getOfficeDayFromDesknets.mjs
        - makeRakurakuRequest.mjs
        - postSlack.mjs
    - Deployを押下（ **今後ファイルに変更を加えた場合もこのDeployを押さない限り反映されないので注意** ）
    - Testを押下
    - Test Eventが一つもない場合は Create new test event を押下
        - 設定項目全て任意
            - Event JSONも本システムの動作には一切関係ないため放置でOK
        - Saveを押下
    - Testから任意のテストを実行し成功することを確認
- EventBridgeの設定
    - ①簡易バージョン（営業日関係なく毎月28日に起動）
        - 関数の概要画面からトリガーを追加をクリック
        - ソースからEventBridgeを選択
        - 新規ルールを作成を選択
        - ルール名は任意
        - ルールタイプをはスケジュール式を選択
        - スケジュール式に下記を入力
            - `cron(30 0 28 * ? *)`
                - 毎月28日00:30(UTC)に起動の意味
        - 追加を押下
    - ②正確バージョン（毎月末最終営業日に起動）
        - AWS System Manager Change Calendarからカレンダーを選択
            - デフォルトで閉じるを選択
            - 参考: https://dev.classmethod.jp/articles/amazon-workspaces-modify-running-mode-on-schedule/
        - 毎月末最終営業日に手作業でイベントを追加（カレンダーのインポートもできるようだが、1年につき12個登録するだけだしいっかと妥協している）
        - EventBridgeにて該当のカレンダーがOPENになったときに起動し該当のラムダ関数をキックするように設定
            - 参考: https://dev.classmethod.jp/articles/ssm-change-calendar-use-from-application/
- 以上で完成！

### レイヤーの説明

1. lambda-layer-playwright.zip
    * その他ライブラリ用
    * 3とplaywrightらへんで一部被っている気がするが、とりあえず動くのでOKとしている
1. lambda-layer-slack.zip
    * slack web api用
1. arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:49
    * 下記サイトから拝借、playwright chromium用
        * https://github.com/shelfio/chrome-aws-lambda-layer

## slack通知導入方法

- 送信したいチャンネルにアプリを導入する必要がある
    - チャンネルの詳細を開く
    - インテグレーションよりアプリを追加する
    - vulnerability-botを追加
- 注意
    - 残念ながらDMにはアプリを追加できないようなので、自分1人だけの通知用チャンネルとか作るといいかも
