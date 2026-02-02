const generateId = (prefix = "id") => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso) => {
  const date = new Date(iso);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const startOfWeek = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  newDate.setDate(newDate.getDate() + diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfWeek = (date) => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isSameDay = (dateISO, targetDate) => {
  if (!dateISO) return false;
  const date = new Date(dateISO);
  return date.toDateString() === targetDate.toDateString();
};

const groupByDate = (items, key) =>
  items.reduce((acc, item) => {
    const date = item[key];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

const getMonthMatrix = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startDayIndex = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let current = 1 - startDayIndex;
  for (let w = 0; w < 6; w += 1) {
    const week = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(year, month, current);
      week.push({ date, isCurrentMonth: date.getMonth() === month });
      current += 1;
    }
    weeks.push(week);
  }
  return weeks;
};

const sumBy = (items, key) => items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);

const average = (items, key) => (items.length ? sumBy(items, key) / items.length : 0);

export {
  generateId,
  formatDate,
  formatTime,
  startOfWeek,
  endOfWeek,
  isSameDay,
  groupByDate,
  getMonthMatrix,
  sumBy,
  average,
};
