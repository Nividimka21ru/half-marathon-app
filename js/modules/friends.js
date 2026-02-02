import { getDB, setDB } from "./storage.js";
import { generateId } from "./utils.js";

const searchUsers = (query, currentUserId) => {
  const db = getDB();
  return db.users.filter(
    (user) =>
      user.id !== currentUserId &&
      (user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()))
  );
};

const getFriendRequests = (userId) => {
  const db = getDB();
  return db.friendRequests.filter((req) => req.toUserId === userId && req.status === "pending");
};

const getFriends = (userId) => {
  const db = getDB();
  const accepted = db.friendRequests.filter(
    (req) =>
      req.status === "accepted" && (req.toUserId === userId || req.fromUserId === userId)
  );
  const friendIds = accepted.map((req) =>
    req.toUserId === userId ? req.fromUserId : req.toUserId
  );
  return db.users.filter((user) => friendIds.includes(user.id));
};

const sendRequest = (fromUserId, toUserId) => {
  const db = getDB();
  const existing = db.friendRequests.find(
    (req) =>
      (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
      (req.fromUserId === toUserId && req.toUserId === fromUserId)
  );
  if (existing) return { ok: false, message: "Запрос уже существует." };
  const request = {
    id: generateId("request"),
    fromUserId,
    toUserId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.friendRequests.push(request);
  setDB(db);
  return { ok: true };
};

const respondRequest = (requestId, status) => {
  const db = getDB();
  const request = db.friendRequests.find((req) => req.id === requestId);
  if (!request) return;
  request.status = status;
  setDB(db);
};

export { searchUsers, getFriendRequests, getFriends, sendRequest, respondRequest };
