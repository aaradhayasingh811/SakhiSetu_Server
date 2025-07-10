const TrackerLog = require('../models/TrackerLog');
const User = require('../models/User');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// @desc    Get mood insights
// @route   GET /api/insights/mood
// @access  Private
exports.getMoodInsights = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const logs = await TrackerLog.find({ user: req.user.id })
      .sort({ date: 1 })
      .lean();

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No logs available for analysis'
      });
    }

    // Group moods by cycle day
    const moodByCycleDay = {};
    logs.forEach(log => {
      if (user.lastPeriodStart) {
        const cycleDay = calculateCycleDay(log.date, user.lastPeriodStart, user.avgCycleLength);
        if (!moodByCycleDay[cycleDay]) {
          moodByCycleDay[cycleDay] = [];
        }
        moodByCycleDay[cycleDay].push(log.mood);
      }
    });

    // Calculate most common mood per cycle day
    const moodPatterns = {};
    Object.keys(moodByCycleDay).forEach(day => {
      const moodCounts = {};
      moodByCycleDay[day].forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
      
      const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      );
      
      moodPatterns[day] = {
        mood: mostCommonMood,
        count: moodCounts[mostCommonMood],
        total: moodByCycleDay[day].length
      };
    });

    res.status(200).json({
      success: true,
      data: {
        moodPatterns,
        totalLogs: logs.length,
        cycleLength: user.avgCycleLength
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get pain trends
// @route   GET /api/insights/pain-trend
// @access  Private
exports.getPainTrends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const logs = await TrackerLog.find({ user: req.user.id })
      .sort({ date: 1 })
      .lean();

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No logs available for analysis'
      });
    }

    // Group pain levels by cycle day
    const painByCycleDay = {};
    logs.forEach(log => {
      if (user.lastPeriodStart && log.painLevel) {
        const cycleDay = calculateCycleDay(log.date, user.lastPeriodStart, user.avgCycleLength);
        if (!painByCycleDay[cycleDay]) {
          painByCycleDay[cycleDay] = [];
        }
        painByCycleDay[cycleDay].push(log.painLevel);
      }
    });

    // Calculate pain severity per cycle day
    const painTrends = {};
    Object.keys(painByCycleDay).forEach(day => {
      const painScores = painByCycleDay[day].map(pain => {
        switch(pain) {
          case 'none': return 0;
          case 'mild': return 1;
          case 'moderate': return 2;
          case 'severe': return 3;
          default: return 0;
        }
      });
      
      const averagePain = painScores.reduce((a, b) => a + b, 0) / painScores.length;
      
      painTrends[day] = {
        averagePain: parseFloat(averagePain.toFixed(2)),
        totalEntries: painScores.length
      };
    });

    res.status(200).json({
      success: true,
      data: {
        painTrends,
        totalLogs: logs.length,
        cycleLength: user.avgCycleLength
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export logs as PDF
// @route   GET /api/insights/export-pdf
// @access  Private
exports.exportToPDF = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const logs = await TrackerLog.find({ user: req.user.id })
      .sort({ date: -1 })
      .lean();

    // Create HTML content
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Menstrual Health Report</h1>
            <p>Name: ${user.name}</p>
            <p>Age: ${user.age}</p>
            <p>Average Cycle Length: ${user.avgCycleLength} days</p>
            <p>Total Logs: ${logs.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Cycle Day</th>
                <th>Mood</th>
                <th>Pain Level</th>
                <th>Flow</th>
                <th>Sleep Hours</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td>${new Date(log.date).toLocaleDateString()}</td>
                  <td>${user.lastPeriodStart ? calculateCycleDay(log.date, user.lastPeriodStart, user.avgCycleLength) : 'N/A'}</td>
                  <td>${log.mood || '-'}</td>
                  <td>${log.painLevel || '-'}</td>
                  <td>${log.flow || '-'}</td>
                  <td>${log.sleepHours || '-'}</td>
                  <td>${log.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdfPath = path.join(__dirname, '..', 'temp', `report_${req.user.id}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=menstrual_health_report_${Date.now()}.pdf`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('close', () => {
      fs.unlinkSync(pdfPath); // Clean up temp file
    });
  } catch (err) {
    next(err);
  }
};