import { gameData } from './questions.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 1. CẤU HÌNH FIREBASE (THAY MÃ CỦA BẠN VÀO ĐÂY)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCi3OtCHi58OcgbAP6vclqJWy-sEGWfYDI", // Đã khôi phục lại từ bản cũ của bạn
    authDomain: "disanvietnam-9e9ab.firebaseapp.com",
    databaseURL: "https://disanvietnam-9e9ab-default-rtdb.firebaseio.com",
    projectId: "disanvietnam-9e9ab"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let player = {
    id: "player_" + Math.floor(Math.random() * 100000),
    name: "",
    score: 0,
    time: 0
};

let currentLevel = 0; 
let questionStartTime = 0;
let attemptedPieces = []; 
let countdownInterval; 

// Biến lưu trữ mảng câu hỏi đã được xáo trộn cho riêng người chơi này
let currentLevelQuestions = [];

// ==========================================
// THUẬT TOÁN ĐẢO NGẪU NHIÊN (SHUFFLE)
// ==========================================
function shuffleArray(array) {
    let newArray = [...array]; // Tạo bản sao để không làm hỏng dữ liệu gốc
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ==========================================
// 3. LOGIC MÀN HÌNH CHỜ (START GAME)
// ==========================================
window.startGame = function() {
    const nameInput = document.getElementById("player-name-input").value.trim();
    if (!nameInput) return alert("Vui lòng nhập tên của bạn để bắt đầu!");

    player.name = nameInput;
    document.getElementById("player-name").innerText = player.name;
    document.getElementById("start-screen").classList.add("hidden");

    loadLevel(currentLevel);
    set(ref(db, 'players/' + player.id), player);
};

// ==========================================
// 4. LOGIC VẬN HÀNH GAME
// ==========================================
function loadLevel(levelIndex) {
    if (levelIndex >= 5) return window.showLeaderboard();

    const levelData = gameData[levelIndex];
    document.getElementById("level-text").innerText = levelIndex + 1;
    document.getElementById("puzzle-bg").style.backgroundImage = `url('${levelData.image}')`;
    
    // Đảo ngẫu nhiên 4 câu hỏi của Level này (Mỗi máy một thứ tự khác nhau)
    currentLevelQuestions = shuffleArray(levelData.questions);
    
    attemptedPieces = []; 
    for(let i = 1; i <= 4; i++) {
        const piece = document.getElementById(`p${i}`);
        piece.classList.remove("hidden", "disabled-piece");
    }
}

// ---------------------------------------------
// XỬ LÝ CÂU HỎI TRẮC NGHIỆM MẢNH GHÉP (15 GIÂY)
// ---------------------------------------------
window.openQuestion = function(pieceId) {
    if (attemptedPieces.includes(pieceId)) return;

    // Lấy câu hỏi từ mảng đã được xáo trộn thay vì mảng gốc
    const qData = currentLevelQuestions[pieceId - 1];
    document.getElementById("q-text").innerText = qData.q;
    
    const ansContainer = document.getElementById("answers-container");
    ansContainer.innerHTML = "";
    
    // XỬ LÝ ĐẢO ĐÁP ÁN: Gắn cờ (isCorrect) để biết đáp án nào là đúng trước khi đảo
    let optionsWithState = qData.options.map((opt, index) => {
        return { 
            text: opt, 
            isCorrect: (index === qData.correct) 
        };
    });
    
    // Đảo ngẫu nhiên vị trí các đáp án
    optionsWithState = shuffleArray(optionsWithState);
    
    // Hiển thị đáp án ra màn hình
    optionsWithState.forEach((optObj) => {
        const btn = document.createElement("button");
        btn.innerText = optObj.text;
        btn.onclick = () => checkAnswer(optObj.isCorrect, pieceId); // Truyền thẳng trạng thái Đúng/Sai
        ansContainer.appendChild(btn);
    });

    document.getElementById("question-modal").classList.remove("hidden");
    
    // Khởi động đồng hồ 15 giây
    clearInterval(countdownInterval);
    let timeLeft = 15;
    document.getElementById("q-timer").innerText = timeLeft;
    questionStartTime = Date.now();

    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("q-timer").innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            handleTimeoutPiece(pieceId);
        }
    }, 1000);
};

// Hàm xử lý khi HẾT 15 GIÂY trả lời mảnh ghép
function handleTimeoutPiece(pieceId) {
    alert("HẾT GIỜ! Bạn đã quá thời gian 15 giây. Mảnh ghép này sẽ bị khóa.");
    player.time += 15;
    attemptedPieces.push(pieceId); 

    const pieceElement = document.getElementById(`p${pieceId}`);
    pieceElement.classList.add("disabled-piece"); 
    
    document.getElementById("question-modal").classList.add("hidden");
    updateUI();
    update(ref(db, 'players/' + player.id), player);

    if(attemptedPieces.length === 4) {
        setTimeout(guessImageQuestion, 1200); 
    }
}

