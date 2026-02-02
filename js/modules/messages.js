import { getDB, setDB } from "./storage.js";
import { generateId } from "./utils.js";

const getDialogs = (userId) => {
  const db = getDB();
  const friendIds = new Set();
  db.messages.forEach((msg) => {
    if (msg.fromUserId === userId) friendIds.add(msg.toUserId);
    if (msg.toUserId === userId) friendIds.add(msg.fromUserId);
  });
  return Array.from(friendIds).map((id) => db.users.find((u) => u.id === id));
};

const getMessagesWithUser = (userId, friendId) => {
  const db = getDB();
  return db.messages
    .filter(
      (msg) =>
        (msg.fromUserId === userId && msg.toUserId === friendId) ||
        (msg.fromUserId === friendId && msg.toUserId === userId)
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const sendMessage = (fromUserId, toUserId, text) => {
  const db = getDB();
  const message = {
    id: generateId("message"),
    fromUserId,
    toUserId,
    text,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  db.messages.push(message);
  setDB(db);
  return message;
};

const markDialogRead = (userId, friendId) => {
  const db = getDB();
  db.messages.forEach((msg) => {
    if (msg.toUserId === userId && msg.fromUserId === friendId) {
      msg.readAt = msg.readAt || new Date().toISOString();
    }
  });
  setDB(db);
};

const getUnreadCount = (userId, friendId) => {
  const db = getDB();
  return db.messages.filter(
    (msg) => msg.toUserId === userId && msg.fromUserId === friendId && !msg.readAt
  ).length;
};

export { getDialogs, getMessagesWithUser, sendMessage, markDialogRead, getUnreadCount };
