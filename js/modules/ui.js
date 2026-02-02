import { getCurrentUser, updateProfile, updateGoals } from "./auth.js";
import {
  WORKOUT_TYPES,
  getWorkoutsByUser,
  addWorkout,
  updateWorkout,
  deleteWorkout,
} from "./workouts.js";
import { buildCalendar } from "./calendar.js";
import { calculateMetrics, getBadgesWithStatus } from "./achievements.js";
import { searchUsers, getFriendRequests, getFriends, sendRequest, respondRequest } from "./friends.js";
import {
  getDialogs,
  getMessagesWithUser,
  sendMessage,
  markDialogRead,
  getUnreadCount,
} from "./messages.js";
import { getSettings, setSettings, getDB } from "./storage.js";
import {
  formatDate,
  formatTime,
  sumBy,
  average,
  startOfWeek,
  endOfWeek,
} from "./utils.js";

const content = document.getElementById("content");
const userChip = document.getElementById("userChip");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalActions = document.getElementById("modalActions");
const toastContainer = document.getElementById("toastContainer");

const setUserChip = (user) => {
  if (!user) {
    userChip.textContent = "Гость";
    return;
  }
  userChip.innerHTML = `<strong>${user.profile.name}</strong><span>@${user.username}</span>`;
};

const showToast = (message) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};

const showConfirm = (message) =>
  new Promise((resolve) => {
    modalBody.innerHTML = `<p>${message}</p>`;
    modalActions.innerHTML = "";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "button secondary";
    cancelBtn.textContent = "Отмена";
    const okBtn = document.createElement("button");
    okBtn.className = "button danger";
    okBtn.textContent = "Удалить";
    cancelBtn.addEventListener("click", () => {
      modal.classList.remove("is-open");
      resolve(false);
    });
    okBtn.addEventListener("click", () => {
      modal.classList.remove("is-open");
      resolve(true);
    });
    modalActions.append(cancelBtn, okBtn);
    modal.classList.add("is-open");
  });

const closeModal = () => {
  modal.classList.remove("is-open");
};

const showModal = (contentHTML, actions = []) => {
  modalBody.innerHTML = contentHTML;
  modalActions.innerHTML = "";
  actions.forEach((action) => modalActions.appendChild(action));
  modal.classList.add("is-open");
};

const createWorkoutTypeOptions = (selected) =>
  Object.entries(WORKOUT_TYPES)
    .map(
      ([key, { label }]) =>
        `<option value="${key}" ${selected === key ? "selected" : ""}>${label}</option>`
    )
    .join("");

const renderLogin = () => {
  content.innerHTML = `
    <div class="card" style="max-width:420px; margin:0 auto;">
      <h2>Вход</h2>
      <form class="form" id="loginForm">
        <label>
          Логин или email
          <input name="loginValue" required />
        </label>
        <label>
          Пароль
          <input name="password" type="password" required minlength="5" />
        </label>
        <button class="button" type="submit">Войти</button>
        <p>Нет аккаунта? <a href="#/register">Регистрация</a></p>
      </form>
      <div class="card" style="margin-top:16px; background:var(--surface-alt);">
        <strong>Демо-доступ</strong>
        <p>Логин: demo<br />Пароль: demo123</p>
      </div>
    </div>
  `;
};

const renderRegister = () => {
  content.innerHTML = `
    <div class="card" style="max-width:420px; margin:0 auto;">
      <h2>Регистрация</h2>
      <form class="form" id="registerForm">
        <label>
          Логин
          <input name="username" required minlength="3" />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Пароль
          <input name="password" type="password" required minlength="5" />
        </label>
        <label>
          Повторите пароль
          <input name="confirmPassword" type="password" required minlength="5" />
        </label>
        <button class="button" type="submit">Создать аккаунт</button>
        <p>Есть аккаунт? <a href="#/login">Вход</a></p>
      </form>
    </div>
  `;
};

