// controllers/dashboardController.js
const TrackerLog = require('../models/TrackerLog');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { calculateCycleDay } = require('../utils/cycleUtils');

// @desc    Get current cycle information
// @route   GET /api/cycles/current
// @access  Private
exports.getCurrentCycle = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.lastPeriodStart) {
    return res.status(200).json({
      cycleDay: 1,
      phase: 'Unknown',
      symptoms: [],
      predictions: []
    });
  }

  // Calculate current cycle day
  const cycleDay = calculateCycleDay(
    new Date(),
    user.lastPeriodStart,
    user.avgCycleLength
  );

  // Determine cycle phase based on day
  let phase;
  if (cycleDay <= 5) {
    phase = 'Menstruation';
  } else if (cycleDay <= 13) {
    phase = 'Follicular';
  } else if (cycleDay <= 16) {
    phase = 'Ovulation';
  } else {
    phase = 'Luteal';
  }

  // Get recent symptoms
  const symptoms = await TrackerLog.find({
    user: req.user.id,
    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
  .sort({ date: -1 })
  .select('symptoms notes date')
  .limit(5);

  // Generate simple predictions based on phase
  const predictions = generatePhasePredictions(phase, cycleDay);

  res.status(200).json({
    cycleDay,
    phase,
    symptoms,
    predictions
  });
});

// @desc    Get hormone data
// @route   GET /api/cycles/hormones
// @access  Private
exports.getHormoneData = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.lastPeriodStart) {
    return res.status(200).json({
      estrogen: Array(8).fill({ value: 0 }),
      progesterone: Array(8).fill({ value: 0 })
    });
  }

  const cycleDay = calculateCycleDay(
    new Date(),
    user.lastPeriodStart,
    user.avgCycleLength
  );

  // Generate simulated hormone data based on cycle day
  const hormoneData = simulateHormoneLevels(cycleDay, user.avgCycleLength);

  res.status(200).json(hormoneData);
});

// @desc    Get symptom trends
// @route   GET /api/cycles/trends
// @access  Private
exports.getSymptomTrends = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Get logs from last 3 cycles
  const threeCyclesAgo = new Date();
  threeCyclesAgo.setDate(threeCyclesAgo.getDate() - (user.avgCycleLength * 3));
  
  const logs = await TrackerLog.find({
    user: req.user.id,
    date: { $gte: threeCyclesAgo }
  });

  // Calculate average symptom severity
  const symptomAverages = calculateSymptomAverages(logs);

  res.status(200).json(symptomAverages);
});

// Helper functions
function generatePhasePredictions(phase, day) {
  const predictions = [];
  
  switch(phase) {
    case 'Menstruation':
      predictions.push({
        type: 'energy',
        prediction: 'You might experience lower energy levels during this phase. Consider lighter exercises like yoga or walking.'
      });
      if (day > 3) {
        predictions.push({
          type: 'mood',
          prediction: 'Your mood may start to improve as menstruation ends.'
        });
      }
      break;
      
    case 'Follicular':
      predictions.push({
        type: 'energy',
        prediction: 'Energy levels typically rise during this phase. Great time for more intense workouts!'
      });
      break;
      
    case 'Ovulation':
      predictions.push({
        type: 'libido',
        prediction: 'Libido is often highest around ovulation. Your body is most fertile now.'
      });
      break;
      
    case 'Luteal':
      predictions.push({
        type: 'mood',
        prediction: 'You might experience PMS symptoms like mood swings or bloating in this phase.'
      });
      if (day > 25) {
        predictions.push({
          type: 'period',
          prediction: 'Your period is likely to start soon. Consider preparing accordingly.'
        });
      }
      break;
  }
  
  return predictions;
}

function simulateHormoneLevels(day, cycleLength) {
  const estrogen = [];
  const progesterone = [];
  
  // Simulate data points for 8 days around current day
  for (let i = -3; i <= 4; i++) {
    const currentDay = day + i;
    
    // Estrogen simulation
    let estValue;
    if (currentDay <= 5) {
      estValue = 20 + Math.random() * 10;
    } else if (currentDay <= 13) {
      estValue = 30 + (currentDay - 5) * 8 + Math.random() * 15;
    } else if (currentDay <= 16) {
      estValue = 100 + Math.random() * 30;
    } else {
      estValue = 60 - (currentDay - 16) * 3 + Math.random() * 10;
    }
    
    // Progesterone simulation
    let progValue;
    if (currentDay <= 14) {
      progValue = 1 + Math.random() * 2;
    } else {
      progValue = 10 + (currentDay - 14) * 3 + Math.random() * 5;
      if (currentDay > 25) progValue -= (currentDay - 25) * 4;
    }
    
    estrogen.push({ 
      day: currentDay,
      value: Math.max(0, estValue)
    });
    
    progesterone.push({
      day: currentDay,
      value: Math.max(0, progValue)
    });
  }
  
  return { estrogen, progesterone };
}

function calculateSymptomAverages(logs) {
  const symptomMap = {
    'headache': [],
    'bloating': [],
    'cramps': [],
    'tender-breasts': [],
    'acne': [],
    'fatigue': [],
    'back-pain': [],
    'mood-swings': []
  };
  
  // Group symptoms by type
  logs.forEach(log => {
    if (log.symptoms && log.symptoms.length > 0) {
      log.symptoms.forEach(symptom => {
        if (symptomMap[symptom]) {
          // Use painLevel as proxy for symptom severity
          symptomMap[symptom].push(log.painLevel || 3);
        }
      });
    }
  });
  
  // Calculate averages
  const averages = [];
  for (const [symptom, values] of Object.entries(symptomMap)) {
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      averages.push({
        symptom: symptom.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' '),
        average: parseFloat(avg.toFixed(1))
      });
    }
  }
  
  // Sort by most frequent
  averages.sort((a, b) => b.average - a.average);
  
  // Ensure we always return at least the main symptoms
  const defaultSymptoms = ['Energy', 'Mood', 'Cramps', 'Sleep'];
  defaultSymptoms.forEach(symptom => {
    if (!averages.some(s => s.symptom === symptom)) {
      averages.push({
        symptom,
        average: (Math.random() * 2 + 2).toFixed(1)
      });
    }
  });
  
  return averages.slice(0, 4); // Return top 4 symptoms
}