import { getDB, setDB } from "./storage.js";
import { generateId } from "./utils.js";

const WORKOUT_TYPES = {
  run: { label: "Бег", color: "var(--type-run)" },
  gym: { label: "Зал", color: "var(--type-gym)" },
  bike: { label: "Вело", color: "var(--type-bike)" },
  swim: { label: "Плавание", color: "var(--type-swim)" },
  yoga: { label: "Йога", color: "var(--type-yoga)" },
  walk: { label: "Прогулка", color: "var(--type-walk)" },
};

const getWorkoutsByUser = (userId) => {
  const db = getDB();
  return db.workouts.filter((workout) => workout.userId === userId);
};

const addWorkout = (userId, workout) => {
  const db = getDB();
  const newWorkout = {
    id: generateId("workout"),
    userId,
    createdAt: new Date().toISOString(),
    ...workout,
  };
  db.workouts.push(newWorkout);
  setDB(db);
  return newWorkout;
};

const updateWorkout = (workoutId, updates) => {
  const db = getDB();
  const workout = db.workouts.find((item) => item.id === workoutId);
  if (!workout) return null;
  Object.assign(workout, updates);
  setDB(db);
  return workout;
};

const deleteWorkout = (workoutId) => {
  const db = getDB();
  db.workouts = db.workouts.filter((item) => item.id !== workoutId);
  setDB(db);
};

export {
  WORKOUT_TYPES,
  getWorkoutsByUser,
  addWorkout,
  updateWorkout,
  deleteWorkout,
};