const renderDashboard = () => {
  const user = getCurrentUser();
  const workouts = getWorkoutsByUser(user.id);
  const start = startOfWeek(new Date());
  const end = endOfWeek(new Date());
  const weekWorkouts = workouts.filter((w) => {
    const date = new Date(w.dateISO);
    return date >= start && date <= end;
  });
  const totalMinutes = sumBy(workouts, "durationMin");
  const totalKm = sumBy(workouts, "distanceKm");
  const metrics = calculateMetrics(workouts);
  const weeklyBars = Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    const items = weekWorkouts.filter((w) => new Date(w.dateISO).toDateString() === day.toDateString());
    return { label: day.toLocaleDateString("ru-RU", { weekday: "short" }), total: sumBy(items, "durationMin") };
  });
  const maxBar = Math.max(1, ...weeklyBars.map((b) => b.total));

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Dashboard</h2>
        <p class="muted">Добро пожаловать, ${user.profile.name}</p>
      </div>
      <div class="badge">Неделя ${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}</div>
    </section>
    <section class="card-grid">
      <div class="card">
        <h3>Тренировок всего</h3>
        <p class="metric">${workouts.length}</p>
        <small>На неделе: ${weekWorkouts.length}</small>
      </div>
      <div class="card">
        <h3>Км всего</h3>
        <p class="metric">${totalKm.toFixed(1)}</p>
        <small>Средняя тренировка: ${average(workouts, "distanceKm").toFixed(1)} км</small>
      </div>
      <div class="card">
        <h3>Минут всего</h3>
        <p class="metric">${totalMinutes}</p>
        <small>Средняя длительность: ${average(workouts, "durationMin").toFixed(0)} мин</small>
      </div>
      <div class="card">
        <h3>Серия</h3>
        <p class="metric">${metrics.streak} дней</p>
        <small>Лучшая неделя: ${metrics.bestWeek.total} мин</small>
      </div>
    </section>
    <section class="card">
      <h3>Активность недели</h3>
      <div style="display:flex; gap:12px; align-items:flex-end; height:160px;">
        ${weeklyBars
          .map(
            (bar) => `
          <div style="flex:1; text-align:center;">
            <div style="height:${(bar.total / maxBar) * 100}%; background:var(--primary); border-radius:10px;"></div>
            <small>${bar.label}</small>
          </div>
        `
          )
          .join("")}
      </div>
    </section>
  `;
};

const renderAddWorkout = (workout = null) => {
  const user = getCurrentUser();
  const today = new Date().toISOString().slice(0, 10);
  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>${workout ? "Редактировать тренировку" : "Добавить тренировку"}</h2>
        <p>Заполните данные тренировки</p>
      </div>
    </section>
    <section class="card">
      <form class="form" id="workoutForm">
        <div class="form-row">
          <label>Дата
            <input type="date" name="dateISO" value="${workout?.dateISO || today}" required />
          </label>
          <label>Тип
            <select name="type">${createWorkoutTypeOptions(workout?.type || "run")}</select>
          </label>
          <label>Длительность (мин)
            <input type="number" name="durationMin" min="10" value="${workout?.durationMin || 30}" required />
          </label>
        </div>
        <div class="form-row">
          <label>Дистанция (км)
            <input type="number" step="0.1" name="distanceKm" value="${workout?.distanceKm || ""}" />
          </label>
          <label>Калории
            <input type="number" name="calories" value="${workout?.calories || ""}" />
          </label>
        </div>
        <label>Заметки
          <textarea name="notes">${workout?.notes || ""}</textarea>
        </label>
        <button class="button" type="submit">${workout ? "Сохранить" : "Добавить"}</button>
      </form>
    </section>
  `;

  const form = document.getElementById("workoutForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      dateISO: formData.get("dateISO"),
      type: formData.get("type"),
      durationMin: Number(formData.get("durationMin")),
      distanceKm: formData.get("distanceKm") ? Number(formData.get("distanceKm")) : null,
      calories: formData.get("calories") ? Number(formData.get("calories")) : null,
      notes: formData.get("notes"),
    };
    if (workout) {
      updateWorkout(workout.id, payload);
      showToast("Тренировка обновлена.");
    } else {
      addWorkout(user.id, payload);
      showToast("Тренировка добавлена.");
      form.reset();
    }
    window.location.hash = "#/history";
  });
};

