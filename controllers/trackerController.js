const TrackerLog = require('../models/TrackerLog');
const User = require('../models/User');
const { calculateCycleDay, calculateNextPeriod } = require('../utils/cycleUtils');
const asyncHandler = require('../utils/asyncHandler');
const APIFeatures = require('../utils/apiFeatures');
const { validateTrackerLog } = require('../utils/validators');
const Partner = require('../models/Partner');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Period = require('../models/Period');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generatePartnerMessage = async (status, mood, painLevel, energyLevel) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Act like an emotionally intelligent and caring girlfriend who wants to update her male partner about her current health and emotional state in a loving, soft, and supportive way.

Here is the personal context:
- Period status: "${status}" (can be "on period", "not on period", "maybe", "approaching", or "none")
- Mood: "${mood}" (e.g., irritated, anxious, calm, sad, okay)
- Pain level: ${painLevel} out of 10
- Energy level: ${energyLevel} out of 10

Now, based on this data:
- Write a sweet, gentle, and emotionally open message to send to my partner
- The message should update him on how I’m feeling without sounding like a complaint
- It should express warmth, care, and perhaps a small request for support (like patience, check-ins, or emotional comfort)
- End on a loving or affectionate note

Make the tone soft, conversational, and human. Avoid anything robotic, overly formal, or dramatic.
  `;

  const result = await model.generateContent(prompt);
  const message = await result.response.text();
  return message;
};

const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
};


const sendMailToPartner = async (to, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
  from: `"HormonalTwin X" <${process.env.EMAIL_USER}>`,
  to: to,
  subject: subject,
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background-color: #ff6b81; color: white; padding: 16px 24px;">
          <h2 style="margin: 0;">A Note from HormonalTwin X 💌</h2>
        </div>
        <div style="padding: 24px; color: #333;">
          <p style="font-size: 16px; line-height: 1.6;">${message}</p>
        </div>
        <div style="background-color: #fafafa; padding: 16px 24px; text-align: center; font-size: 14px; color: #888;">
          You're receiving this because your partner cares for you 💖
        </div>
      </div>
    </div>
  `
});
;
};

// @desc    Get all tracker logs
// @route   GET /api/tracker
// @access  Private
exports.getLogs = asyncHandler(async (req, res, next) => {
  // 1. Get user's cycle information
  const user = await User.findById(req.user.id);
  
  // 2. Build query with advanced filtering/sorting
  const features = new APIFeatures(
    TrackerLog.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  // 3. Execute query
  const logs = await features.query;
  
  // 4. Add cycle day information to each log
  if (user.lastPeriodStart) {
    logs.forEach(log => {
      log._doc.cycleDay = calculateCycleDay(
        log.date,
        user.lastPeriodStart,
        user.avgCycleLength
      );
    });
  }

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get single tracker log
// @route   GET /api/tracker/:id
// @access  Private
exports.getLog = asyncHandler(async (req, res, next) => {
  const log = await TrackerLog.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!log) {
    return res.status(404).json({
      success: false,
      error: 'Log not found'
    });
  }

  // Add cycle day information if available
  const user = await User.findById(req.user.id);
  if (user.lastPeriodStart) {
    log._doc.cycleDay = calculateCycleDay(
      log.date,
      user.lastPeriodStart,
      user.avgCycleLength
    );
  }

  res.status(200).json({
    success: true,
    data: log
  });
});

// @desc    Create new tracker log
// @route   POST /api/tracker
// @access  Private
exports.createLog = asyncHandler(async (req, res, next) => {
  // const { errors, isValid } = validateTrackerLog(req.body);
  // if (!isValid) {
  //   return res.status(400).json({ success: false, errors });
  // }

  console.log('Creating log with data:', req.body);

  const existingLog = await TrackerLog.findOne({
    user: req.user.id,
    date: req.body.date
  });

  if (existingLog) {
    return res.status(400).json({
      success: false,
      error: 'Log already exists for this date'
    });
  }

  const log = await TrackerLog.create({
    ...req.body,
    user: req.user.id
  });

  if (req.body.periodStatus === 'start') {
    await User.findByIdAndUpdate(req.user.id, {
      lastPeriodStart: req.body.date,
      nextPeriodPredicted: calculateNextPeriod(req.body.date, req.user.avgCycleLength)
    });
    const endDate = addDays(req.body.date, 4);

    const newPeriod = new Period({
          userId: req.user.id,
          startDate: req.body.date,
          endDate : endDate,
          symptoms:  [],
          notes:''
        });
    
   await newPeriod.save();

  }

  if (req.body.periodStatus === 'end') {
    await User.findByIdAndUpdate(req.user.id, {
      lastPeriodEnd: req.body.date,
      nextPeriodPredicted: calculateNextPeriod(req.body.date, req.user.avgCycleLength)
    });
    const latestPeriod = await Period.findOne({ userId: req.user.id })
  .sort({ startDate: -1 });

  if (latestPeriod) {
    latestPeriod.endDate = req.body.date;
    await latestPeriod.save();
  }
}

  let partnerMessageInfo = null;

  if (
    req.body.periodStatus !== 'none' ||
    ['sad', 'anxious', 'angry'].includes(req.body.mood)
  ) {
    const partner = await Partner.findOne({ user: req.user.id });

    if (partner) {
      const message = await generatePartnerMessage(
        req.body.periodStatus,
        req.body.mood,
        req.body.painLevel,
        req.body.energyLevel
      );

      const formattedMessage = message
        .split('\n')
        .map(line => `<p style="margin: 0 0 10px 0;">${line.trim()}</p>`)
        .join('');

      await sendMailToPartner(
        partner.email,
        'A Note from Your Partner ❤️',
        formattedMessage
      );

      partnerMessageInfo = 'Message sent to partner';
    } else {
      partnerMessageInfo = 'No partner found';
    }
  }

  return res.status(201).json({
    success: true,
    data: log,
    message: partnerMessageInfo || 'No message needed'
  });
});


// @desc    Update tracker log
// @route   PUT /api/tracker/:id
// @access  Private
exports.updateLog = asyncHandler(async (req, res, next) => {
  // 1. Validate input
  const { errors, isValid } = validateTrackerLog(req.body);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  // 2. Find and verify log exists and belongs to user
  let log = await TrackerLog.findById(req.params.id);
  if (!log) {
    return res.status(404).json({
      success: false,
      error: 'Log not found'
    });
  }

  if (log.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to update this log'
    });
  }

  // 3. Check for date conflict if date is being changed
  if (req.body.date && req.body.date !== log.date) {
    const dateConflict = await TrackerLog.findOne({
      user: req.user.id,
      date: req.body.date
    });

    if (dateConflict) {
      return res.status(400).json({
        success: false,
        error: 'Log already exists for the new date'
      });
    }
  }

  // 4. Update log
  log = await TrackerLog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // 5. Update period start if period status changed to 'started'
  if (req.body.periodStatus === 'started') {
    await User.findByIdAndUpdate(
      req.user.id,
      { 
        lastPeriodStart: req.body.date,
        nextPeriodPredicted: calculateNextPeriod(
          req.body.date,
          req.user.avgCycleLength
        )
      },
      { new: true }
    );
  }

  res.status(200).json({
    success: true,
    data: log
  });
});

