/**
 * Netlify Function: gemini.js
 * Verified logic using Native Fetch (Node 18+) and lower-case Schema types.
 * Synchronised with Psych and Lifestyle assessment requirements.
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
                body: JSON.stringify({ error: "GEMINI_API_KEY missing from Netlify environment." })
            };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // Utilising native fetch for improved runtime stability
        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            intro: { type: "string" },
                            strengths: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        label: { type: "string" },
                                        analysis: { type: "string" }
                                    }
                                }
                            },
                            steps: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        label: { type: "string" },
                                        advice: { type: "array", items: { type: "string" } }
                                    }
                                }
                            }
                        },
                        required: ["intro", "strengths", "steps"]
                    }
                }
            })
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("Gemini API Error:", result);
            return {
                statusCode: apiResponse.status,
                body: JSON.stringify({ error: result.error?.message || "AI API Error" })
            };
        }

        const aiTextResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: aiTextResponse 
        };

    } catch (error) {
        console.error("Critical Function Crash:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The server encountered an error during synthesis." })
        };
    }
};
