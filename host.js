import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const db = getDatabase(initializeApp({ /* Config của bạn */ }));

onValue(ref(db, 'players'), (snapshot) => {
    const data = snapshot.val() || {};
    const players = Object.values(data);
    
    // Cập nhật số lượng
    document.getElementById("count-display").innerText = players.length;
    
    // Cập nhật danh sách
    const listEl = document.getElementById("live-leaderboard");
    listEl.innerHTML = players.map(p => 
        `<li style="background: white; margin: 5px; padding: 10px;">${p.name} - ${p.score} điểm</li>`
    ).join("");
});

// Nút điều khiển
window.startGlobalGame = () => update(ref(db), { gameStarted: true });
window.resetGameData = () => {
    if (confirm("Xóa sạch dữ liệu?")) set(ref(db), { players: null, gameStarted: false });
};