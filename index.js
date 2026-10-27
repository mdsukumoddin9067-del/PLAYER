const mineflayer = require('mineflayer');
const http = require('http');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Companion Bot is Active\n');
});
server.listen(PORT, '0.0.0.0');

const botOptions = {
    host: '168.119.78.155',
    port: 23957,               // তোমার Falix পোর্ট
    username: 'GeminiBot_V2',   // আগের নাম বদল করে নতুন নাম দিলাম (Double login এড়াতে)
    version: '1.21.3',          // সার্ভারের ভার্সন
    auth: 'offline'
};

let bot = null;

function createCompanion() {
    console.log(`[Connecting] Attempting to connect to ${botOptions.host}:${botOptions.port} as ${botOptions.username}...`);
    
    bot = mineflayer.createBot(botOptions);
    bot.loadPlugin(pathfinder);

    bot.on('spawn', () => {
        console.log(`[Game Success] ${bot.username} has successfully spawned in the world! 🎉`);
        
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);

        // **Anti-AFK Fix:** প্রতি ৩০ সেকেন্ড পর পর বট একটু লাফাবে বা মাথা ঘুরাবে, যাতে আইডল কিক না খায়
        setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
                // ডানে একটু তাকাবে
                bot.look(bot.entity.yaw + 0.5, bot.entity.pitch, true);
            }
        }, 30000);
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;

        const cmd = message.toLowerCase().trim();
        const playerEntity = bot.players[username]?.entity;

        if (cmd.includes('follow') || cmd.includes('আসো')) {
            if (!playerEntity) {
                bot.chat(`আমি দেখতে পাচ্ছি না ${username}!`);
                return;
            }
            bot.chat(`আসছি ${username}!`);
            bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true);
        }

        if (cmd.includes('stop') || cmd.includes('থামো')) {
            bot.chat('দাঁড়িয়ে গেলাম।');
            bot.pathfinder.setGoal(null);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`[Kicked by Server]:`, reason);
    });

    bot.on('error', (err) => {
        console.error('[Bot Error]:', err.message);
    });
    
    bot.on('end', (reason) => {
        console.log(`[Disconnected]: ${reason}. Reconnecting in 10s...`);
        setTimeout(() => {
            createCompanion();
        }, 10000);
    });
}

createCompanion();