const renderHistory = () => {
  const user = getCurrentUser();
  const workouts = getWorkoutsByUser(user.id).sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>История тренировок</h2>
        <p>Фильтры и поиск по тренировкам</p>
      </div>
    </section>
    <section class="card">
      <div class="form-row">
        <label>Тип
          <select id="historyType">
            <option value="">Все</option>
            ${createWorkoutTypeOptions("")}
          </select>
        </label>
        <label>Период
          <select id="historyPeriod">
            <option value="all">Все</option>
            <option value="week">7 дней</option>
            <option value="month">30 дней</option>
          </select>
        </label>
        <label>Поиск
          <input id="historySearch" placeholder="Заметки, дата или тип" />
        </label>
      </div>
      <div class="list" id="historyList"></div>
    </section>
  `;

  const historyList = document.getElementById("historyList");
  const renderList = () => {
    const type = document.getElementById("historyType").value;
    const period = document.getElementById("historyPeriod").value;
    const search = document.getElementById("historySearch").value.toLowerCase();
    const now = new Date();
    const filtered = workouts.filter((workout) => {
      const matchesType = type ? workout.type === type : true;
      const matchesSearch = [workout.notes, workout.type, workout.dateISO]
        .join(" ")
        .toLowerCase()
        .includes(search);
      const matchesPeriod = (() => {
        if (period === "all") return true;
        const diff = (now - new Date(workout.dateISO)) / 86400000;
        return period === "week" ? diff <= 7 : diff <= 30;
      })();
      return matchesType && matchesSearch && matchesPeriod;
    });

    if (!filtered.length) {
      historyList.innerHTML = `<p>Нет тренировок по заданным фильтрам.</p>`;
      return;
    }

    historyList.innerHTML = filtered
      .map((workout) => {
        const typeMeta = WORKOUT_TYPES[workout.type];
        return `
        <div class="list-item">
          <div class="list-item__meta">
            <strong>${typeMeta.label}</strong>
            <span>${formatDate(workout.dateISO)} · ${workout.durationMin} мин · ${workout.distanceKm || 0} км</span>
            <small>${workout.notes || ""}</small>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span class="type-pill" style="background:${typeMeta.color}">${typeMeta.label}</span>
            <button class="button secondary" data-edit="${workout.id}">Редактировать</button>
            <button class="button danger" data-delete="${workout.id}">Удалить</button>
          </div>
        </div>
      `;
      })
      .join("");

    historyList.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await showConfirm("Удалить тренировку?");
        if (ok) {
          deleteWorkout(btn.dataset.delete);
          showToast("Тренировка удалена.");
          renderHistory();
        }
      });
    });

    historyList.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const workout = workouts.find((item) => item.id === btn.dataset.edit);
        renderAddWorkout(workout);
      });
    });
  };

  ["historyType", "historyPeriod", "historySearch"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderList)
  );
  renderList();
};

const renderCalendar = () => {
  const user = getCurrentUser();
  const workouts = getWorkoutsByUser(user.id);
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  const render = () => {
    const calendar = buildCalendar(currentYear, currentMonth, workouts);
    content.innerHTML = `
      <section class="page-title">
        <div>
          <h2>Календарь</h2>
          <p>${new Date(currentYear, currentMonth).toLocaleDateString("ru-RU", {
            month: "long",
            year: "numeric",
          })}</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="button secondary" id="prevMonth">←</button>
          <button class="button secondary" id="todayBtn">Сегодня</button>
          <button class="button secondary" id="nextMonth">→</button>
        </div>
      </section>
      <section class="card">
        <div class="calendar">
          ${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
            .map((day) => `<strong>${day}</strong>`)
            .join("")}
          ${calendar
            .flat()
            .map((day) => {
              const markers = day.workouts
                .map((workout) =>
                  `<span class="marker" style="background:${WORKOUT_TYPES[workout.type].color}"></span>`
                )
                .join("");
              return `
                <div class="calendar__day ${day.isCurrentMonth ? "" : "is-muted"} ${
                day.date.toDateString() === now.toDateString() ? "is-today" : ""
              }" data-date="${day.date.toISOString().slice(0, 10)}">
                  <strong>${day.date.getDate()}</strong>
                  <div>${markers}</div>
                </div>
              `;
            })
            .join("")}
        </div>
      </section>
    `;

    document.getElementById("prevMonth").addEventListener("click", () => {
      currentMonth -= 1;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
      }
      render();
    });
    document.getElementById("nextMonth").addEventListener("click", () => {
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
      render();
    });
    document.getElementById("todayBtn").addEventListener("click", () => {
      currentMonth = now.getMonth();
      currentYear = now.getFullYear();
      render();
    });

    content.querySelectorAll(".calendar__day").forEach((cell) => {
      cell.addEventListener("click", () => {
        const dateISO = cell.dataset.date;
        const dayWorkouts = workouts.filter((w) => w.dateISO === dateISO);
        const list = dayWorkouts
          .map(
            (workout) =>
              `<li>${WORKOUT_TYPES[workout.type].label} · ${workout.durationMin} мин · ${
                workout.distanceKm || 0
              } км</li>`
          )
          .join("");
        const contentHTML = dayWorkouts.length
          ? `<h3>Тренировки ${formatDate(dateISO)}</h3><ul>${list}</ul>`
          : `<h3>${formatDate(dateISO)}</h3><p>Нет тренировок.</p>`;
        const closeBtn = document.createElement("button");
        closeBtn.className = "button secondary";
        closeBtn.textContent = "Закрыть";
        closeBtn.addEventListener("click", closeModal);
        showModal(contentHTML, [closeBtn]);
      });
    });
  };

  render();
};

const renderGoals = () => {
  const user = getCurrentUser();
  const workouts = getWorkoutsByUser(user.id);
  const start = startOfWeek(new Date());
  const end = endOfWeek(new Date());
  const weekWorkouts = workouts.filter((w) => {
    const date = new Date(w.dateISO);
    return date >= start && date <= end;
  });

  const progressWorkouts = weekWorkouts.length;
  const progressKm = sumBy(weekWorkouts, "distanceKm");
  const progressCalories = sumBy(weekWorkouts, "calories");

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Goals</h2>
        <p>Прогресс целей на неделю</p>
      </div>
    </section>
    <section class="card-grid">
      <div class="card">
        <h3>Тренировок в неделю</h3>
        <p>${progressWorkouts} / ${user.goals.workoutsPerWeek}</p>
        <div class="progress"><div class="progress__bar" style="width:${
          (progressWorkouts / user.goals.workoutsPerWeek) * 100
        }%"></div></div>
      </div>
      <div class="card">
        <h3>Км в неделю</h3>
        <p>${progressKm.toFixed(1)} / ${user.goals.kmPerWeek}</p>
        <div class="progress"><div class="progress__bar" style="width:${
          (progressKm / user.goals.kmPerWeek) * 100
        }%"></div></div>
      </div>
      <div class="card">
        <h3>Калории в неделю</h3>
        <p>${progressCalories.toFixed(0)} / ${user.goals.caloriesPerWeek}</p>
        <div class="progress"><div class="progress__bar" style="width:${
          (progressCalories / user.goals.caloriesPerWeek) * 100
        }%"></div></div>
      </div>
    </section>
    <section class="card">
      <h3>Обновить цели</h3>
      <form class="form" id="goalsForm">
        <div class="form-row">
          <label>Тренировок в неделю
            <input type="number" name="workoutsPerWeek" min="1" value="${user.goals.workoutsPerWeek}" />
          </label>
          <label>Км в неделю
            <input type="number" name="kmPerWeek" min="1" value="${user.goals.kmPerWeek}" />
          </label>
          <label>Калории в неделю
            <input type="number" name="caloriesPerWeek" min="1" value="${user.goals.caloriesPerWeek}" />
          </label>
        </div>
        <button class="button" type="submit">Сохранить</button>
      </form>
    </section>
  `;

  document.getElementById("goalsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    updateGoals(user.id, {
      workoutsPerWeek: Number(formData.get("workoutsPerWeek")),
      kmPerWeek: Number(formData.get("kmPerWeek")),
      caloriesPerWeek: Number(formData.get("caloriesPerWeek")),
    });
    showToast("Цели обновлены.");
    renderGoals();
  });
};

