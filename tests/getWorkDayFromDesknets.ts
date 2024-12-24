import { expect } from "@playwright/test";

const DESKNETS_URL = process.env.DESKNETS_URL;
const DESKNETS_USER = process.env.DESKNETS_USER;
const DESKNETS_PASSWORD = process.env.DESKNETS_PASSWORD;
const DESKNETS_REMOTE_TITLE = process.env.DESKNETS_REMOTE_TITLE;
const DESKNETS_VACATION_TITLE = process.env.DESKNETS_VACATION_TITLE as string;


export async function getWorkDayFromDesknets({ page }) {
    try{
        console.log('==== getWorkDayFromDesknets Start ====');

        await page.goto(DESKNETS_URL);
        const loginIdInputElement = await page.$("input[name='UserID']");
        loginIdInputElement.fill(DESKNETS_USER);
        const loginPasswordInputElement = await page.$("input[name='_word']");
        loginPasswordInputElement.fill(DESKNETS_PASSWORD);
        const loginButtonElement = await page.$("a#login-btn");
        await loginButtonElement.click();
        await page.waitForLoadState("domcontentloaded");
        console.log('==== ログイン完了 ====')

        // 表の表示まで待機
        await page.waitForSelector("div.cal-month-body > div.cal-month-week");
        const monthWeekDivs = await page.$$("div.cal-month-body > div.cal-month-week");
        console.log('==== スケジュール表取得完了 ====')

        const officeDateList: string[] = [];
        for(const div of monthWeekDivs){
            // TODO: 長期休暇への対応
            const barsAtags = await div.$$("div.cal-h-week > div.cal-h-bars-data > div.cal-h-bars-data-inner > div > div.cal-item-box > a");
            if(barsAtags){
                for(const aTag of barsAtags){
                    const title = await aTag.getAttribute('title');
                    const vacationTitleRegex = new RegExp(DESKNETS_VACATION_TITLE);
                    if(vacationTitleRegex.test(title)){
                        console.log('長期休暇:', title);
                    }
                }
            }
            // 土日祝日以外の当月のtdを取得
            const tds = await div.$$(
                "div.cal-h-week > table > tbody > tr > td:not(.co-saturday):not(.co-sunday):not(.co-holiday):not(.cal-other-month)"
            );
            for(const td of tds){
                const dayAtag = await td.$("div.cal-month-day-header > a");
                const date = await dayAtag.textContent();
                const aTags = await td.$$("div.cal-h-list-data > div.cal-item-box > a.cal-item");
                let isRemote = false;
                let isVacation = false;
                for(const aTag of aTags){
                    const title = await aTag.getAttribute('title');
                    // 休暇の場合はスキップ
                    if(title === DESKNETS_VACATION_TITLE){
                        console.log('休暇日:', date);
                        isVacation = true;
                        break;
                    }
                    if(title === DESKNETS_REMOTE_TITLE){
                        isRemote = true;
                    }
                }
                if(!isVacation && !isRemote){
                    officeDateList.push(date);
                }
            }
        } 
        console.log('==== 出社日集計完了 ====')
        console.log('officeDateList:', officeDateList);
        return officeDateList;
    }catch(error){
        console.error('getWorkDayFromDesknets Error:', error);
    }finally{
        console.log('==== getWorkDayFromDesknets End ====');
    }
};
