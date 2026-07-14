import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// CẤU HÌNH FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCi3OtCHi58OcgbAP6vclqJWy-sEGWfYDI",
    authDomain: "disanvietnam-9e9ab.firebaseapp.com",
    databaseURL: "https://disanvietnam-9e9ab-default-rtdb.firebaseio.com",
    projectId: "disanvietnam-9e9ab"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// LẮNG NGHE DỮ LIỆU REALTIME
// ==========================================
onValue(ref(db, 'players'), (snapshot) => {
    const data = snapshot.val();
    const listElement = document.getElementById("live-leaderboard");
    
    if(!data) {
        listElement.innerHTML = "<li style='text-align: center; color: #888; margin-top: 20px;'>Chưa có người chơi nào tham gia lượt này.</li>";
        return;
    }
    
    let playersArr = Object.values(data);
    
    // Sắp xếp: Điểm cao xếp trước -> Thời gian thấp xếp trước
    playersArr.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
    });

    listElement.innerHTML = ""; 
    
    playersArr.forEach((p, i) => {
        let trophy = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : ""));
        let bgColor = i < 3 ? "rgba(197, 160, 89, 0.1)" : "transparent";
        let fontWeight = i < 3 ? "bold" : "normal";
        
        listElement.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; border-bottom: 1px dashed var(--gold); padding: 15px; background-color: ${bgColor}; border-radius: 10px;">
                <div style="flex: 1; font-family: var(--font-title); font-size: 2.2rem; color: var(--red);">
                    <strong>TOP ${i+1} ${trophy}</strong>
                </div>
                <div style="flex: 2; text-align: left; font-weight: ${fontWeight};">
                    ${p.name}
                </div>
                <div style="flex: 1; text-align: right; color: #b8860b; font-size: 2rem; font-weight: bold;">
                    ${p.score} <span style="font-size: 1.2rem; color: #333; font-weight: normal;">điểm</span>
                </div>
                <div style="flex: 1; text-align: right; color: #555; font-size: 1.5rem;">
                    ⏱ ${p.time.toFixed(1)}s
                </div>
            </li>`;
    });
});

// ==========================================
// HÀM RESET DỮ LIỆU DÀNH CHO HOST
// ==========================================
window.resetGameData = function() {
    const confirmReset = confirm("CẢNH BÁO MÁY CHỦ: Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu người chơi hiện tại để bắt đầu lượt mới không?");
    
    if (confirmReset) {
        set(ref(db, 'players'), null)
            .then(() => {
                alert("Đã làm mới dữ liệu thành công! Máy chủ đang chờ người chơi mới.");
            })
            .catch((error) => {
                alert("Lỗi khi reset: " + error);
            });
    }
};