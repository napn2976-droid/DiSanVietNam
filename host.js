import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
    let players = Object.values(data);
    
    document.getElementById("count-display").innerText = players.length;
    players.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });
    
    const listEl = document.getElementById("live-leaderboard");
    listEl.innerHTML = players.map((p, i) => {
        let trophy = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : ""));
        return `<li style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; border-bottom: 1px dashed var(--gold); padding: 15px; background-color: white; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <div style="font-family: var(--font-title); font-size: 1.8rem; color: var(--red); width: 120px; text-align: left;"><strong>TOP ${i+1} ${trophy}</strong></div>
            <div style="flex: 1; text-align: left; font-weight: bold; font-size: 1.5rem; color: #333;">${p.name}</div>
            <div style="text-align: right; color: #b8860b; font-size: 1.5rem; font-weight: bold; width: 150px;">${p.score} <span style="font-size: 1rem; color: #333; font-weight: normal;">điểm</span></div>
            <div style="text-align: right; color: #555; font-size: 1.2rem; width: 120px;">⏱ ${p.time.toFixed(1)}s</div>
        </li>`;
    }).join("");
});

// NÚT BẮT ĐẦU: Ghi lại chính xác mốc thời gian của Host
window.startGlobalGame = () => {
    update(ref(db), { gameStarted: true, startTime: Date.now() })
        .then(() => alert("✅ Đã phát lệnh BẮT ĐẦU! Màn hình người chơi đã mở và đồng hồ đang chạy."))
        .catch((error) => alert("❌ Lỗi mạng: " + error));
};

// NÚT RESET: Xóa luôn mốc thời gian cũ để tránh lỗi ván sau
window.resetGameData = () => {
    if (confirm("CẢNH BÁO: Xóa sạch toàn bộ dữ liệu người chơi và MỞ LẠI PHÒNG?")) {
        set(ref(db), { players: null, gameStarted: false, startTime: null })
            .then(() => alert("✅ Đã làm mới phòng! Người chơi mới có thể tham gia ngay bây giờ."))
            .catch((error) => alert("❌ Lỗi mạng: " + error));
    }
};