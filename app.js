import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const db = getDatabase(initializeApp({ /* Config của bạn */ }));

// Lắng nghe trạng thái bắt đầu từ Host
onValue(ref(db, 'gameStarted'), (snapshot) => {
    if (snapshot.val() === true) {
        document.getElementById("wait-screen").style.display = "none";
    }
});