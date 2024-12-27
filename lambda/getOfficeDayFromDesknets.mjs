import { chromium as playwright } from "playwright";
import chromium from '@sparticuz/chromium';

const DESKNETS_URL = process.env.DESKNETS_URL;
const DESKNETS_USER = process.env.DESKNETS_USER;
const DESKNETS_PASSWORD = process.env.DESKNETS_PASSWORD;
const DESKNETS_REMOTE_TITLE = process.env.DESKNETS_REMOTE_TITLE;
const DESKNETS_VACATION_TITLE = process.env.DESKNETS_VACATION_TITLE;


export async function getOfficeDayFromDesknets() {
    /*
    desknetsから出社日、リモート日、休暇日を取得する
    出社日は非営業日を除く
    リモート日、休暇日は非営業日を含む

    下記テストケースは実施した（保証はしません）
    1. 単独休暇
    2. 単独リモート
    3. 長期休暇
    4. 長期リモート
    5. 年をまたいだ長期休暇
    6. 年をまたいだ長期リモート
    */
    try{
        console.log('==== getOfficeDayFromDesknets Start ====');

        const browser = await playwright.launch({
            args: chromium.args, // ライブラリ提供
            headless: true,
            executablePath: await chromium.executablePath() // ライブラリ提供(Chromium配置場所)
        });
        const page = await browser.newPage();
        page.setDefaultTimeout(60000);

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
        await page.waitForSelector("span.neo-time");
        const neoTimeSpan = await page.$(
            // "div.portal-content-1011 > div.portal-content-body > div.portal-cal > div.portal-cal-date-header > div.cal-date > span"
            "span.neo-time"
        );
        const neoTime = await neoTimeSpan.textContent();
        const [year, month] = extractYearMonth(neoTime);
        console.log('year:', year);
        console.log('month:', month);
        console.log('==== 現在年月情報取得完了 ====')

        const monthWeekDivs = await page.$$("div.cal-month-body > div.cal-month-week");
        console.log('==== スケジュール表取得完了 ====')

        // Setだと重複しない
        const officeDateSet = new Set();
        const remoteDateSet = new Set();
        const vacationDateSet = new Set();
        for(const div of monthWeekDivs){
            // 長期リモート、長期休暇への対応
            const barsAtags = await div.$$("div.cal-h-week > div.cal-h-bars-data > div.cal-h-bars-data-inner > div > div.cal-item-box > a");
            if(barsAtags){
                for(const aTag of barsAtags){
                    const title = await aTag.getAttribute('title');
                    const remoteTitleRegex = new RegExp(DESKNETS_REMOTE_TITLE);
                    const vacationTitleRegex = new RegExp(DESKNETS_VACATION_TITLE);
                    if(remoteTitleRegex.test(title)){
                        console.log('title:', title);
                        const longRemoteDates = extractDateRange(year, title);
                        // longRemoteDates.length=2である
                        console.log('longRemoteDates:', longRemoteDates);
                        const remoteDates = getDatesBetween(longRemoteDates[0], longRemoteDates[1]);
                        console.log('remoteDates:', remoteDates);
                        for(const date of remoteDates){
                            remoteDateSet.add(date);
                        }
                    }else if(vacationTitleRegex.test(title)){
                        console.log('title:', title);
                        const longVacationDates = extractDateRange(year, title);
                        // longVacationDates.length=2である
                        console.log('longVacationDates:', longVacationDates);
                        const vacationDates = getDatesBetween(longVacationDates[0], longVacationDates[1]);
                        console.log('vacationDates:', vacationDates);
                        for(const date of vacationDates){
                            vacationDateSet.add(date);
                        }
                    }
                }
            }
            // 単独リモート、単独休暇への対応
            // 土日祝日以外の当月のtdを取得
            const tds = await div.$$(
                "div.cal-h-week > table > tbody > tr > td:not(.co-saturday):not(.co-sunday):not(.co-holiday):not(.cal-other-month)"
            );
            for(const td of tds){
                const dayAtag = await td.$("div.cal-month-day-header > a");
                const day = await dayAtag.textContent();
                const aTags = await td.$$("div.cal-h-list-data > div.cal-item-box > a.cal-item");
                let isRemote = false;
                let isVacation = false;
                for(const aTag of aTags){
                    const title = await aTag.getAttribute('title');
                    // 休暇の場合はスキップ
                    if(title === DESKNETS_VACATION_TITLE){
                        isVacation = true;
                        break;
                    }
                    if(title === DESKNETS_REMOTE_TITLE){
                        isRemote = true;
                        break;
                    }
                }
                if(!isVacation && !isRemote){
                    const officeDate = formatDate(year, month, day);
                    if(!remoteDateSet.has(officeDate) && !vacationDateSet.has(officeDate)){
                        officeDateSet.add(officeDate);
                    }
                }else if(isRemote){
                    remoteDateSet.add(formatDate(year, month, day));
                }else if(isVacation){
                    vacationDateSet.add(formatDate(year, month, day));
                }
            }
        }
        const sortedOfficeDateList = Array.from(officeDateSet).sort();
        const sortedRemoteDateList = Array.from(remoteDateSet).sort();
        const sortedVacationDateList = Array.from(vacationDateSet).sort();
        console.log('==== 出社日集計完了 ====')
        console.log('sortedOfficeDateList:', sortedOfficeDateList);
        console.log('sortedRemoteDateList:', sortedRemoteDateList);
        console.log('sortedVacationDateList:', sortedVacationDateList);
        return [sortedOfficeDateList, sortedRemoteDateList, sortedVacationDateList];
    }catch(error){
        console.error('getOfficeDayFromDesknets Error:', error);
        throw error;
    }finally{
        console.log('==== getOfficeDayFromDesknets End ====');
    }
};

function extractYearMonth(dateString) {
    const regex = /(\d{4})年(\d{2})月/;
    const match = dateString.match(regex);
    const year = match[1];
    const month = match[2];
    return [year, month];
}

function formatDate(year, month, day) {
    return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
}

function extractDateRange(year, text) {
    const dateRangeRegex = /(\d{2}\/\d{2}) - ((\d{4}\/)?\d{2}\/\d{2})(.*)/;
    const match = text.match(dateRangeRegex);

    if (!match) {
        throw new Error("Invalid date range format");
    }

    const startDate = match[1];
    const endDate = match[2];

    const formattedStartDate = `${year}/${startDate.replace('/', '/')}`;
    const formattedEndDate = endDate.includes('/')
        ? `${endDate.length === 5 ? year + '/' : ''}${endDate.replace('/', '/')}`
        : `${year}/${endDate.replace('/', '/')}`;

    return [formattedStartDate, formattedEndDate];
}

function getDatesBetween(start, end) {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        dates.push(`${year}/${month}/${day}`);
    }

    return dates;
}
