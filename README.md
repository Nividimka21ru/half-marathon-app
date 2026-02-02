# Fitness Tracker (Static Demo)

## Структура проекта
```
.
├── index.html
├── css
│   └── style.css
└── js
    ├── app.js
    └── modules
        ├── achievements.js
        ├── auth.js
        ├── calendar.js
        ├── friends.js
        ├── messages.js
        ├── storage.js
        ├── ui.js
        ├── utils.js
        └── workouts.js
```

## Как запустить
1. Откройте `index.html` в браузере (офлайн).
2. Либо поднимите локальный сервер: `python -m http.server`.

## Демо-данные
* Логин: `demo`
* Пароль: `demo123`

## Что внутри
* Одностраничное приложение на HTML/CSS/JS.
* Навигация по hash-роутам.
* Данные, пользователи и сообщения — в `localStorage`.
