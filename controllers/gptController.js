// const OpenAI = require('openai');
// const config = require('../config/gptConfig');
// const TrackerLog = require('../models/TrackerLog');
// const User = require('../models/User');

// const openai = new OpenAI({
//   apiKey: config.openaiApiKey
// });

// // @desc    Answer user health question
// // @route   POST /api/gpt/ask
// // @access  Private
// exports.answerQuestion = async (req, res, next) => {
//   try {
//     const { question } = req.body;

//     const user = await User.findById(req.user.id);
//     const logs = await TrackerLog.find({ user: req.user.id })
//       .sort({ date: -1 })
//       .limit(10)
//       .lean();

//     const prompt = `You are a menstrual health assistant. The user is a ${user.age}-year-old woman with an average cycle length of ${user.avgCycleLength} days. 
//     Here are her recent logs: ${JSON.stringify(logs)}.
//     She asks: "${question}"
//     Provide a helpful, evidence-based response in a friendly tone. If the question is unrelated to menstrual health, politely say you specialize in menstrual health.`;

//     const response = await openai.chat.completions.create({
//       model: config.modelName,
//       messages: [
//         { role: "system", content: "You are a helpful menstrual health assistant." },
//         { role: "user", content: prompt }
//       ],
//       temperature: config.temperature,
//       max_tokens: config.maxTokens
//     });

//     res.status(200).json({
//       success: true,
//       data: response.choices[0].message.content
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc    Get mood advice based on logs
// // @route   POST /api/gpt/mood-advice
// // @access  Private
// exports.getMoodAdvice = async (req, res, next) => {
//   try {
//     const logs = await TrackerLog.find({ user: req.user.id })
//       .sort({ date: -1 })
//       .limit(30)
//       .lean();

//     const user = await User.findById(req.user.id);

//     const prompt = `Analyze this user's mood patterns from their menstrual cycle logs. 
//     User age: ${user.age}, average cycle length: ${user.avgCycleLength} days.
//     Recent logs: ${JSON.stringify(logs)}
    
//     Provide:
//     1. Mood pattern observations
//     2. Potential hormonal connections
//     3. 3-5 practical coping strategies
//     4. When to consider professional help`;

//     const response = await openai.chat.completions.create({
//       model: config.modelName,
//       messages: [
//         { role: "system", content: "You are a menstrual health expert analyzing mood patterns." },
//         { role: "user", content: prompt }
//       ],
//       temperature: 0.5, // Lower temp for more factual analysis
//       max_tokens: config.maxTokens
//     });

//     res.status(200).json({
//       success: true,
//       data: response.choices[0].message.content
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc    Generate partner message
// // @route   POST /api/gpt/partner-message
// // @access  Private
// exports.generatePartnerMessage = async (req, res, next) => {
//   try {
//     const { partnerName, relationshipType } = req.body;
    
//     const user = await User.findById(req.user.id);
//     const logs = await TrackerLog.find({ user: req.user.id })
//       .sort({ date: -1 })
//       .limit(10)
//       .lean();

//     const prompt = `Create a thoughtful message for ${partnerName}, who is the user's ${relationshipType}. 
//     The user is currently on day ${calculateCycleDay(new Date(), user.lastPeriodStart, user.avgCycleLength)} of their cycle.
//     Recent symptoms/moods: ${logs.map(log => `${log.mood}, ${log.painLevel} pain`).join('; ')}
    
//     The message should:
//     1. Explain the user's current cycle phase
//     2. Gently communicate needs/sensitivities
//     3. Suggest 1-2 ways partner could support them
//     4. Keep tone warm and appreciative
//     5. Be under 200 words`;

//     const response = await openai.chat.completions.create({
//       model: config.modelName,
//       messages: [
//         { role: "system", content: "You help craft compassionate messages about menstrual health needs." },
//         { role: "user", content: prompt }
//       ],
//       temperature: 0.7,
//       max_tokens: 300
//     });

//     res.status(200).json({
//       success: true,
//       data: response.choices[0].message.content
//     });
//   } catch (err) {
//     next(err);
//   }
// };

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/gptConfig');
const TrackerLog = require('../models/TrackerLog');
const User = require('../models/User');
const calculateCycleDay = require('../utils/cycleUtils'); 

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: config.gemini.modelName });

const generateGeminiResponse = async (prompt) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// @desc    Answer user health question
// @route   POST /api/gpt/ask
// @access  Private
exports.answerQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;
    const user = await User.findById(req.user.id);
    const logs = await TrackerLog.find({ user: req.user.id }).sort({ date: -1 }).limit(10).lean();

    const prompt = `You are a menstrual health assistant. The user is a ${user.age}-year-old woman with an average cycle length of ${user.avgCycleLength} days. 
Here are her recent logs: ${JSON.stringify(logs)}.
She asks: "${question}"
Provide a helpful, evidence-based response in a friendly tone. If the question is unrelated to menstrual health, politely say you specialize in menstrual health.`;

    const content = await generateGeminiResponse(prompt);
    res.status(200).json({ success: true, data: content });
  } catch (err) {
    console.error('Gemini ask error:', err);
    next(err);
  }
};

// @desc    Get mood advice based on logs
// @route   POST /api/gpt/mood-advice
// @access  Private
exports.getMoodAdvice = async (req, res, next) => {
  try {
    const logs = await TrackerLog.find({ user: req.user.id }).sort({ date: -1 }).limit(30).lean();
    const user = await User.findById(req.user.id);

    const prompt = `Analyze this user's mood patterns from their menstrual cycle logs. 
User age: ${user.age}, average cycle length: ${user.avgCycleLength} days.
Recent logs: ${JSON.stringify(logs)}

Provide:
1. Mood pattern observations
2. Potential hormonal connections
3. 3-5 practical coping strategies
4. When to consider professional help`;

    const content = await generateGeminiResponse(prompt);
    res.status(200).json({ success: true, data: content });
  } catch (err) {
    console.error('Gemini mood advice error:', err);
    next(err);
  }
};

// @desc    Generate partner message
// @route   POST /api/gpt/partner-message
// @access  Private
exports.generatePartnerMessage = async (req, res, next) => {
  try {
    const { partnerName, relationshipType } = req.body;
    const user = await User.findById(req.user.id);
    const logs = await TrackerLog.find({ user: req.user.id }).sort({ date: -1 }).limit(10).lean();

    const currentCycleDay = calculateCycleDay(new Date(), user.lastPeriodStart, user.avgCycleLength);
    const moodSummary = logs.map(log => `${log.mood}, ${log.painLevel} pain`).join('; ');

    const prompt = `Create a thoughtful message for ${partnerName}, who is the user's ${relationshipType}. 
The user is currently on day ${currentCycleDay} of their cycle.
Recent symptoms/moods: ${moodSummary}

The message should:
1. Explain the user's current cycle phase
2. Gently communicate needs/sensitivities
3. Suggest 1-2 ways partner could support them
4. Keep tone warm and appreciative
5. Be under 200 words`;

    const content = await generateGeminiResponse(prompt);
    res.status(200).json({ success: true, data: content });
  } catch (err) {
    console.error('Gemini partner message error:', err);
    next(err);
  }
};
