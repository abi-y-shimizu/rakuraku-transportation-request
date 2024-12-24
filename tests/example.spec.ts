import { test } from "@playwright/test";
import { getOfficeDayFromDesknets } from "./getOfficeDayFromDesknets";
import { makeRakurakuRequest } from "./makeRakurakuRequest";
import { postErrorSlack, postSlack } from './postSlack';

test("desknetsから出社営業日を取得し楽々清算にて申請を一時保存, slack送信", async ({ page }) => {
    try{
        console.log('==== test start ====')
        test.setTimeout(600000);
        const result = await getOfficeDayFromDesknets({ page });
        const officeDates = result![0];
        await makeRakurakuRequest({ page }, officeDates);
        await postSlack(result);
    }catch(error){
        console.error('test Error:',error);
        await postErrorSlack(error);
    }finally{
        console.log('==== test end ====')
    }
});

// test("postErrorSlack test", async ({ page }) => {
//     try{
//         throw new Error('test error');
//     }catch(error){
//         await postErrorSlack(error);
//     }
// });

// test("rakuraku test", async ({ page }) => {
//     const officeDates = ['2024/12/01', '2024/12/02', '2024/12/03'];
//     await makeRakurakuRequest({ page }, officeDates);
// });