// @desc    Delete tracker log
// @route   DELETE /api/tracker/:id
// @access  Private
exports.deleteLog = asyncHandler(async (req, res, next) => {
  const log = await TrackerLog.findById(req.params.id);

  if (!log) {
    return res.status(404).json({
      success: false,
      error: 'Log not found'
    });
  }

  if (log.user.toString() !== req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to delete this log'
    });
  }

  await log.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get logs summary for current cycle
// @route   GET /api/tracker/summary
// @access  Private
exports.getCycleSummary = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.lastPeriodStart) {
    return res.status(400).json({
      success: false,
      error: 'No period start date recorded'
    });
  }

  // Get logs from current cycle
  const logs = await TrackerLog.find({
    user: req.user.id,
    date: { $gte: user.lastPeriodStart }
  }).sort('date');

  // Calculate summary stats
  const summary = {
    cycleDay: calculateCycleDay(
      new Date(),
      user.lastPeriodStart,
      user.avgCycleLength
    ),
    totalDays: logs.length,
    avgMood: calculateAverageMood(logs),
    avgPain: calculateAveragePain(logs),
    avgSleep: calculateAverageSleep(logs),
    symptomFrequency: calculateSymptomFrequency(logs),
    periodDays: logs.filter(l => l.flow !== 'none').length
  };

  res.status(200).json({
    success: true,
    data: summary
  });
});

// Helper functions
function calculateAverageMood(logs) {
  const moodValues = {
    'very-sad': 1,
    'sad': 2,
    'neutral': 3,
    'happy': 4,
    'very-happy': 5,
    'anxious': 2,
    'irritable': 2
  };

  const validLogs = logs.filter(l => l.mood);
  if (validLogs.length === 0) return null;

  const total = validLogs.reduce(
    (sum, log) => sum + moodValues[log.mood], 0
  );
  return (total / validLogs.length).toFixed(1);
}

function calculateAveragePain(logs) {
  const painValues = {
    'none': 0,
    'mild': 1,
    'moderate': 2,
    'severe': 3
  };

  const validLogs = logs.filter(l => l.painLevel);
  if (validLogs.length === 0) return null;

  const total = validLogs.reduce(
    (sum, log) => sum + painValues[log.painLevel], 0
  );
  return (total / validLogs.length).toFixed(1);
}

function calculateAverageSleep(logs) {
  const validLogs = logs.filter(l => l.sleepHours);
  if (validLogs.length === 0) return null;

  const total = validLogs.reduce(
    (sum, log) => sum + log.sleepHours, 0
  );
  return (total / validLogs.length).toFixed(1);
}

function calculateSymptomFrequency(logs) {
  const symptomCount = {};
  const totalDays = logs.length;

  logs.forEach(log => {
    if (log.symptoms && log.symptoms.length > 0) {
      log.symptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
      });
    }
  });

  // Convert counts to percentages
  const result = {};
  for (const [symptom, count] of Object.entries(symptomCount)) {
    result[symptom] = `${Math.round((count / totalDays) * 100)}%`;
  }

  return result;
}