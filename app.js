import { gameData } from './questions.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCi3OtCHi58OcgbAP6vclqJWy-sEGWfYDI",
    authDomain: "disanvietnam-9e9ab.firebaseapp.com",
    databaseURL: "https://disanvietnam-9e9ab-default-rtdb.firebaseio.com",
    projectId: "disanvietnam-9e9ab"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let player = { id: "player_" + Math.floor(Math.random() * 100000), name: "", score: 0, time: 0 };
let currentLevel = 0; 
let attemptedPieces = []; 
let countdownInterval; 
let currentLevelQuestions = [];
let isGameLocked = false; 

// Đồng hồ nội bộ của mỗi thiết bị
let globalStartTime = 0;
let isGameFinished = false;
let mainTimerInterval;
let syncTimerInterval; 

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

function shuffleArray(array) {
    let newArray = [...array]; 
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// NGAY KHI CÓ LỆNH BẮT ĐẦU, MÁY SẼ TỰ KÍCH HOẠT ĐỒNG HỒ CỦA NÓ
onValue(ref(db, 'gameStarted'), (snapshot) => {
    isGameLocked = snapshot.val() === true; 
    
    if (isGameLocked) {
        const waitScreen = document.getElementById("wait-screen");
        if (waitScreen) waitScreen.style.display = "none";
        
        if (player.name !== "" && globalStartTime === 0) {
            
            globalStartTime = Date.now(); // Chốt mốc 0.0s chuẩn trên máy người chơi
            
            mainTimerInterval = setInterval(() => {
                if (!isGameFinished) {
                    player.time = (Date.now() - globalStartTime) / 1000;
                    document.getElementById("time-display").innerText = player.time.toFixed(1);
                }
            }, 100);

            syncTimerInterval = setInterval(() => {
                if (!isGameFinished) {
                    update(ref(db, 'players/' + player.id), { time: player.time });
                }
            }, 1000);

            loadLevel(currentLevel);
        }
    }
});

window.startGame = function() {
    if (isGameLocked) {
        showNotification("⛔ Trò chơi đã bắt đầu! Bạn không thể tham gia nữa.", "error");
        return; 
    }

    const nameInput = document.getElementById("player-name-input").value.trim();
    if (!nameInput) {
        showNotification("⚠️ Vui lòng nhập tên của bạn!", "warning");
        return;
    }

    player.name = nameInput;
    document.getElementById("player-name").innerText = player.name;
    
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("wait-screen").style.display = "flex";
    
    set(ref(db, 'players/' + player.id), player);
};

function loadLevel(levelIndex) {
    if (levelIndex >= 5) {
        isGameFinished = true; 
        clearInterval(mainTimerInterval);
        clearInterval(syncTimerInterval);
        player.time = (Date.now() - globalStartTime) / 1000;
        update(ref(db, 'players/' + player.id), player); 
        return window.showLeaderboard();
    }

    const levelData = gameData[levelIndex];
    document.getElementById("level-text").innerText = levelIndex + 1;
    document.getElementById("puzzle-bg").style.backgroundImage = `url('${levelData.image}')`;
    currentLevelQuestions = shuffleArray(levelData.questions);
    
    attemptedPieces = []; 
    for(let i = 1; i <= 4; i++) {
        const piece = document.getElementById(`p${i}`);
        piece.classList.remove("hidden", "disabled-piece");
    }
}

window.openQuestion = function(pieceId) {
    if (attemptedPieces.includes(pieceId)) return;
    const qData = currentLevelQuestions[pieceId - 1];
    document.getElementById("q-text").innerText = qData.q;
    const ansContainer = document.getElementById("answers-container");
    ansContainer.innerHTML = "";
    
    let optionsWithState = qData.options.map((opt, index) => {
        return { text: opt, isCorrect: (index === qData.correct) };
    });
    optionsWithState = shuffleArray(optionsWithState);
    
    optionsWithState.forEach((optObj) => {
        const btn = document.createElement("button");
        btn.innerText = optObj.text;
        btn.onclick = () => checkAnswer(optObj.isCorrect, pieceId); 
        ansContainer.appendChild(btn);
    });

    document.getElementById("question-modal").classList.remove("hidden");
    clearInterval(countdownInterval);
    let timeLeft = 15;
    document.getElementById("q-timer").innerText = timeLeft;

    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("q-timer").innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            handleTimeoutPiece(pieceId);
        }
    }, 1000);
};

function handleTimeoutPiece(pieceId) {
    showNotification("⏳ HẾT GIỜ! Mảnh ghép này đã bị khóa.", "warning");
    attemptedPieces.push(pieceId); 
    const pieceElement = document.getElementById(`p${pieceId}`);
    pieceElement.classList.add("disabled-piece"); 
    document.getElementById("question-modal").classList.add("hidden");
    if(attemptedPieces.length === 4) setTimeout(guessImageQuestion, 1200); 
}

