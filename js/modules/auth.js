import { getDB, setDB, getSession, setSession, clearSession } from "./storage.js";
import { generateId } from "./utils.js";

const getCurrentUser = () => {
  const session = getSession();
  if (!session?.currentUserId) return null;
  const db = getDB();
  return db.users.find((user) => user.id === session.currentUserId) || null;
};

const login = ({ loginValue, password }) => {
  const db = getDB();
  const user = db.users.find(
    (item) => item.username === loginValue || item.email === loginValue
  );
  if (!user || user.passwordHash !== password) {
    return { ok: false, message: "Неверный логин или пароль." };
  }
  setSession({ currentUserId: user.id });
  return { ok: true, user };
};

const register = ({ username, email, password }) => {
  const db = getDB();
  if (db.users.some((user) => user.username === username || user.email === email)) {
    return { ok: false, message: "Пользователь уже существует." };
  }

  const newUser = {
    id: generateId("user"),
    username,
    email,
    passwordHash: password,
    profile: {
      name: username,
      age: 0,
      height: 0,
      weight: 0,
      gender: "other",
      activity: "medium",
    },
    goals: {
      workoutsPerWeek: 3,
      kmPerWeek: 10,
      caloriesPerWeek: 2000,
    },
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  setDB(db);
  setSession({ currentUserId: newUser.id });
  return { ok: true, user: newUser };
};

const logout = () => {
  clearSession();
};

const updateProfile = (userId, profile) => {
  const db = getDB();
  const user = db.users.find((item) => item.id === userId);
  if (!user) return null;
  user.profile = { ...user.profile, ...profile };
  setDB(db);
  return user;
};

const updateGoals = (userId, goals) => {
  const db = getDB();
  const user = db.users.find((item) => item.id === userId);
  if (!user) return null;
  user.goals = { ...user.goals, ...goals };
  setDB(db);
  return user;
};

export { getCurrentUser, login, register, logout, updateProfile, updateGoals };
