const fetch = require('node-fetch');

/**
 * Netlify Function: gemini.js
 * Location: netlify/functions/gemini.js
 * Securely communicates with Google Gemini 1.5 Flash using Netlify Environment Variables.
 */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { ratings } = JSON.parse(event.body);

    // Matches the 'Key' in your Netlify Environment Variables dashboard
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY not found.' }) 
      };
    }

    // Build assessment data for the AI
    const strengthItems = ratings.filter(r => r.value >= 7).map(r => `* ${r.label} (rated ${r.value}/10)`).join('\n');
    const focusItems = ratings.filter(r => r.value <= 5).map(r => `* ${r.label} (rated ${r.value}/10)`).join('\n');

    const prompt = `Act as an encouraging and professional health coach from Psych and Lifestyle. 
    Provide positive, motivating feedback based on these wellbeing assessment results. 
    
    TONE: Warm, supportive, and professional. Use Australian English and spellings.
    MANDATORY: Acknowledge that lifestyle change can be challenging but is a profound investment in future health and wellbeing. 
    MANDATORY: State that if unsure how to start, please discuss these ideas with a health professional who can provide personalised assistance.
    
    USER DATA:
    Established Assets (High Scores): 
    ${strengthItems || "None identified yet."}
    
    Growth Opportunities (Lower Scores): 
    ${focusItems || "None identified yet."}

    PILLAR CONTEXT:
    - If 'Avoid Risks' is a growth area, mention that choosing to limit alcohol significantly reduces community harm and avoiding tobacco protects long-term heart and lung health.
    
    Please provide the response in structured JSON format with these exact keys:
    {
        "intro": "string",
        "strengths": [{"label": "string", "analysis": "string"}],
        "steps": [{"label": "string", "advice": ["string"]}]
    }`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service communication failed' }) };
    }

    const result = await response.json();
    const feedbackText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: feedbackText })
    };

  } catch (error) {
    console.error('Execution Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