function checkAnswer(isCorrect, pieceId) {
    clearInterval(countdownInterval); 
    attemptedPieces.push(pieceId); 
    const pieceElement = document.getElementById(`p${pieceId}`);

    if (isCorrect) {
        showNotification("🎉 Chính xác! Bạn nhận được 10 điểm.", "success");
        player.score += 10;
        pieceElement.classList.add("hidden"); 
    } else {
        showNotification("❌ Sai rồi! Đáp án được giữ bí mật.", "error");
        pieceElement.classList.add("disabled-piece"); 
    }

    document.getElementById("question-modal").classList.add("hidden");
    update(ref(db, 'players/' + player.id), player);
    document.getElementById("score-display").innerText = player.score;

    if(attemptedPieces.length === 4) setTimeout(guessImageQuestion, 1200); 
}

function guessImageQuestion() {
    const miniWrapper = document.getElementById("mini-puzzle-wrapper"); 
    miniWrapper.innerHTML = ""; 
    const newPuzzle = document.createElement("div");
    newPuzzle.className = "puzzle-circle mini-puzzle";
    newPuzzle.style.backgroundImage = document.getElementById("puzzle-bg").style.backgroundImage;
    
    for(let i = 1; i <= 4; i++) {
        const origPiece = document.getElementById(`p${i}`);
        const newPiece = document.createElement("div");
        newPiece.className = origPiece.className; 
        newPiece.innerHTML = origPiece.innerHTML;
        newPiece.removeAttribute("id"); 
        newPuzzle.appendChild(newPiece);
    }
    miniWrapper.appendChild(newPuzzle);
    document.getElementById("guess-modal").classList.remove("hidden"); 
    document.getElementById("guess-input").value = ""; 
    document.getElementById("guess-input").focus(); 

    clearInterval(countdownInterval);
    let timeLeft = 30;
    document.getElementById("guess-timer").innerText = timeLeft;

    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("guess-timer").innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            handleTimeoutGuess(); 
        }
    }, 1000);
}

function handleTimeoutGuess() {
    showNotification("⏳ HẾT GIỜ! Bạn đã mất cơ hội trả lời.", "warning");
    document.getElementById("guess-modal").classList.add("hidden");
    update(ref(db, 'players/' + player.id), player);
    currentLevel++;
    loadLevel(currentLevel);
}

window.submitGuess = function() {
    clearInterval(countdownInterval);
    const answer = document.getElementById("guess-input").value;

    if(answer && answer.trim().toLowerCase() === gameData[currentLevel].imageAnswer.toLowerCase()) {
        showNotification("🏆 Tuyệt vời! Bạn nhận thêm 20 điểm.", "success");
        player.score += 20;
    } else {
        showNotification("❌ Rất tiếc! Câu trả lời chưa chính xác.", "error");
    }
    
    document.getElementById("guess-modal").classList.add("hidden");
    update(ref(db, 'players/' + player.id), player);
    document.getElementById("score-display").innerText = player.score;
    currentLevel++;
    loadLevel(currentLevel);
};

window.showLeaderboard = function() {
    document.body.innerHTML = `
        <div style="background: rgba(253, 246, 227, 0.95); width: 80%; margin: 50px auto; border: 5px solid var(--gold); border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h1 style="font-family: var(--font-title); color: var(--red); font-size: 3.5rem; margin-top: 0;">BẢNG XẾP HẠNG CHUNG CUỘC</h1>
            <ul id="lb-list" style="font-size: 1.8rem; list-style: none; padding: 0;">Đang tải dữ liệu thành tích...</ul>
        </div>
    `;
    
    onValue(ref(db, 'players'), (snapshot) => {
        const data = snapshot.val();
        if(!data) return;
        
        let playersArr = Object.values(data);
        playersArr.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time;
        });

        const list = document.getElementById("lb-list");
        list.innerHTML = "";
        playersArr.forEach((p, i) => {
            let trophy = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : ""));
            list.innerHTML += `
                <li style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0; border-bottom: 1px dashed var(--gold); padding-bottom: 15px;">
                    <div style="color: var(--red); font-family: var(--font-title); font-size: 2.2rem; width: 160px; text-align: left; white-space: nowrap;"><strong>TOP ${i+1} ${trophy}</strong></div> 
                    <div style="flex: 1; text-align: left; margin-left: 20px; font-weight: bold;">${p.name}</div>
                    <div style="color: #b8860b; font-size: 2rem; width: 180px; text-align: right; white-space: nowrap;"><b>Điểm: ${p.score}</b></div> 
                    <div style="font-size: 1.5rem; color: #555; width: 250px; text-align: right; white-space: nowrap;">⏱ Tổng: ${p.time.toFixed(1)}s</div>
                </li>`;
        });
    });
};