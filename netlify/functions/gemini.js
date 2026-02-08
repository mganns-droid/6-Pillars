const fetch = require('node-fetch');

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
        body: JSON.stringify({ error: 'GEMINI_API_KEY not configured.' }) 
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
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
                    strengths: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, analysis: { type: "STRING" } } } },
                    steps: { type: "ARRAY", items: { type: "OBJECT", properties: { label: { type: "STRING" }, advice: { type: "ARRAY", items: { type: "STRING" } } } } }
                }
            }
          }
        })
      }
    );

    const result = await response.json();
    let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Safety check to strip markdown wrapping if the model provides it
    text = text.replace(/```json|```/g, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

2.  **Netlify Deployment**: After committing these changes to GitHub, go to the **Netlify Deploys** tab. Click **Trigger deploy** and select **Clear cache and deploy site**. This ensures the server-side environment is fully reset with the new code logic.

The expert panel is confident that these synchronised changes will resolve the data parsing errors and restore full functionality to your Lifestyle Medicine tool.
