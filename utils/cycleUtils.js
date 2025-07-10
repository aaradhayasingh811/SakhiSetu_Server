// Calculate current cycle day
exports.calculateCycleDay = (currentDate, lastPeriodStart, avgCycleLength) => {
  if (!lastPeriodStart) return null;
  
  const lastStart = new Date(lastPeriodStart);
  const current = new Date(currentDate);
  
  // Reset time parts to compare only dates
  lastStart.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = current - lastStart;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate cycle day (1 to avgCycleLength)
  let cycleDay = (diffDays % avgCycleLength) + 1;
  return cycleDay;
};

// Predict next period start date
exports.calculateNextPeriod = (lastPeriodStart, avgCycleLength) => {
  if (!lastPeriodStart) return null;
  
  const nextDate = new Date(lastPeriodStart);
  nextDate.setDate(nextDate.getDate() + avgCycleLength);
  return nextDate;
};

// Get current cycle phase
exports.getCyclePhase = (cycleDay, avgCycleLength) => {
  if (!cycleDay) return null;
  
  const follicularEnd = Math.floor(avgCycleLength * 0.4);
  const ovulationEnd = Math.floor(avgCycleLength * 0.6);
  const lutealEnd = Math.floor(avgCycleLength * 0.8);
  
  if (cycleDay <= follicularEnd) return 'follicular';
  if (cycleDay <= ovulationEnd) return 'ovulation';
  if (cycleDay <= lutealEnd) return 'luteal';
  return 'menstrual';
};