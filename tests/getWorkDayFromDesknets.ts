import { expect } from "@playwright/test";

const DESKNETS_URL = process.env.DESKNETS_URL;
const DESKNETS_USER = process.env.DESKNETS_USER;
const DESKNETS_PASSWORD = process.env.DESKNETS_PASSWORD;
const DESKNETS_REMOTE_TITLE = process.env.DESKNETS_REMOTE_TITLE;


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

    }catch(error){
        console.error('getWorkDayFromDesknets Error:', error);
    }finally{
        console.log('==== getWorkDayFromDesknets End ====');
    }
};
