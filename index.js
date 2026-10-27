const mineflayer = require('mineflayer');
const http = require('http');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
// জেমিনি এআই লাইব্রেরি আমদানি করা
const { GoogleGenAI } = require('@google/genai');

// জেমিনি ক্লায়েন্ট ইনিশিয়ালাইজ করা (GitHub Secrets থেকে GEMINI_API_KEY নিজে থেকেই রিড করবে)
const ai = new GoogleGenAI();

// Web Health Server for Monitoring/Uptime
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AI Companion Bot is Active\n');
});
server.listen(PORT, '0.0.0.0');

const botOptions = {
    host: '168.119.78.155',
    port: 23957,               
    username: 'GeminiBot_V2',   
    version: '1.21.3',          
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

        // Anti-AFK Fix
        setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
                bot.look(bot.entity.yaw + 0.5, bot.entity.pitch, true);
            }
        }, 30000);
    });

    // ইন-গেম চ্যাট এবং জেমিনি এআই ব্রেন হ্যান্ডলিং
    bot.on('chat', async (username, message) => {
        if (username === bot.username) return;

        const cmd = message.toLowerCase().trim();
        const playerEntity = bot.players[username]?.entity;

        // পাথফাইন্ডার কমান্ডগুলো আগে থেকেই ফিক্স করে রাখছি (যাতে চলাফেরা করতে পারে)
        if (cmd.includes('follow') || cmd.includes('আসো')) {
            if (!playerEntity) {
                bot.chat(`আমি দেখতে পাচ্ছি না ${username}!`);
                return;
            }
            bot.chat(`আসছি ${username}!`);
            bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true);
            return;
        }

        if (cmd.includes('stop') || cmd.includes('থামো')) {
            bot.chat('দাঁড়িয়ে গেলাম।');
            bot.pathfinder.setGoal(null);
            return;
        }

        // বাকি যেকোনো কথা জেমিনি এআই-এর ব্রেনে পাঠিয়ে তার উত্তর গেমে চ্যাট করা
        try {
            console.log(`[AI Prompt from ${username}]: ${message}`);
            
            // জেমিনি মডেলকে একটি মাইনক্রাফট কমপ্যানিয়নের চরিত্র দেওয়া হচ্ছে
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // ফাস্ট এবং সেরা রেসপন্সের জন্য
                contents: [
                    {
                        role: 'user',
                        parts: [{
                            text: `You are an AI player companion inside Minecraft named GeminiBot_V2. A player named ${username} said to you: "${message}". Reply naturally, friendly, and briefly in Bengali or English (matching the user's language) as a helpful Minecraft friend. Keep the response under 15 words so it fits well in game chat.`
                        }]
                    }
                ]
            });

            const replyText = response.text ? response.text.trim() : "আমি বুঝতে পারিনি!";
            // মাইনক্রাফট ইন-গেম চ্যাটে মেসেজ পাঠানো
            bot.chat(replyText);
            console.log(`[AI Reply]: ${replyText}`);

        } catch (error) {
            console.error('[Gemini AI Error]:', error);
            bot.chat('আমার ব্রেন একটু কাজ করছে না বন্ধু!');
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
