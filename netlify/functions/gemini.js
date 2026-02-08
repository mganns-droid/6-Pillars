const fetch = require('node-fetch');

/**
 * Netlify Function: gemini.js
 * Location: netlify/functions/gemini.js
 * * Securely handles the communication with Google Gemini 1.5 Flash.
 */
exports.handler = async function(event, context) {
    // Security check: Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Access the API Key from Netlify Environment Variables
    // Ensure the key name in Netlify Dashboard is exactly: GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server Configuration Error: GEMINI_API_KEY is missing." })
        };
    }

    try {
        const { ratings } = JSON.parse(event.body);

        // Map the ratings into a readable format for the AI
        const strengthItems = ratings.filter(r => r.value >= 7).map(r => `* ${r.label} (Score: ${r.value}/10)`).join('\n');
        const focusItems = ratings.filter(r => r.value <= 5).map(r => `* ${r.label} (Score: ${r.value}/10)`).join('\n');

        const prompt = `Act as an encouraging and professional health coach from Psych and Lifestyle. 
        Provide positive, motivating feedback based on these wellbeing assessment results. 
        
        TONE: Warm, supportive, and formal. Use Australian English and spellings.
        MANDATORY: Acknowledge that lifestyle change can be challenging but is a profound investment in future health and wellbeing. 
        MANDATORY: State that if unsure how to start, please discuss these ideas with a health professional who can provide personalised assistance.
        
        USER DATA:
        Established Assets (High Scores): 
        ${strengthItems || "None identified yet."}
        
        Growth Opportunities (Lower Scores): 
        ${focusItems || "None identified yet."}

        PILLAR CONTEXT:
        - If 'Avoid Risks' is a growth area, mention that limiting alcohol significantly reduces community harm and avoiding tobacco protects long-term heart/lung health.
        
        Please provide the response in structured JSON format with these keys:
        {
            "intro": "A warm, 2-3 sentence opening statement.",
            "strengths": [{"label": "Pillar Name", "analysis": "Positive commentary."}],
            "steps": [{"label": "Pillar Name", "advice": ["Small actionable step 1", "Small actionable step 2"]}]
        }`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify(data) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Function Execution Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The server encountered an error processing the assessment." })
        };
    }
};
