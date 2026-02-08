// netlify/functions/ai-feedback.js

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { ratings } = JSON.parse(event.body);

    // Validate input
    if (!ratings || !Array.isArray(ratings)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid ratings data' }) };
    }

    // Get API key from Netlify environment variables
    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    // Build the prompt for the AI
    const strengthItems = ratings.filter(r => r.value >= 7).map(r => `* ${r.id} (rated ${r.value}/10)`).join('\n');
    const focusItems = ratings.filter(r => r.value <= 5).map(r => `* ${r.id} (rated ${r.value}/10)`).join('\n');

    const prompt = `You are a compassionate and encouraging Australian lifestyle medicine coach. A user has reflected on their wellbeing across 8 lifestyle pillars. Your task is to provide balanced, positive, and actionable feedback.

**User's Self-Assessment:**
${strengthItems ? `**Strengths (rated 7 or higher):**\n${strengthItems}\n` : ''}
${focusItems ? `**Focus Areas (rated 5 or lower):**\n${focusItems}\n` : ''}

**Your Response:**
1. Start with an encouraging introduction (2-3 sentences).
2. Acknowledge their strengths with specific praise.
3. For each focus area, provide 2-3 small, actionable first steps.
4. Keep a warm, supportive, and professional tone.
5. End by suggesting they consult a health professional if needed.

Format your response in clear sections with headers. Be specific and practical.`;

    // Call Google AI API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google AI API error:', errorData);
      return { statusCode: 500, body: JSON.stringify({ error: 'AI service failed' }) };
    }

    const result = await response.json();
    const feedback = result.candidates?.?.content?.parts?.?.text || 'No response from AI';

    return {
      statusCode: 200,
      body: JSON.stringify({ feedback })
    };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
