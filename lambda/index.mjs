import { getOfficeDayFromDesknets } from "./getOfficeDayFromDesknets.mjs";
import { makeRakurakuRequest } from "./makeRakurakuRequest.mjs";
import { postErrorSlack, postSlack } from './postSlack.mjs';

export const handler = async () => {
    try{
        console.log('==== test start ====')
        const result = await getOfficeDayFromDesknets();
        const officeDates = result[0];
        await makeRakurakuRequest(officeDates);
        await postSlack(result);
    }catch(error){
        console.error('test Error:',error);
        await postErrorSlack(error);
    }finally{
        console.log('==== test end ====')
    }
};
