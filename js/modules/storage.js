const STORAGE_KEY = "fitnessTrackerData";
const SESSION_KEY = "fitnessTrackerSession";
const SETTINGS_KEY = "fitnessTrackerSettings";

const defaultSettings = {
  theme: "light",
  language: "ru",
};

const demoData = () => {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  return {
    users: [
      {
        id: "u1",
        username: "demo",
        email: "demo@fit.app",
        passwordHash: "demo123",
        profile: {
          name: "Анна Демова",
          age: 29,
          height: 168,
          weight: 62,
          gender: "female",
          activity: "medium",
        },
        goals: {
          workoutsPerWeek: 4,
          kmPerWeek: 20,
          caloriesPerWeek: 2400,
        },
        createdAt: now.toISOString(),
      },
      {
        id: "u2",
        username: "alex",
        email: "alex@fit.app",
        passwordHash: "alex123",
        profile: {
          name: "Алекс Орлов",
          age: 34,
          height: 178,
          weight: 78,
          gender: "male",
          activity: "high",
        },
        goals: {
          workoutsPerWeek: 3,
          kmPerWeek: 15,
          caloriesPerWeek: 2000,
        },
        createdAt: now.toISOString(),
      },
      {
        id: "u3",
        username: "maria",
        email: "maria@fit.app",
        passwordHash: "maria123",
        profile: {
          name: "Мария Лукина",
          age: 26,
          height: 164,
          weight: 57,
          gender: "female",
          activity: "low",
        },
        goals: {
          workoutsPerWeek: 2,
          kmPerWeek: 10,
          caloriesPerWeek: 1500,
        },
        createdAt: now.toISOString(),
      },
    ],
    workouts: [
      {
        id: "w1",
        userId: "u1",
        dateISO: todayISO,
        type: "run",
        durationMin: 45,
        distanceKm: 8.2,
        calories: 520,
        notes: "Бег в парке, хороший темп.",
        createdAt: now.toISOString(),
      },
      {
        id: "w2",
        userId: "u1",
        dateISO: new Date(now.getTime() - 86400000 * 2).toISOString().slice(0, 10),
        type: "gym",
        durationMin: 60,
        distanceKm: null,
        calories: 480,
        notes: "Силовая: ноги и спина.",
        createdAt: now.toISOString(),
      },
      {
        id: "w3",
        userId: "u1",
        dateISO: new Date(now.getTime() - 86400000 * 4).toISOString().slice(0, 10),
        type: "yoga",
        durationMin: 40,
        distanceKm: null,
        calories: 160,
        notes: "Йога на растяжку.",
        createdAt: now.toISOString(),
      },
      {
        id: "w4",
        userId: "u2",
        dateISO: todayISO,
        type: "bike",
        durationMin: 50,
        distanceKm: 15,
        calories: 400,
        notes: "Велопрогулка вдоль реки.",
        createdAt: now.toISOString(),
      },
    ],
    friendRequests: [
      {
        id: "fr1",
        fromUserId: "u2",
        toUserId: "u1",
        status: "pending",
        createdAt: now.toISOString(),
      },
    ],
    messages: [
      {
        id: "m1",
        fromUserId: "u2",
        toUserId: "u1",
        text: "Привет! Бежим вместе в выходные?",
        createdAt: now.toISOString(),
        readAt: null,
      },
    ],
    achievementStates: [],
  };
};

const init = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData()));
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  }
};

const getDB = () => {
  init();
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
};

const setDB = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY));
const setSession = (session) => localStorage.setItem(SESSION_KEY, JSON.stringify(session));
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const getSettings = () => {
  init();
  return JSON.parse(localStorage.getItem(SETTINGS_KEY));
};

const setSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export {
  STORAGE_KEY,
  SESSION_KEY,
  SETTINGS_KEY,
  getDB,
  setDB,
  getSession,
  setSession,
  clearSession,
  getSettings,
  setSettings,
};
