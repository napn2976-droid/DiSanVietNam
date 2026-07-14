import { gameData } from './questions.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const db = getDatabase(initializeApp({ /* Config của bạn */ }));
let player = { id: "p_" + Date.now(), name: "", score: 0, time: 0 };

// 1. Nhập tên xong mới đẩy lên và vào trạng thái chờ
window.startGame = function() {
    const name = document.getElementById("player-name-input").value.trim();
    if (!name) return alert("Vui lòng nhập tên!");
    
    player.name = name;
    document.getElementById("start-screen").classList.add("hidden");
    
    // Hiển thị màn hình chờ ngay sau khi nhập tên
    document.getElementById("wait-screen").style.display = "flex";
    
    set(ref(db, 'players/' + player.id), player);
};

// 2. Lắng nghe Host bấm nút Bắt đầu
onValue(ref(db, 'gameStarted'), (snapshot) => {
    if (snapshot.val() === true) {
        document.getElementById("wait-screen").style.display = "none";
        // Bắt đầu vào game...
    }
});