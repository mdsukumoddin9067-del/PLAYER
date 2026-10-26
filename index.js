const mineflayer = require('mineflayer');
const http = require('http');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;

// Web Health Server for Monitoring/Uptime
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Companion Bot is Active\n');
});
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[System] Monitor server bound on port ${PORT}`);
});

// Bot Configuration (তোমার Falix সার্ভারের সঠিক তথ্য)
const botOptions = {
    host: '157.90.205.62',    // সার্ভার আইপি (কোটেশনের ভেতর রাখা হয়েছে)
    port: 22128,               // তোমার Falix সার্ভার পোর্ট (প্রয়োজনে পরিবর্তন করে নিও)
    username: 'Alex_Companion',// বটের নাম
    version: '26.3',         // সার্ভারের ভার্সন
    auth: 'offline'            // ক্র্যাকড সার্ভারের জন্য
};

let bot = null;

function createCompanion() {
    console.log(`[Connecting] Attempting to connect to ${botOptions.host}:${botOptions.port} as ${botOptions.username}...`);
    
    bot = mineflayer.createBot(botOptions);

    // Pathfinder Plugin লোড করা
    bot.loadPlugin(pathfinder);

    bot.on('spawn', () => {
        console.log(`[Game Success] ${bot.username} has successfully spawned in the world! 🎉`);
        
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);
    });

    // ইন-গেম চ্যাট কমান্ড প্রসেস করা
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;

        const cmd = message.toLowerCase().trim();
        const playerEntity = bot.players[username]?.entity;

        if (cmd.includes('follow') || cmd.includes('আসো') || cmd.includes('আমার সাথে আসো')) {
            if (!playerEntity) {
                bot.chat(`আমি তোমাকে দেখতে পাচ্ছি না ${username}! একটু কাছে আসো।`);
                return;
            }
            bot.chat(`ঠিক আছে ${username}, আমি আসছি!`);
            bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true);
        }

        if (cmd.includes('stop') || cmd.includes('থামো') || cmd.includes('দাঁড়াও')) {
            bot.chat('ঠিক আছে, আমি এখানে দাঁড়াচ্ছি।');
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