const renderAchievements = () => {
  const user = getCurrentUser();
  const workouts = getWorkoutsByUser(user.id);
  const badges = getBadgesWithStatus(workouts);
  const metrics = calculateMetrics(workouts);

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Achievements</h2>
        <p>Автоматически рассчитанные достижения</p>
      </div>
    </section>
    <section class="card-grid">
      <div class="card">
        <h3>Лучшая неделя</h3>
        <p>${metrics.bestWeek.total} мин</p>
        <small>Начало: ${metrics.bestWeek.start ? formatDate(metrics.bestWeek.start) : "-"}</small>
      </div>
      <div class="card">
        <h3>Самая долгая пробежка</h3>
        <p>${metrics.longestRun?.distanceKm || 0} км</p>
        <small>${metrics.longestRun ? formatDate(metrics.longestRun.dateISO) : "-"}</small>
      </div>
      <div class="card">
        <h3>Серия</h3>
        <p>${metrics.streak} дней подряд</p>
        <small>Продолжайте!</small>
      </div>
      <div class="card">
        <h3>Личный рекорд (бег)</h3>
        <p>${metrics.longestRun?.durationMin || 0} мин</p>
        <small>${metrics.longestRun ? formatDate(metrics.longestRun.dateISO) : "-"}</small>
      </div>
    </section>
    <section class="card">
      <h3>Бейджи</h3>
      <div class="card-grid">
        ${badges
          .map(
            (badge) => `
          <div class="card" style="background:${badge.unlocked ? "rgba(76,110,245,0.1)" : "var(--surface)"};">
            <h4>${badge.title}</h4>
            <p>${badge.description}</p>
            <span class="badge">${badge.unlocked ? "Получено" : "В процессе"}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </section>
  `;
};

const renderFriends = () => {
  const user = getCurrentUser();
  const requests = getFriendRequests(user.id);
  const friends = getFriends(user.id);
  const db = getDB();

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Friends</h2>
        <p>Локальная социальная сеть</p>
      </div>
    </section>
    <section class="card">
      <h3>Поиск пользователей</h3>
      <div class="form-row">
        <input id="friendsSearch" placeholder="Введите логин или email" />
        <button class="button" id="friendsSearchBtn">Искать</button>
      </div>
      <div id="friendsSearchResults" class="list" style="margin-top:16px;"></div>
    </section>
    <section class="card">
      <h3>Запросы в друзья</h3>
      <div class="list" id="requestsList"></div>
    </section>
    <section class="card">
      <h3>Ваши друзья</h3>
      <div class="list" id="friendsList"></div>
    </section>
  `;

  const requestsList = document.getElementById("requestsList");
  requestsList.innerHTML = requests.length
    ? requests
        .map((req) => {
          const fromUser = db.users.find((item) => item.id === req.fromUserId);
          return `
        <div class="list-item">
          <div class="list-item__meta">
            <strong>${fromUser?.profile.name || req.fromUserId}</strong>
            <small>@${fromUser?.username || "-"}</small>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="button" data-accept="${req.id}">Принять</button>
            <button class="button secondary" data-decline="${req.id}">Отклонить</button>
          </div>
        </div>
      `;
        })
        .join("")
    : "<p>Нет новых запросов.</p>";

  requestsList.querySelectorAll("[data-accept]").forEach((btn) => {
    btn.addEventListener("click", () => {
      respondRequest(btn.dataset.accept, "accepted");
      showToast("Запрос принят.");
      renderFriends();
    });
  });
  requestsList.querySelectorAll("[data-decline]").forEach((btn) => {
    btn.addEventListener("click", () => {
      respondRequest(btn.dataset.decline, "declined");
      showToast("Запрос отклонён.");
      renderFriends();
    });
  });

  const friendsList = document.getElementById("friendsList");
  friendsList.innerHTML = friends.length
    ? friends
        .map(
          (friend) => `
      <div class="list-item">
        <div class="list-item__meta">
          <strong>${friend.profile.name}</strong>
          <small>@${friend.username}</small>
        </div>
        <span class="badge">${friend.email}</span>
      </div>
    `
        )
        .join("")
    : "<p>Пока нет друзей.</p>";

  const results = document.getElementById("friendsSearchResults");
  document.getElementById("friendsSearchBtn").addEventListener("click", () => {
    const query = document.getElementById("friendsSearch").value.trim();
    if (!query) return;
    const matches = searchUsers(query, user.id);
    results.innerHTML = matches.length
      ? matches
          .map(
            (match) => `
        <div class="list-item">
          <div class="list-item__meta">
            <strong>${match.profile.name}</strong>
            <small>@${match.username}</small>
          </div>
          <button class="button" data-add="${match.id}">Добавить</button>
        </div>
      `
          )
          .join("")
      : "<p>Ничего не найдено.</p>";

    results.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const res = sendRequest(user.id, btn.dataset.add);
        if (res.ok) {
          showToast("Запрос отправлен.");
        } else {
          showToast(res.message);
        }
      });
    });
  });
};

const renderMessages = () => {
  const user = getCurrentUser();
  const dialogs = getDialogs(user.id);
  const activeFriendId = dialogs[0]?.id || null;

  const renderThread = (friendId) => {
    const friend = dialogs.find((item) => item.id === friendId);
    if (!friend) return;
    const messages = getMessagesWithUser(user.id, friendId);
    markDialogRead(user.id, friendId);

    const messagesHTML = messages
      .map(
        (msg) => `
        <div class="message ${msg.fromUserId === user.id ? "sent" : "received"}">
          <p>${msg.text}</p>
          <small>${formatTime(msg.createdAt)}</small>
        </div>
      `
      )
      .join("");

    document.getElementById("chatThread").innerHTML = `
      <div class="chat__messages" id="chatMessages">${messagesHTML}</div>
      <div class="chat__input">
        <input id="chatInput" placeholder="Сообщение..." />
        <button class="button" id="sendMessage">Отправить</button>
      </div>
    `;

    document.getElementById("sendMessage").addEventListener("click", () => {
      const input = document.getElementById("chatInput");
      const text = input.value.trim();
      if (!text) return;
      sendMessage(user.id, friendId, text);
      input.value = "";
      renderMessages();
    });
  };

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Messages</h2>
        <p>Диалоги с друзьями</p>
      </div>
    </section>
    <section class="chat">
      <div class="chat__list" id="dialogList"></div>
      <div class="chat__thread" id="chatThread"></div>
    </section>
  `;

  const dialogList = document.getElementById("dialogList");
  dialogList.innerHTML = dialogs.length
    ? dialogs
        .map((dialog) => {
          const unread = getUnreadCount(user.id, dialog.id);
          return `
          <div class="list-item" data-dialog="${dialog.id}">
            <div class="list-item__meta">
              <strong>${dialog.profile.name}</strong>
              <small>@${dialog.username}</small>
            </div>
            ${unread ? `<span class="badge">${unread}</span>` : ""}
          </div>
        `;
        })
        .join("")
    : "<p>Нет диалогов. Добавьте друзей.</p>";

  dialogList.querySelectorAll("[data-dialog]").forEach((item) => {
    item.addEventListener("click", () => renderThread(item.dataset.dialog));
  });

  if (activeFriendId) {
    renderThread(activeFriendId);
  } else {
    document.getElementById("chatThread").innerHTML =
      "<p style=\"padding:16px;\">Выберите диалог слева.</p>";
  }
};

const renderProfile = () => {
  const user = getCurrentUser();
  const workouts = getWorkoutsByUser(user.id);
  const stats = {
    total: workouts.length,
    km: sumBy(workouts, "distanceKm"),
    minutes: sumBy(workouts, "durationMin"),
    avgDuration: average(workouts, "durationMin"),
  };

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Profile</h2>
        <p>Данные профиля и статистика</p>
      </div>
    </section>
    <section class="card">
      <form class="form" id="profileForm">
        <div class="form-row">
          <label>Имя
            <input name="name" value="${user.profile.name}" />
          </label>
          <label>Возраст
            <input type="number" name="age" value="${user.profile.age}" />
          </label>
          <label>Рост (см)
            <input type="number" name="height" value="${user.profile.height}" />
          </label>
          <label>Вес (кг)
            <input type="number" name="weight" value="${user.profile.weight}" />
          </label>
        </div>
        <div class="form-row">
          <label>Пол
            <select name="gender">
              <option value="female" ${user.profile.gender === "female" ? "selected" : ""}>Женский</option>
              <option value="male" ${user.profile.gender === "male" ? "selected" : ""}>Мужской</option>
              <option value="other" ${user.profile.gender === "other" ? "selected" : ""}>Другое</option>
            </select>
          </label>
          <label>Активность
            <select name="activity">
              <option value="low" ${user.profile.activity === "low" ? "selected" : ""}>Низкая</option>
              <option value="medium" ${user.profile.activity === "medium" ? "selected" : ""}>Средняя</option>
              <option value="high" ${user.profile.activity === "high" ? "selected" : ""}>Высокая</option>
            </select>
          </label>
        </div>
        <button class="button" type="submit">Сохранить</button>
      </form>
    </section>
    <section class="card-grid">
      <div class="card">
        <h3>Всего тренировок</h3>
        <p>${stats.total}</p>
      </div>
      <div class="card">
        <h3>Всего км</h3>
        <p>${stats.km.toFixed(1)}</p>
      </div>
      <div class="card">
        <h3>Всего минут</h3>
        <p>${stats.minutes}</p>
      </div>
      <div class="card">
        <h3>Средняя длительность</h3>
        <p>${stats.avgDuration.toFixed(0)} мин</p>
      </div>
    </section>
  `;

  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    updateProfile(user.id, {
      name: formData.get("name"),
      age: Number(formData.get("age")),
      height: Number(formData.get("height")),
      weight: Number(formData.get("weight")),
      gender: formData.get("gender"),
      activity: formData.get("activity"),
    });
    showToast("Профиль обновлён.");
    renderProfile();
  });
};

const renderSettings = () => {
  const settings = getSettings();

  content.innerHTML = `
    <section class="page-title">
      <div>
        <h2>Settings</h2>
        <p>Тема, экспорт и импорт</p>
      </div>
    </section>
    <section class="card">
      <div class="form-row">
        <label>Тема
          <select id="themeSelect">
            <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
            <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark</option>
          </select>
        </label>
      </div>
    </section>
    <section class="card">
      <h3>Экспорт / Импорт данных</h3>
      <div class="form-row">
        <button class="button secondary" id="exportBtn">Экспорт JSON</button>
        <label class="button secondary" for="importFile">Импорт JSON</label>
        <input type="file" id="importFile" accept="application/json" hidden />
      </div>
      <textarea id="exportArea" readonly></textarea>
    </section>
  `;

  document.getElementById("themeSelect").addEventListener("change", (event) => {
    const updated = { ...settings, theme: event.target.value };
    setSettings(updated);
    document.documentElement.dataset.theme = updated.theme;
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const exportArea = document.getElementById("exportArea");
    exportArea.value = localStorage.getItem("fitnessTrackerData");
    showToast("Данные экспортированы.");
  });

  document.getElementById("importFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem("fitnessTrackerData", reader.result);
        showToast("Данные импортированы.");
        window.location.reload();
      } catch (error) {
        showToast("Ошибка импорта.");
      }
    };
    reader.readAsText(file);
  });
};

const renderRoute = (route) => {
  const user = getCurrentUser();
  setUserChip(user);

  switch (route) {
    case "login":
      renderLogin();
      break;
    case "register":
      renderRegister();
      break;
    case "dashboard":
      renderDashboard();
      break;
    case "add-workout":
      renderAddWorkout();
      break;
    case "history":
      renderHistory();
      break;
    case "calendar":
      renderCalendar();
      break;
    case "goals":
      renderGoals();
      break;
    case "achievements":
      renderAchievements();
      break;
    case "friends":
      renderFriends();
      break;
    case "messages":
      renderMessages();
      break;
    case "profile":
      renderProfile();
      break;
    case "settings":
      renderSettings();
      break;
    default:
      renderDashboard();
  }
};

export {
  renderLogin,
  renderRegister,
  renderDashboard,
  renderAddWorkout,
  renderHistory,
  renderCalendar,
  renderGoals,
  renderAchievements,
  renderFriends,
  renderMessages,
  renderProfile,
  renderSettings,
  renderRoute,
  showToast,
};
