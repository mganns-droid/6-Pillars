const fetch = require('node-fetch');

/**
 * Netlify Function: gemini.js
 * Location: netlify/functions/gemini.js
 */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { ratings } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'GEMINI_API_KEY not found in dashboard.' }) 
      };
    }

    const strengthItems = ratings.filter(r => r.value >= 7).map(r => `* ${r.label} (${r.value}/10)`).join('\n');
    const focusItems = ratings.filter(r => r.value <= 5).map(r => `* ${r.label} (${r.value}/10)`).join('\n');

    const prompt = `Act as an encouraging health coach from Psych and Lifestyle. Use Australian English.
    Provide a professional, motivating summary of these assessment results.
    
    MANDATORY STATEMENTS:
    1. Acknowledge that lifestyle change can be challenging but is a profound investment in future health.
    2. State that if unsure how to start, the user should discuss these ideas with a health professional.
    
    DATA:
    Established Assets: ${strengthItems || "None yet identified."}
    Growth Opportunities: ${focusItems || "None yet identified."}
    
    Return ONLY a JSON object with these keys: "intro", "strengths" (array of {label, analysis}), "steps" (array of {label, advice[]}).`;

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

    const result = await response.json();
    let feedbackText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Remove potential markdown code blocks to ensure clean JSON parsing
    feedbackText = feedbackText.replace(/```json|```/g, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: feedbackText 
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
