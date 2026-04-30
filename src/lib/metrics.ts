/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BurnoutMetrics {
  score: number; // 0-100
  status: 'optimal' | 'strained' | 'burnout_risk';
  message: string;
  recommendation: string;
  loadFactor: number;
}

export interface TaskMetric {
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export const calculateBurnoutRisk = (tasks: TaskMetric[]): BurnoutMetrics => {
  const pendingTasks = tasks.filter(t => !t.completed);
  
  if (pendingTasks.length === 0) {
    return {
      score: 0,
      status: 'optimal',
      message: "Mind clear & ready.",
      recommendation: "Take the opportunity to plan ahead or rest.",
      loadFactor: 0
    };
  }

  const weights = {
    High: 25,
    Medium: 15,
    Low: 5
  };

  const totalLoad = pendingTasks.reduce((acc, task) => acc + (weights[task.priority] || 10), 0);
  
  // Normalize to 100 max
  const score = Math.min(100, (totalLoad / 100) * 100);
  
  let status: BurnoutMetrics['status'] = 'optimal';
  let message = "You're in the zone.";
  let recommendation = "Maintain this pace for steady progress.";

  if (score > 75) {
    status = 'burnout_risk';
    message = "Critical Load Detected";
    recommendation = "Emergency rest advised. De-prioritize non-essential tasks.";
  } else if (score > 40) {
    status = 'strained';
    message = "High Performance Stress";
    recommendation = "Consider grouping tasks or taking a short breather.";
  }

  return {
    score,
    status,
    message,
    recommendation,
    loadFactor: totalLoad
  };
};
