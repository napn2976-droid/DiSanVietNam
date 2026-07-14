import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCi3OtCHi58OcgbAP6vclqJWy-sEGWfYDI",
    authDomain: "disanvietnam-9e9ab.firebaseapp.com",
    databaseURL: "https://disanvietnam-9e9ab-default-rtdb.firebaseio.com",
    projectId: "disanvietnam-9e9ab"
};
const db = getDatabase(initializeApp(firebaseConfig));

onValue(ref(db, 'players'), (snapshot) => {
    const data = snapshot.val();
    const countEl = document.getElementById("count-display");
    const listEl = document.getElementById("live-leaderboard");
    
    if(!data) {
        countEl.innerText = "0";
        listEl.innerHTML = "<li>Chưa có ai tham gia</li>";
        return;
    }
    
    const players = Object.values(data);
    countEl.innerText = players.length;
    
    listEl.innerHTML = players.sort((a,b) => b.score - a.score).map(p => 
        `<li style="margin: 10px; padding: 10px; background: white; border-radius: 5px;">${p.name}: ${p.score} điểm</li>`
    ).join("");
});

window.startGlobalGame = () => {
    update(ref(db), { gameStarted: true });
    alert("Đã bắt đầu game cho tất cả người chơi!");
};

window.resetGameData = () => {
    if (confirm("Reset toàn bộ?")) {
        set(ref(db), { players: null, gameStarted: false });
    }
};