import { WebClient } from "@slack/web-api";


export async function postSlack( dateList ){
    /*
        slack通知
    */
    try{
        console.log('==== postSlack Start ====');

        let today = new Date();
        let formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}`;
        let blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":information_source: *" + formattedDate + " 交通費申請を一時保存しました。確認して申請してください。* :information_source:"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "出社日: " + dateList![0].join(",  ")
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "リモート日(非営業日含む): " + dateList![1].join(",  ")
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "休暇日(非営業日含む): " + dateList![2].join(", ")
                }
            }
        ];

        const chunkSize = 50;
        console.log(blocks);
        const client = new WebClient(process.env.SLACK_BOT_TOKEN as string)

        for (let i = 0; i < blocks.length; i += chunkSize) {
            const chunk = blocks.slice(i, i + chunkSize);
            await client.chat.postMessage({
              text: "交通費申請を一時保存しました。確認して申請してください。",
              channel: process.env.SLACK_CHANNEL as string,
              blocks: chunk
            })
        }

    }catch(error){
        console.error('postSlack Error:',error);
        throw error;
    }finally{
        console.log('==== postSlack End ====');
    }
}


export async function postErrorSlack( error ){
    /*
        slackエラー通知
    */
    try{
        console.log('==== postErrorSlack Start ====');

        let today = new Date();
        let formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        let blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":warning: *" + formattedDate + " rakuraku-transportation-request ERROR* :warning:"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": String(error.message)
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": String(error.stack)
                }
            }
        ];

        const chunkSize = 50;
        console.log(blocks);
        const client = new WebClient(process.env.SLACK_BOT_TOKEN as string)

        for (let i = 0; i < blocks.length; i += chunkSize) {
            const chunk = blocks.slice(i, i + chunkSize);
            await client.chat.postMessage({
              text: "rakuraku-transportation-request ERROR",
              channel: process.env.SLACK_CHANNEL as string,
              blocks: chunk
            })
        }

    }catch(error){
        console.error('postErrorSlack Error:',error);
        throw error;
    }finally{
        console.log('==== postErrorSlack End ====');
    }
}
