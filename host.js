import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ĐÃ THÊM MÃ FIREBASE THẬT
const firebaseConfig = {
    apiKey: "AIzaSyCi3OtCHi58OcgbAP6vclqJWy-sEGWfYDI",
    authDomain: "disanvietnam-9e9ab.firebaseapp.com",
    databaseURL: "https://disanvietnam-9e9ab-default-rtdb.firebaseio.com",
    projectId: "disanvietnam-9e9ab"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

onValue(ref(db, 'players'), (snapshot) => {
    const data = snapshot.val() || {};
    const players = Object.values(data);
    
    // Cập nhật số lượng
    document.getElementById("count-display").innerText = players.length;
    
    // Cập nhật danh sách
    const listEl = document.getElementById("live-leaderboard");
    listEl.innerHTML = players.map(p => 
        `<li style="background: white; margin: 5px; padding: 10px; border-radius: 5px;">${p.name} - ${p.score} điểm</li>`
    ).join("");
});

// Nút điều khiển Bắt đầu
window.startGlobalGame = () => update(ref(db), { gameStarted: true });

// Nút Reset
window.resetGameData = () => {
    if (confirm("Xóa sạch toàn bộ dữ liệu người chơi?")) {
        set(ref(db), { players: null, gameStarted: false });
    }
};