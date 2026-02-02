import { startOfWeek, endOfWeek, sumBy } from "./utils.js";

const BADGES = [
  {
    id: "first-workout",
    title: "Первый шаг",
    description: "Добавить первую тренировку.",
    check: (workouts) => workouts.length >= 1,
  },
  {
    id: "five-workouts",
    title: "Серия 5",
    description: "5 тренировок всего.",
    check: (workouts) => workouts.length >= 5,
  },
  {
    id: "twenty-km",
    title: "20 км",
    description: "Суммарно 20 км дистанции.",
    check: (workouts) => sumBy(workouts, "distanceKm") >= 20,
  },
  {
    id: "week-hero",
    title: "Герой недели",
    description: "4 тренировки за неделю.",
    check: (workouts) => {
      const now = new Date();
      const start = startOfWeek(now);
      const end = endOfWeek(now);
      const week = workouts.filter((w) => {
        const date = new Date(w.dateISO);
        return date >= start && date <= end;
      });
      return week.length >= 4;
    },
  },
];

const calculateMetrics = (workouts, criterion = "durationMin") => {
  const byWeek = {};
  workouts.forEach((workout) => {
    const date = new Date(workout.dateISO);
    const start = startOfWeek(date).toISOString().slice(0, 10);
    if (!byWeek[start]) byWeek[start] = [];
    byWeek[start].push(workout);
  });
  const weeks = Object.entries(byWeek).map(([start, items]) => ({
    start,
    total: sumBy(items, criterion),
  }));
  weeks.sort((a, b) => b.total - a.total);
  const bestWeek = weeks[0] || { start: null, total: 0 };

  const longestRun = workouts
    .filter((w) => w.type === "run")
    .sort((a, b) => (b.distanceKm || 0) - (a.distanceKm || 0))[0];

  const streak = calculateStreak(workouts);

  return { bestWeek, longestRun, streak };
};

const calculateStreak = (workouts) => {
  const dates = [...new Set(workouts.map((w) => w.dateISO))].sort();
  let maxStreak = 0;
  let current = 0;
  let prevDate = null;
  dates.forEach((dateISO) => {
    const date = new Date(dateISO);
    if (!prevDate) {
      current = 1;
    } else {
      const diffDays = (date - prevDate) / 86400000;
      current = diffDays === 1 ? current + 1 : 1;
    }
    prevDate = date;
    if (current > maxStreak) maxStreak = current;
  });
  return maxStreak;
};

const getBadgesWithStatus = (workouts) =>
  BADGES.map((badge) => ({
    ...badge,
    unlocked: badge.check(workouts),
  }));

export { BADGES, calculateMetrics, getBadgesWithStatus };
