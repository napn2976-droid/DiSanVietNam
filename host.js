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

// HÀM TẠO THÔNG BÁO NỔI DÀNH CHO MÁY CHỦ
function showNotification(msg, type) {
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "1"; toast.style.top = "30px"; }, 10);
    setTimeout(() => {
        toast.style.opacity = "0"; toast.style.top = "-50px";
        setTimeout(() => toast.remove(), 400);
    }, 2000);
}

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
            <div style="font-family: var(--font-title); font-size: 1.8rem; color: var(--red); width: 150px; text-align: left; white-space: nowrap;"><strong>TOP ${i+1} ${trophy}</strong></div>
            <div style="flex: 1; text-align: left; font-weight: bold; font-size: 1.5rem; color: #333; padding-left: 20px;">${p.name}</div>
            <div style="text-align: right; color: #b8860b; font-size: 1.5rem; font-weight: bold; width: 150px; white-space: nowrap;">${p.score} <span style="font-size: 1rem; color: #333; font-weight: normal;">điểm</span></div>
            <div style="text-align: right; color: #555; font-size: 1.2rem; width: 120px; white-space: nowrap;">⏱ ${p.time.toFixed(1)}s</div>
        </li>`;
    }).join("");
});

window.startGlobalGame = () => {
    update(ref(db), { gameStarted: true }) // Không truyền startTime lên nữa
        .then(() => showNotification("✅ Đã phát lệnh BẮT ĐẦU!", "success"))
        .catch((error) => showNotification("❌ Lỗi mạng: " + error, "error"));
};

window.resetGameData = () => {
    // Chạy thẳng lệnh xóa phòng mà không cần hỏi lại
    set(ref(db), { players: null, gameStarted: false })
        .then(() => showNotification("✅ Đã làm mới phòng chờ!", "success"))
        .catch((error) => showNotification("❌ Lỗi mạng: " + error, "error"));
};