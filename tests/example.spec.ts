import { test } from "@playwright/test";
import { getOfficeDayFromDesknets } from "./getOfficeDayFromDesknets";
import { makeRakurakuRequest } from "./makeRakurakuRequest";

test("desknetsから出社営業日を取得し楽々清算にて申請を一時保存", async ({ page }) => {
    try{
        console.log('==== test start ====')
        test.setTimeout(600000);
        const result = await getOfficeDayFromDesknets({ page });
        const officeDates = result![0];
        const remoteDates = result![1];
        const vacationDates = result![2];
        await makeRakurakuRequest({ page }, officeDates);
        // TODO: slack送信
    }catch(error){
        console.error('test Error:',error);
    }finally{
        console.log('==== test end ====')
    }
});

// test("rakuraku test", async ({ page }) => {
//     const officeDates = ['2024/12/01', '2024/12/02', '2024/12/03'];
//     await makeRakurakuRequest({ page }, officeDates);
// });
