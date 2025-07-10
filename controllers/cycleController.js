const Cycle = require('../models/Cycle');
const Symptom = require('../models/Symptom');

// Get current cycle data
exports.getCurrentCycle = async (req, res) => {

  try {
    const userId = req.user.id;
    
    // Find the most recent cycle that's not completed
    const cycle = await Cycle.findOne({ 
      user: userId,
      completed: false 
    }).sort({ startDate: -1 });

    console.log(cycle)
    
    if (!cycle) {
      return res.status(404).json({ message: 'No active cycle found' });
    }
    
    // Calculate current day in cycle
    const today = new Date();
    const startDate = new Date(cycle.startDate);
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine phase (simplified logic)
    let phase;
    if (diffDays <= 7) phase = 'Menstruation';
    else if (diffDays <= 14) phase = 'Follicular';
    else if (diffDays <= 21) phase = 'Ovulation';
    else phase = 'Luteal';
    
    // Get symptoms for this cycle
    const symptoms = await Symptom.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);
    
    res.json({
      cycleDay: diffDays,
      phase,
      startDate: cycle.startDate,
      symptoms,
      predictions: cycle.predictions
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Log a new symptom
exports.logSymptom = async (req, res) => {
  try {
    const { type, severity, notes } = req.body;
    const userId = req.user.id;
    
    // Find or create symptom type
    let symptom = await Symptom.findOne({ user: userId, type });
    
    if (!symptom) {
      symptom = new Symptom({
        user: userId,
        type
      });
    }
    
    // Add new entry
    symptom.history.push({
      date: new Date(),
      severity,
      notes
    });
    
    await symptom.save();
    
    res.json(symptom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get hormone data for graph
exports.getHormoneData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real app, this would come from actual data or an algorithm
    // For demo, we'll return mock data
    const mockData = {
      estrogen: [10, 30, 50, 70, 90, 70, 50, 30].map((value, index) => ({
        day: index + 1,
        value
      })),
      progesterone: [5, 10, 20, 40, 60, 80, 60, 40].map((value, index) => ({
        day: index + 1,
        value
      }))
    };
    
    res.json(mockData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get symptom trends
exports.getSymptomTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all symptoms with their history
    const symptoms = await Symptom.find({ user: userId });
    
    // Aggregate data for common symptoms
    const commonSymptoms = ['Energy', 'Mood', 'Cramps', 'Sleep'];
    const trends = commonSymptoms.map(symptom => {
      const symptomData = symptoms.find(s => s.type === symptom);
      if (!symptomData) return { symptom, average: 3 };
      
      const avgSeverity = symptomData.history.reduce((sum, entry) => sum + entry.severity, 0) / symptomData.history.length;
      return { symptom, average: avgSeverity };
    });
    
    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};