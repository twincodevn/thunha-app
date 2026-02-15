
const fs = require('fs');

// Load env
let apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf-8');
        envFile.split('\n').forEach(line => {
            if (line.startsWith('GOOGLE_GENERATIVE_AI_API_KEY=')) {
                apiKey = line.split('=')[1].trim();
            }
        });
    } catch (e) {
        console.error("Could not load .env.local", e);
    }
}

async function listModels() {
    if (!apiKey) {
        console.error("No API Key found!");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("Fetching models from:", url.replace(apiKey, "HIDDEN_KEY"));

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else {
            console.log("✅ Available Models:");
            (data.models || []).forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

listModels();
