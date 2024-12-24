import { test } from "@playwright/test";
import { getWorkDayFromDesknets } from "./getWorkDayFromDesknets";

test("desknetsから出社営業日を取得し楽々清算にて申請を一時保存", async ({ page }) => {
    test.setTimeout(600000);
    await getWorkDayFromDesknets({ page });
});
