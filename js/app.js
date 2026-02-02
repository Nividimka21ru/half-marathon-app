import { getCurrentUser, login, register, logout } from "./modules/auth.js";
import { getSettings } from "./modules/storage.js";
import { renderRoute, showToast } from "./modules/ui.js";

const themeToggle = document.getElementById("themeToggle");
const logoutButton = document.getElementById("logoutButton");
const sidebar = document.getElementById("sidebar");

const protectedRoutes = [
  "dashboard",
  "add-workout",
  "history",
  "calendar",
  "goals",
  "achievements",
  "friends",
  "messages",
  "profile",
  "settings",
];

const authRoutes = ["login", "register"];

const parseRoute = () => {
  const hash = window.location.hash || "#/dashboard";
  const route = hash.replace("#/", "");
  return route || "dashboard";
};

const updateNav = (route, isAuthenticated) => {
  sidebar.style.display = isAuthenticated ? "block" : "none";
  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });
};

const handleRoute = () => {
  const route = parseRoute();
  const user = getCurrentUser();
  const isAuthenticated = Boolean(user);

  if (!isAuthenticated && protectedRoutes.includes(route)) {
    window.location.hash = "#/login";
    return;
  }

  if (isAuthenticated && authRoutes.includes(route)) {
    window.location.hash = "#/dashboard";
    return;
  }

  updateNav(route, isAuthenticated);
  renderRoute(route);

  if (route === "login") {
    const form = document.getElementById("loginForm");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const result = login({
        loginValue: formData.get("loginValue"),
        password: formData.get("password"),
      });
      if (result.ok) {
        showToast("Вы вошли.");
        window.location.hash = "#/dashboard";
      } else {
        showToast(result.message);
      }
    });
  }

  if (route === "register") {
    const form = document.getElementById("registerForm");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      if (formData.get("password") !== formData.get("confirmPassword")) {
        showToast("Пароли не совпадают.");
        return;
      }
      const result = register({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
      });
      if (result.ok) {
        showToast("Аккаунт создан.");
        window.location.hash = "#/dashboard";
      } else {
        showToast(result.message);
      }
    });
  }
};

logoutButton.addEventListener("click", () => {
  logout();
  showToast("Вы вышли.");
  window.location.hash = "#/login";
});

const settings = getSettings();
document.documentElement.dataset.theme = settings.theme;

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = current;
  const updated = { ...getSettings(), theme: current };
  localStorage.setItem("fitnessTrackerSettings", JSON.stringify(updated));
});

window.addEventListener("hashchange", handleRoute);
window.addEventListener("load", handleRoute);
