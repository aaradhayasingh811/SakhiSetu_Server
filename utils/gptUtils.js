const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/gptConfig');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Format logs for Gemini prompt
exports.formatLogsForPrompt = (logs, user) => {
  return logs.map(log => ({
    date: log.date.toISOString().split('T')[0],
    cycleDay: calculateCycleDay(log.date, user.lastPeriodStart, user.avgCycleLength),
    mood: log.mood,
    painLevel: log.painLevel,
    flow: log.flow,
    symptoms: log.symptoms,
    notes: log.notes
  }));
};

// Generate Gemini response
exports.getGPTResponse = async (prompt, systemMessage = 'You are a helpful assistant.') => {
  try {
    const model = genAI.getGenerativeModel({ model: config.modelName });
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;

    return response.text();
  } catch (err) {
    console.error('Gemini API error:', err);
    throw err;
  }
};
