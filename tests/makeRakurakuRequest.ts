import { Frame } from "@playwright/test";

const RAKURAKU_URL = process.env.RAKURAKU_URL;
const RAKURAKU_USER = process.env.RAKURAKU_USER;
const RAKURAKU_PASSWORD = process.env.RAKURAKU_PASSWORD;

export async function makeRakurakuRequest({ page }, officeDates) {
    /*
        楽々清算にログインし、引数のofficeDatesをもとにマイパターンの申請を作成し一時保存する
        現在より未来の日付の明細を追加しても問題なく動作する
    */
    try{
        console.log('==== makeRakurakuRequest Start ====');

        await page.goto(RAKURAKU_URL);
        const loginIdInputElement = await page.$("input[name='loginId']");
        loginIdInputElement.fill(RAKURAKU_USER);
        const loginPasswordInputElement = await page.$("input[name='password']");
        loginPasswordInputElement.fill(RAKURAKU_PASSWORD);
        const loginButtonElement = await page.$("input#submitBtn");
        await loginButtonElement.click();
        await page.waitForLoadState("domcontentloaded");
        console.log('==== ログイン完了 ====');

        // フレームのロードを待機
        // playwrightではframeを直接待機できないためこのような待機方法を取る
        let mainFrame: Frame;
        for (let i = 0; i < 10; i++) { // 最大10回試行
            mainFrame = page.frame({ name: "main" });
            if (mainFrame) break;
            await page.waitForTimeout(500); // 0.5秒待機
        }
        if (!mainFrame!) {
            throw new Error("main フレームが見つかりません");
        }
        console.log("==== main フレーム取得成功 ====");
    
        // ヘッダの表示まで待機
        await mainFrame.waitForSelector("#d_home_header");
        const headerUls = await mainFrame.$$(
            "div#d_home_header > ul"
        );
        const traficRequestButton = await headerUls[0].$("li > div > a");
        // ポップアップウィンドウをキャプチャ
        const [popup] = await Promise.all([
            page.waitForEvent('popup'),
            traficRequestButton!.click(),
        ]);
        await popup.waitForLoadState('domcontentloaded');
        console.log('==== 交通費精算画面遷移成功 ====');

        // TODO: 事前に明細があった場合は削除する
        for(const date of officeDates){
            await popup.waitForSelector("div#denpyoFixedArea");
            const denpyoFixedAreaButtons = await popup.$$(
                "div#denpyoFixedArea > div > div > button"
            );
            const myPatternButton = denpyoFixedAreaButtons[2];
            const [myPatternPopup] = await Promise.all([
                popup.waitForEvent('popup'),
                myPatternButton!.click(),
            ]);
            await myPatternPopup.waitForLoadState("domcontentloaded");
            console.log('==== マイパターン一覧画面遷移成功 ====');
    
            // マイパターンは全チェックする
            await myPatternPopup.waitForSelector("input.headerAllCheck");
            const headerAllCheckInput = await myPatternPopup.$("input.headerAllCheck");
            await headerAllCheckInput.check();
            const nextButton = await myPatternPopup.$(
                "div#d_footer > div > button"
            );
            await nextButton.click();
            await myPatternPopup.waitForLoadState("domcontentloaded");
            console.log('==== 日付選択画面遷移成功 ====');
    
            // 日付を入力
            await myPatternPopup.waitForSelector("input.reflectBatch.cacheDate.text-field__input.newDesignDateInput");
            const meisaiDateInput = await myPatternPopup.$("input.reflectBatch.cacheDate.text-field__input.newDesignDateInput");
            await meisaiDateInput.fill(date);
    
            // 一括反映ボタンをクリック
            const bulkReflectButton = await myPatternPopup.$("div.d_marginTop10 > button");
            await bulkReflectButton.click();
    
            // モーダルが表示されるのでOKボタンをクリック
            await myPatternPopup.waitForSelector("div#confirmWindow");
            const okButton = await myPatternPopup.$(
                "div#confirmWindow > div.modal-window__footer > button.button.button--l.button-primary.confirmKakutei"
            );
            await okButton.click();
    
            // 明細追加ボタンをクリック
            await myPatternPopup.waitForSelector(
                "div.denpyo__footer > div > button.button.button--l.button-primary.accesskeyFix.kakutei"
            );
            const addDetailsButton = await myPatternPopup.$(
                "div.denpyo__footer > div > button.button.button--l.button-primary.accesskeyFix.kakutei"
            );
            await addDetailsButton.click();
            await popup.waitForLoadState("domcontentloaded");
            console.log(`==== ${date} 明細追加完了 ====`)
        }

        await popup.waitForSelector("div.denpyo__footer > div.controls > button.button.save.accesskeyReturn");
        const temporarySaveButton = await popup.$(
            "div.denpyo__footer > div.controls > button.button.save.accesskeyReturn"
        );
        await temporarySaveButton.click();
        console.log('==== 一時保存完了 ====');
    }catch(error){
        console.error('makeRakurakuRequest Error:', error);
    }finally{
        console.log('==== makeRakurakuRequest End ====');
    }
}
