const mineflayer = require('mineflayer');
const http = require('http');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;

// Web Health Server for Monitoring/Uptime (GitHub Actions বা হোস্টিংয়ের জন্য)
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Companion Bot is Active\n');
});
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[System] Monitor server bound on port ${PORT}`);
});

// Bot Configuration (এখানে তোমার Falix সার্ভারের সঠিক IP এবং Port বসিয়ে দাও)
const botOptions = {
    host: 168.119.78.155', // উদাহরণ: 's1.falix.gg' বা সরাসরি আইপি
    port: 27089,                  // তোমার Falix সার্ভারের পোর্ট নম্বর
    username: 'Alex_Companion',   // বটের নাম
    version: '1.20.4',            // সার্ভারের ভার্সন (সার্ভারের সাথে মিল থাকতে হবে)
    auth: 'offline'               // ক্র্যাকড সার্ভারের জন্য অত্যন্ত জরুরি
};

let bot = null;

function createCompanion() {
    console.log(`[Connecting] Attempting to connect to ${botOptions.host}:${botOptions.port} as ${botOptions.username}...`);
    
    bot = mineflayer.createBot(botOptions);

    // Pathfinder Plugin লোড করা
    bot.loadPlugin(pathfinder);

    bot.on('spawn', () => {
        console.log(`[Game Success] ${bot.username} has successfully spawned in the world! 🎉`);
        
        // হাঁটাচলার সাধারণ কনফিগারেশন
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);
    });

    // ইন-গেম চ্যাট কমান্ড প্রসেস করা
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;

        const cmd = message.toLowerCase().trim();
        const playerEntity = bot.players[username]?.entity;

        // অনুসরণ করা (Follow Command)
        if (cmd.includes('follow') || cmd.includes('আসো') || cmd.includes('আমার সাথে আসো')) {
            if (!playerEntity) {
                bot.chat(`আমি তোমাকে দেখতে পাচ্ছি না ${username}! একটু কাছে আসো।`);
                return;
            }
            bot.chat(`ঠিক আছে ${username}, আমি আসছি!`);
            bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true);
        }

        // থেমে যাওয়া (Stop Command)
        if (cmd.includes('stop') || cmd.includes('থামো') || cmd.includes('দাঁড়াও')) {
            bot.chat('ঠিক আছে, আমি এখানে দাঁড়াচ্ছি।');
            bot.pathfinder.setGoal(null);
        }
    });

    // এরর ও রিকানেক্ট হ্যান্ডলিং
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
