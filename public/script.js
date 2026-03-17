// --- КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ ---
const API_KEY = "AIzaSyCzHRebX56fsd4U317CRfAwaj51t7GuPmk";
const APPS_SCRIPT_BASE_URL = "https://script.google.com/macros/s/AKfycbyQzyDQHLvd9u73fayFUA806QlbWLhlIbi4o7KzxmdS4ACRwEtupI5YgO3F7l4yukmZ/exec";
const SECRET_TOKEN = "BI_Security_2026_TopSecret"; // Должен совпадать с тем, что в Apps Script
const WA_PHONE = "77783600055";

let biObjectsData = [];

// --- 1. ЗАГРУЗКА ДАННЫХ (С ЗАЩИТОЙ ТОКЕНОМ) ---
async function initPortal() {
    try {
        const secureUrl = `${APPS_SCRIPT_BASE_URL}?token=${SECRET_TOKEN}`;
        const response = await fetch(secureUrl);
        const result = await response.json();

        if (result.status === "error") {
            throw new Error(result.message);
        }

        biObjectsData = result; 
        console.log("База BI Group (11 объектов) успешно защищена и загружена");
    } catch (err) {
        console.error("Ошибка авторизации в базе данных:", err);
    }
}

// --- 2. ЛОГИКА ОБЩЕНИЯ С GEMINI 1.5 FLASH ---
async function askGemini(userQuestion) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    // Формируем строгий контекст для ИИ, чтобы он не "фантазировал"
    const aiContext = `
        Ты — официальный ИИ-ассистент agihome.asia для компании BI Group.
        Твоя база знаний об объектах: ${JSON.stringify(biObjectsData)}.
        Основные правила:
        1. Отвечай на основе цен и данных из базы (Capital Park, MoD, GreenLine, BI City Seoul и др.).
        2. Если спрашивают про ЖК Atlant — это наш приоритетный пилотный проект.
        3. Если данных по конкретному вопросу нет, вежливо направляй в WhatsApp: https://wa.me/${WA_PHONE}
        4. Будь кратким, деловым и помогай клиенту выбрать квартиру.
    `;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${aiContext}\n\nКлиент спрашивает: ${userQuestion}` }] }]
        })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// --- 3. УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ЧАТА ---
async function handleSend() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";

    const chatBox = document.getElementById("chatBox");
    const loadingId = "loading-" + Date.now();
    appendMessage("ai", "Анализирую базу объектов...", loadingId);

    try {
        const aiResponse = await askGemini(text);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.innerHTML = `<strong>Gemini:</strong> ${aiResponse}`;
    } catch (e) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.innerText = "Ошибка связи. Напишите менеджеру в WhatsApp.";
    }
}

function appendMessage(sender, text, id = "") {
    const chatBox = document.getElementById("chatBox");
    const msgDiv = document.createElement("div");
    msgDiv.style.marginBottom = "15px";
    msgDiv.style.textAlign = sender === "user" ? "right" : "left";
    if (id) msgDiv.id = id;

    msgDiv.innerHTML = `
        <div style="display: inline-block; padding: 10px; border-radius: 10px; background: ${sender === 'user' ? '#0052cc' : '#f0f0f0'}; color: ${sender === 'user' ? 'white' : 'black'}; max-width: 80%;">
            <strong>${sender === 'user' ? 'Вы' : 'Gemini'}:</strong> ${text}
        </div>
    `;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

// Запуск при загрузке страницы
initPortal();