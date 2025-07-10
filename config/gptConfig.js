module.exports = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    modelName: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 2048
  },

  prompts: {
    symptomPrediction: `Analyze these menstrual cycle logs and predict likely symptoms for the next 3 days.
Consider patterns in mood, pain levels, and cycle timing.
Provide your analysis in this format:
- Most likely symptoms: [list]
- Recommended coping strategies: [list]
- When to seek medical advice: [text]`,

    moodAnalysis: `Identify patterns in these mood entries across menstrual cycles.
Highlight any recurring emotional patterns tied to cycle phases.
Provide insights in this format:
- Observed patterns: [text]
- Probable hormonal connections: [text]
- Self-care recommendations: [list]`
  }
};
