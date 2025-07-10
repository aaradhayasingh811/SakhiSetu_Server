const axios = require("axios");
const TrackerLog = require("../models/TrackerLog");
const User = require("../models/User");
const Period = require("../models/Period");

// ML server URL from environment variables
const ML_SERVER_URL = process.env.ML_SERVER_URL;
// @desc    Predict symptoms based on cycle day
// @route   POST /api/prediction/symptoms
// @access  Private
exports.predictSymptoms = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const logs = await TrackerLog.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Prepare data for ML model
    const mlData = {
      age: user.age,
      avg_cycle_length: user.avgCycleLength,
      last_period_start: user.lastPeriodStart,
      logs: logs.map((log) => ({
        cycle_day: calculateCycleDay(
          log.date,
          user.lastPeriodStart,
          user.avgCycleLength
        ),
        mood: log.mood,
        pain_level: log.painLevel,
        flow: log.flow,
        symptoms: log.symptoms,
      })),
    };

    // Call ML server
    const response = await axios.post(
      `${ML_SERVER_URL}/predict-symptoms`,
      mlData
    );

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get hormone estimates for specific day
// @route   GET /api/prediction/hormones
// @access  Private
exports.estimateHormones = async (req, res, next) => {
  try {
    const { currentDay } = req.body;
    console.log(currentDay);

    const user = await User.findById(req.user.id);

    console.log("User age:", user.age);

    if (!currentDay || isNaN(currentDay)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid day number",
      });
    }
    const periods = await Period.find({ userId: req.user.id })
      .sort({ startDate: 1 })
      .lean();

    // Calculate cycle statistics
    let averageCycleLength = 28;
    let isRegular = false;

    if (periods.length >= 2) {
      const cycleLengths = [];
      for (let i = 1; i < periods.length; i++) {
        const prevDate = new Date(periods[i - 1].startDate);
        const currentDate = new Date(periods[i].startDate);
        const diffDays = Math.round(
          (currentDate - prevDate) / (1000 * 60 * 60 * 24)
        );
        cycleLengths.push(diffDays);
      }

      averageCycleLength =
        cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
      const cycleVariance = cycleLengths.map((days) =>
        Math.abs(days - averageCycleLength)
      );
      isRegular = cycleVariance.every((variance) => variance <= 7);
    }

    // Call ML server
    const response = await axios.get(`${ML_SERVER_URL}/hormones/estimate`, {
      params: {
        age: user.age,
        avg_cycle_length: parseInt(averageCycleLength),
        day: parseInt(currentDay),
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check for PCOS risk
// @route   POST /api/prediction/pcos-check
// @access  Private
exports.checkPCOS = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const periods = await Period.find({ userId: req.user.id })
      .sort({ startDate: 1 })
      .lean();

    // Calculate cycle statistics
    let averageCycleLength = 28;
    let isRegular = false;

    if (periods.length >= 2) {
      const cycleLengths = [];
      for (let i = 1; i < periods.length; i++) {
        const prevDate = new Date(periods[i - 1].startDate);
        const currentDate = new Date(periods[i].startDate);
        const diffDays = Math.round(
          (currentDate - prevDate) / (1000 * 60 * 60 * 24)
        );
        cycleLengths.push(diffDays);
      }

      averageCycleLength =
        cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
      const cycleVariance = cycleLengths.map((days) =>
        Math.abs(days - averageCycleLength)
      );
      isRegular = cycleVariance.every((variance) => variance <= 7);
    }

    // Prepare data for ML model matching frontend requirements
    const mlData = {
      " Age (yrs)": parseFloat(req.body.age || user.age),
      "Cycle(R/I)": req.body.isRegular,
      "Cycle length(days)": parseFloat(
        req.body.cycleLength || averageCycleLength
      ),
      BMI: parseFloat(req.body.BMI),
      "Weight gain(Y/N)": req.body.weightGain,
      "hair growth(Y/N)": req.body.hairGrowth,
      "Pimples(Y/N)": req.body.pimples,
      "Hair loss(Y/N)": req.body.hairLoss,
      "Skin darkening (Y/N)": req.body.skinDarkening,
      "Fast food (Y/N)": req.body.fastFood,
      "Reg.Exercise(Y/N)": req.body.exercise,
    };

    const data = {
      age: req.body.age,
      cycle_regularity: req.body.isRegular,
      cycle_length: req.body.cycleLength,
      bmi: parseFloat(req.body.BMI),
      weight_gain: req.body.weightGain,
      hair_growth: req.body.hairGrowth,
      pimples: req.body.pimples,
      hair_loss: req.body.hairLoss,
      skin_darkening: req.body.skinDarkening,
      fast_food: req.body.fastFood,
      exercise: req.body.exercise,
    };
    console.log(data);

    // Call ML server
    const response = await axios.post(
      `${process.env.ML_SERVER_URL}/predict`,
      data
    );

    // Format response for frontend
    res.status(200).json({
      success: true,
      data: {
        risk_level: response.data.risk_level.toLowerCase(),
        message:
          response.data.message ||
          this.getDefaultMessage(response.data.risk_level),
        show_doctor: response.data.risk_level.toLowerCase() === "high",
      },
    });
  } catch (err) {
    console.error("PCOS prediction error:", err);
    next(err);
  }
};

// Helper function to generate default messages based on risk level
exports.getDefaultMessage = (riskLevel) => {
  const messages = {
    high: "You have a high risk of PCOS. We recommend consulting with a healthcare provider for proper diagnosis and management.",
    medium:
      "You show some signs of PCOS risk. Consider lifestyle changes and monitoring your symptoms.",
    low: "Your PCOS risk appears low. Maintain healthy habits and monitor any changes in your cycle.",
  };
  return messages[riskLevel.toLowerCase()] || "PCOS risk assessment completed.";
};

// exports.predictCycle = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     const periods = await Period.find({ userId: req.user.id })
//       .sort({ endDate: -1 })
//       .lean();
//     console.log(periods)
//     // Calculate cycle statistics
//     let averageCycleLength = 28;
//     let isRegular = false;

//     if (periods.length >= 2) {
//       const cycleLengths = [];
//       for (let i = 1; i < periods.length; i++) {
//         const prevDate = new Date(periods[i - 1].startDate);
//         const currentDate = new Date(periods[i].startDate);
//         const diffDays = Math.round(
//           (currentDate - prevDate) / (1000 * 60 * 60 * 24)
//         );
//         cycleLengths.push(diffDays);
//       }

//       averageCycleLength =
//         cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
//       const cycleVariance = cycleLengths.map((days) =>
//         Math.abs(days - averageCycleLength)
//       );
//       isRegular = cycleVariance.every((variance) => variance <= 7);
//     }
//     console.log(periods[0].startDate)
//     const SD = new Date(periods[0].startDate);
//     const startOfYear = new Date(SD.getFullYear(), 0, 0);
//     const diffInMs = SD - startOfYear;
//     const oneDayMs = 1000 * 60 * 60 * 24;

//     const start_day_of_year = Math.floor(diffInMs / oneDayMs);
//     console.log(startOfYear , "start")

//     const inputData = {
//       age: user.age,
//       cycle_number: 6,
//       avg_cycle_length: averageCycleLength,
//       prev_cycle_length: periods[0].startDate - periods[1].startDate + 1,
//       cycle_var: 1.2,
//       start_day_of_year: start_day_of_year,
//       days_since_last_cycle: Math.round(
//         (new Date() - new Date(periods[0].startDate)) / (1000 * 60 * 60 * 24)
//       ),
//       last_cycle_date: new Date(periods[0].startDate)
//         .toISOString()
//         .split("T")[0],
//     };

//     console.log("Input data for prediction:", inputData);

//     // Call your Python FastAPI endpoint
//     const response = await axios.post(
//       `${process.env.ML_SERVER_URL}/cycles/predict-next-cycle`,
//       inputData
//     );

//     if (response.data && response.data.prediction) {
//       return res.status(200).json({
//         success: true,
//         prediction: response.data.prediction,
//       });
//     } else {
//       return res
//         .status(500)
//         .json({ success: false, error: "Unexpected response from ML model" });
//     }
//   } catch (error) {
//     console.error("Prediction error:", error.message);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// };


exports.predictCycle = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const periods = await Period.find({ userId: req.user.id })
      .sort({ endDate: -1 })
      .lean();

    if (periods.length < 2) {
      return res.status(400).json({
        success: false,
        error: "At least 2 periods are required for prediction.",
      });
    }

    const cycleLengths = [];
    for (let i = 1; i < periods.length; i++) {
      const prevDate = new Date(periods[i - 1].startDate);
      const currentDate = new Date(periods[i].startDate);
      const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      cycleLengths.push(diffDays);
    }

    const averageCycleLength =
      cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;

    const cycleVariance = cycleLengths.map((days) =>
      Math.abs(days - averageCycleLength)
    );

    const SD = new Date(periods[0].startDate);
    const startOfYear = new Date(SD.getFullYear(), 0, 0);
    const diffInMs = SD - startOfYear;
    const oneDayMs = 1000 * 60 * 60 * 24;
    const start_day_of_year = Math.floor(diffInMs / oneDayMs);

    const prev_cycle_length = Math.round(
      (new Date(periods[0].startDate) - new Date(periods[1].startDate)) / oneDayMs
    );

    const inputData = {
      age: user.age,
      cycle_number: periods.length,
      cycle_length: -averageCycleLength,
      prev_cycle_length: prev_cycle_length,
      cycle_var:
        cycleVariance.length > 1
          ? Math.sqrt(
              cycleVariance.reduce((a, b) => a + b ** 2, 0) / cycleVariance.length
            )
          : 0,
      start_day_of_year,
      days_since_last_cycle: Math.round(
        (new Date() - new Date(periods[0].startDate)) / oneDayMs
      ),
      last_cycle_date: new Date(periods[0].startDate).toISOString().split("T")[0],
    };

    console.log(inputData)

    const response = await axios.post(
      `${process.env.ML_SERVER_URL}/cycles/predict-next-cycle`,
      inputData
    );

    if (response.data && response.data.predicted_date) {
      return res.status(200).json({
        success: true,
        prediction: response.data,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, error: "Unexpected response from ML model" });
    }
  } catch (error) {
    console.error("Prediction error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