// Hàm xử lý khi CÓ TRẢ LỜI (Dù đúng hay sai)
function checkAnswer(isCorrect, pieceId) {
    clearInterval(countdownInterval); 
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    player.time += timeTaken;
    
    attemptedPieces.push(pieceId); 
    const pieceElement = document.getElementById(`p${pieceId}`);

    // Kiểm tra trực tiếp biến isCorrect thay vì so sánh index như trước
    if (isCorrect) {
        alert("Chính xác! Bạn nhận được 10 điểm.");
        player.score += 10;
        pieceElement.classList.add("hidden"); 
    } else {
        alert("Sai rồi! Rất tiếc, mảnh ghép này sẽ bị khóa lại và đáp án được giữ bí mật.");
        pieceElement.classList.add("disabled-piece"); 
    }

    document.getElementById("question-modal").classList.add("hidden");
    updateUI();
    update(ref(db, 'players/' + player.id), player);

    if(attemptedPieces.length === 4) {
        setTimeout(guessImageQuestion, 1200); 
    }
}

// ---------------------------------------------
// XỬ LÝ CÂU HỎI ĐOÁN HÌNH ẢNH CHUNG CUỘC (30 GIÂY)
// ---------------------------------------------
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
    questionStartTime = Date.now(); 

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
    alert("HẾT GIỜ! Bạn đã mất cơ hội trả lời câu hỏi quyết định.");
    player.time += 30;
    
    document.getElementById("guess-modal").classList.add("hidden");
    update(ref(db, 'players/' + player.id), player);
    updateUI();
    
    currentLevel++;
    loadLevel(currentLevel);
}

window.submitGuess = function() {
    clearInterval(countdownInterval);
    const answer = document.getElementById("guess-input").value;
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    player.time += timeTaken;

    if(answer && answer.trim().toLowerCase() === gameData[currentLevel].imageAnswer.toLowerCase()) {
        alert("Tuyệt vời! Bạn nhận thêm 20 điểm.");
        player.score += 20;
    } else {
        alert("Rất tiếc! Câu trả lời của bạn chưa chính xác. Đáp án sẽ được giữ bí mật để đảm bảo tính công bằng!");
    }
    
    document.getElementById("guess-modal").classList.add("hidden");
    update(ref(db, 'players/' + player.id), player);
    updateUI();
    
    currentLevel++;
    loadLevel(currentLevel);
};

// ---------------------------------------------
// GIAO DIỆN VÀ BẢNG XẾP HẠNG
// ---------------------------------------------
function updateUI() {
    document.getElementById("score-display").innerText = player.score;
    document.getElementById("time-display").innerText = player.time.toFixed(1);
}

window.showLeaderboard = function() {
    document.body.innerHTML = `
        <div style="background: rgba(253, 246, 227, 0.95); width: 80%; margin: 50px auto; border: 5px solid var(--gold); border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h1 style="font-family: var(--font-title); color: var(--red); font-size: 3.5rem; margin-top: 0;">BẢNG XẾP HẠNG CHUNG CUỘC</h1>
            <ul id="lb-list" style="font-size: 1.8rem; list-style: none; padding: 0;">Đang tải dữ liệu thành tích...</ul>
        </div>
    `;
    
    onValue(ref(db, 'players'), (snapshot) => {
        const data = snapshot.val();
        if(!data) {
            document.getElementById("lb-list").innerHTML = "Chưa có dữ liệu người chơi.";
            return;
        }
        
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
                <li style="margin: 20px 0; border-bottom: 1px dashed var(--gold); padding-bottom: 15px;">
                    <strong style="color: var(--red); font-family: var(--font-title); font-size: 2.2rem;">TOP ${i+1} ${trophy}</strong> 
                    <span style="display:inline-block; width: 300px; text-align: left; margin-left: 20px; font-weight: bold;">${p.name}</span>
                    <b style="color: #b8860b; font-size: 2rem;">Điểm: ${p.score}</b> 
                    <span style="font-size: 1.5rem; color: #555; margin-left: 20px;">⏱ Tổng thời gian: ${p.time.toFixed(1)}s</span>
                </li>`;
        });
    });
};

window.resetGameData = function() {
    const confirmReset = confirm("CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu người chơi và Bảng xếp hạng không?");
    if (confirmReset) {
        set(ref(db, 'players'), null)
            .then(() => {
                alert("Đã reset dữ liệu thành công! Hãy tải lại (F5) trang web để bắt đầu lượt mới.");
                location.reload(); 
            })
            .catch((error) => {
                alert("Lỗi khi reset: " + error);
            });
    }
};