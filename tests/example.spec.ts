import { test } from "@playwright/test";
import { getOfficeDayFromDesknets } from "./getOfficeDayFromDesknets";

test("desknetsから出社営業日を取得し楽々清算にて申請を一時保存", async ({ page }) => {
    try{
        console.log('==== test start ====')
        test.setTimeout(600000);
        const result = await getOfficeDayFromDesknets({ page });
        const officeDates = result![0];
        const remoteDates = result![1];
        const vacationDates = result![2];
        console.log('officeDates:', officeDates);
    }catch(error){
        console.error('test Error:',error);
    }finally{
        console.log('==== test end ====')
    }
});
