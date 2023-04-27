const axios = require('axios');

const TelegramBot = require('node-telegram-bot-api');
const token = '6210752347:AAFfxP_uPLtbHa3g9MFjTH1Uji9KgYWIpGs';

const bot = new TelegramBot(token, { polling: true });

// функції, які будуть викликатись при натисненні на кнопки
function handleButton1(number, chatId) {
    // тут код, який буде виконуватись при натисненні на кнопку 1
    // наприклад, можна відправити відповідь на повідомлення
    generateStatsForTrader(number, chatId);
}

// обробник повідомлень, який викликається при отриманні команди /start
bot.onText(/\/start/, (msg) => {
    // об'єкт з параметрами кнопок
    const options = {
        reply_markup: {
            keyboard: [
                [{ text: '-天使之翼-' }],  // кнопка 1
                [{ text: 'mrwin68' }],     // кнопка 2
                [{ text: 'Renaixensa' }],  // кнопка 3
                [{ text: 'BAN_K' }],       // кнопка 4
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };

    // надсилаємо повідомлення з кнопками
    bot.sendMessage(msg.chat.id, 'Виберіть потрібну кнопку:', options);
});

// обробники натиснень на кнопки
bot.on('message', (msg) => {
    switch (msg.text) {
        case '-天使之翼-':
            handleButton1(0, msg.chat.id);
            return;
            break;
        case 'mrwin68':
            handleButton1(1, msg.chat.id);
            return;
            break;
        case 'Renaixensa':
            handleButton1(2, msg.chat.id);
            return;
            break;
        case 'BAN_K':
            handleButton1(3, msg.chat.id);
            return;
            break;
    }
})

const followers = [
    { name: '-天使之翼-', id: 'B2E1DDECC0572E86C195989D2B536D0C', posssitions: [], init: false},
    { name: 'mrwin68', id: '2154D02AD930F6C6E65C507DD73CB3E7', posssitions: [], init: false },
    { name: 'Renaixensa', id: '3EFA61BC63849632347ED020C78634E1', posssitions: [], init: false },
    { name: 'BAN_K', id: '4C7869A87B2D5825AA759D763DA7D3F7', posssitions: [], init: false },
];

function createReq(id) {
    const options = {
        method: 'POST',
        url: 'https://www.binance.com/bapi/futures/v1/public/future/leaderboard/getOtherPosition',
        data: {
            encryptedUid: id,
            tradeType: "PERPETUAL"
        }
    };
    return axios.request(options);
}

function getOrderDetails(order) {
    const symbol = order.symbol;
    const margin = order.amount * order.entryPrice / order.leverage;
    const pnl = order.pnl;
    const side = order.amount > 0 ? 'Long 🟢' : 'Short 🛑';
    const entryPrice = order.entryPrice;
    const leverage = order.leverage;
    return {
        symbol,
        margin,
        pnl,
        side,
        entryPrice,
        leverage,
    }
}

function generateStatsForTrader(number, chatId, show = true) {
    let follower = followers[number]
    createReq(follower.id).then(res => {
        let trader = {
            ...follower
        }
        trader.posssitions = [];
        res.data.data.otherPositionRetList.forEach(el => {
            trader.posssitions.push(getOrderDetails(el));
        })

        if (show) {
            let ms =
                `Трейдер: ${trader.name} `
            trader.posssitions.forEach(el => {

                ms +=
                    `\n----------\n
                \nМонета: ${el.symbol} 
                \nМаржа: ${el.margin} 
                \nPNL: ${el.pnl} 
                \nСторона позиції: ${el.side}
                \nВхідна ціна: ${el.entryPrice}
                \nПлече: ${el.leverage}`
            })
            bot.sendMessage(chatId, ms);
            return;
        }

        if(!follower.init) {
            follower.init = true;
            follower.posssitions = trader.posssitions;
            return;
        }

        console.log(JSON.stringify(trader));
        console.log(JSON.stringify(follower));
        console.log(JSON.stringify(trader) != JSON.stringify(follower));

        if (JSON.stringify(trader) != JSON.stringify(follower)) {
            checkObjects(follower.posssitions, trader.posssitions, follower.name);
            follower.posssitions = trader.posssitions;
        }
    })
}

function checkObjects(arr1, arr2, traiderName) {

    arr1.forEach((obj1) => {
        const obj2 = arr2.find((o) => o.symbol === obj1.symbol);

        if (!obj2) {
            bot.sendMessage('-1001916629002',`Сигнал 📊 \n
                \nЗакрив позицію ${obj1.symbol} - ${traiderName} \n\nPNL: ${obj1.pnl} `);
        } else if (!isEquivalent(obj1, obj2)) {
            bot.sendMessage('-1001916629002',`Сигнал 📊 \n
                \nЗмінилась позиція ${obj1.symbol} - ${traiderName}
                \nМаржа (було): ${obj1.margin} 
                \nPNL (було): ${obj1.pnl} 
                \nВхідна ціна (було): ${obj1.entryPrice}
                \nПлече (було): ${obj1.leverage}
                \nМаржа (стало): ${obj2.margin} 
                \nPNL (стало): ${obj2.pnl} 
                \nВхідна ціна (стало): ${obj2.entryPrice}
                \nПлече (стало): ${obj2.leverage}
            `);
        }
    });

    arr2.forEach((obj2) => {
        const obj1 = arr1.find((o) => o.symbol === obj2.symbol);

        if (!obj1) {
            bot.sendMessage('-1001916629002', `Сигнал 📊 \n
                \nВідкрив позицію ${obj2.symbol} - ${traiderName}
                \nМаржа: ${obj2.margin} 
                \nPNL: ${obj2.pnl} 
                \nСторона позиції: ${obj2.side}
                \nВхідна ціна: ${obj2.entryPrice}
                \nПлече: ${obj2.leverage}` );
        }
    });
}

function isEquivalent(obj1, obj2) {
    const props = ['margin', 'side', 'entryPrice', 'leverage'];

    for (let i = 0; i < props.length; i++) {
        const prop = props[i];

        if (obj1[prop] !== obj2[prop]) {
            return false;
        }
    }

    return true;
}



let i = 0;
setInterval(() => {
    if (i == 4) {
        i = 0;
    }
    generateStatsForTrader(i++, '-1001916629002', false);
}, 4000)


bot.sendMessage('-1001916629002',`Бот запущено`);
