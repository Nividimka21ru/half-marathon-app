import { getMonthMatrix, isSameDay } from "./utils.js";

const buildCalendar = (year, month, workouts) => {
  const weeks = getMonthMatrix(year, month);
  return weeks.map((week) =>
    week.map((day) => {
      const items = workouts.filter((workout) => isSameDay(workout.dateISO, day.date));
      return { ...day, workouts: items };
    })
  );
};

export { buildCalendar };
