/**
 * script.js - Верефицированная версия для agihome.asia
 * Включает: Загрузку данных, Чат с Gemini и CRM-интеграцию
 */

const API_KEY = "AIzaSyCzHRebX56fsd4U317CRfAwaj51t7GuPmk";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQzyDQHLvd9u73fayFUA806QlbWLhlIbi4o7KzxmdS4ACRwEtupI5YgO3F7l4yukmZ/exec";
const SECRET_TOKEN = "BI_Security_2026_TopSecret"; 

let biObjectsData = [];

// 1. Инициализация и загрузка базы объектов
async function initPortal() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?token=${SECRET_TOKEN}`);
        const result = await response.json();
        if (result.status === "error") throw new Error(result.message);
        biObjectsData = result;
        console.log("Система: Данные по 11 объектам BI Group загружены.");
    } catch (err) {
        console.error("Критическая ошибка загрузки базы:", err);
    }
}

// 2. Отправка данных в CRM (Google Sheets)
async function saveLead(question, answer, objectName = "Общий поиск") {
    try {
        await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Важно для работы с Google Apps Script
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: SECRET_TOKEN,
                question: question,
                answer: answer,
                object: objectName
            })
        });
        console.log("CRM: Данные лида зафиксированы.");
    } catch (e) {
        console.warn("CRM: Ошибка записи, но чат продолжает работу.");
    }
}

// 3. Логика общения с Gemini
async function askGemini(userQuestion) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const aiContext = `Ты — официальный AI-брокер BI Group на портале agihome.asia. 
    Твои данные: ${JSON.stringify(biObjectsData)}. 
    Если спрашивают про ЖК Atlant — это наш флагман. WhatsApp для связи: +77783600055.`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${aiContext}\n\nВопрос клиента: ${userQuestion}` }] }]
        })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;

    // СРАЗУ СОХРАНЯЕМ В CRM
    saveLead(userQuestion, aiText);

    return aiText;
}

// 4. Интерфейс чата
async function handleSend() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";

    const loadingId = "load-" + Date.now();
    appendMessage("ai", "Минутку, сверяюсь с базой объектов...", loadingId);

    try {
        const aiResponse = await askGemini(text);
        document.getElementById(loadingId).innerHTML = `<strong>Gemini:</strong> ${aiResponse}`;
    } catch (e) {
        document.getElementById(loadingId).innerText = "Извините, произошла техническая ошибка. Попробуйте позже.";
    }
}

function appendMessage(sender, text, id = "") {
    const chatBox = document.getElementById("chatBox");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    if (id) msgDiv.id = id;
    msgDiv.innerHTML = `<div class="message-text"><strong>${sender === 'user' ? 'Вы' : 'Gemini'}:</strong> ${text}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function openLayout(name) {
    const modal = document.getElementById("layoutModal");
    const content = document.getElementById("modalContent");
    modal.style.display = "block";
    content.innerHTML = `<h3>Планировки ${name}</h3><p>Загрузка актуальных чертежей из базы Bigroup...</p>`;
}

function closeModal() {
    document.getElementById("layoutModal").style.display = "none";
}

// Старт
initPortal();