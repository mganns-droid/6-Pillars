/**
 * Netlify Function: gemini.js
 * Location: netlify/functions/gemini.js
 * Synchronised with Netlify Environment Variable: GEMINI_API_KEY
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
        body: JSON.stringify({ error: 'GEMINI_API_KEY not found in Netlify dashboard.' }) 
      };
    }

    // Standardise the data for the AI model
    const strengths = ratings.filter(r => r.value >= 7).map(r => `* ${r.label} (${r.value}/10)`).join('\n');
    const focusAreas = ratings.filter(r => r.value <= 5).map(r => `* ${r.label} (${r.value}/10)`).join('\n');

    const prompt = `Act as a professional health coach from Psych and Lifestyle. 
    Provide encouraging, motivating feedback in Australian English.
    
    MANDATORY STATEMENTS:
    1. Acknowledge that lifestyle change is a profound investment in future health.
    2. Advise that if unsure how to start, they should discuss these ideas with a health professional.
    
    USER DATA:
    Established Assets: ${strengths || "None yet identified."}
    Growth Areas: ${focusAreas || "None yet identified."}
    
    Return ONLY a JSON object with these exact keys: 
    "intro" (string), "strengths" (array of {label, analysis}), "steps" (array of {label, advice[]}).`;

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
    
    // Safety: Remove any markdown wrapping if the AI provides it
    feedbackText = feedbackText.replace(/```json|```/g, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: feedbackText
    };

  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error during analysis." }) };
  }
};
