const fetch = require('node-fetch');

/**
 * Netlify Function: gemini.js
 * Verified Logic: Synchronised with GEMINI_API_KEY and lifestyle_map.html data requirements.
 */
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "System Configuration Error: GEMINI_API_KEY missing." })
            };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            intro: { type: "STRING" },
                            strengths: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        label: { type: "STRING" },
                                        analysis: { type: "STRING" }
                                    }
                                }
                            },
                            steps: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        label: { type: "STRING" },
                                        advice: { type: "ARRAY", items: { type: "STRING" } }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            return {
                statusCode: apiResponse.status,
                body: JSON.stringify({ error: result.error?.message || "AI communication failed." })
            };
        }

        const aiTextResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: aiTextResponse 
        };

    } catch (error) {
        console.error("Critical Execution Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The server encountered a logic error during synthesis." })
        };
    }
};
