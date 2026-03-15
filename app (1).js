// =====================================================
//  app.js  —  Reaction Time Test  |  all game logic
// =====================================================


// -------------------------------------------------
//  GAME STATE VARIABLES
// -------------------------------------------------

let state      = "idle";   // "idle" | "wait" | "go"
let attempts   = [];       // array of recorded ms values
let startTime;             // performance.now() snapshot when box turned green
let timer;                 // holds the setTimeout reference so we can cancel it
let playerName = "";       // set once from the name modal

const TOTAL_ATTEMPTS = 5;  // how many rounds per test


// -------------------------------------------------
//  NAME MODAL
// -------------------------------------------------

// Called when the player clicks "Enter the Arena"
function setPlayerName() {

    const input = document.getElementById("modalNameInput");
    const name  = input.value.trim();

    // Don't allow an empty name
    if (!name) {
        input.style.borderColor = "var(--danger)";
        input.placeholder       = "Please enter a name!";

        // Reset the error styling after 1.5 seconds
        setTimeout(() => {
            input.style.borderColor = "";
            input.placeholder       = "Your name...";
        }, 1500);

        return;
    }

    // Store the name globally
    playerName = name;

    // Show it in the nav bar
    document.getElementById("playerNameDisplay").textContent = name.toUpperCase();

    // Pre-fill the forum name field so they don't have to type it again
    document.getElementById("forumName").value = name;

    // Hide the modal
    document.getElementById("nameModal").style.display = "none";
}

// Allow pressing Enter to confirm the name
document.getElementById("modalNameInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        setPlayerName();
    }
});


// -------------------------------------------------
//  PAGE NAVIGATION
// -------------------------------------------------

// Swap the visible page when a nav button is clicked
function showPage(pageId, clickedButton) {

    // Hide all pages
    document.querySelectorAll(".page").forEach(function(page) {
        page.classList.remove("active");
    });

    // Show the requested page
    document.getElementById(pageId).classList.add("active");

    // Update nav button highlight
    document.querySelectorAll(".nav-links button").forEach(function(btn) {
        btn.classList.remove("active");
    });
    clickedButton.classList.add("active");

    // Render dynamic content if switching to these pages
    if (pageId === "leaderboard") renderLeaderboard();
    if (pageId === "forum")       renderForum();
}


// -------------------------------------------------
//  PROGRESS DOTS
// -------------------------------------------------

// Redraws the 5 dots based on current attempts count and state
function updateDots() {

    for (let i = 0; i < TOTAL_ATTEMPTS; i++) {

        const dot = document.getElementById("dot" + i);

        // Reset to blank first
        dot.className = "attempt-dot";

        if (i < attempts.length) {
            // This attempt is already done — fill it green
            dot.classList.add("done");

        } else if (i === attempts.length && state !== "idle") {
            // This is the current attempt in progress — blink amber
            dot.classList.add("current");
        }
    }
}


// -------------------------------------------------
//  TEST FLOW
// -------------------------------------------------

// Called by the Start button
function startTest() {

    attempts = [];

    updateDots();
    nextAttempt();

    // Swap Start → Reset button
    document.getElementById("startBtn").style.display  = "none";
    document.getElementById("resetBtn").style.display  = "inline";

    // Clear any leftover results from a previous run
    document.getElementById("resultsPanel").innerHTML  = "";
}


// Sets up one round of the reaction test
function nextAttempt() {

    // If we've done all attempts, show the final results
    if (attempts.length >= TOTAL_ATTEMPTS) {
        showResults();
        return;
    }

    // Switch to wait state — box goes amber
    state = "wait";
    updateDots();

    const box    = document.getElementById("reactionBox");
    box.className = "box wait";
    box.innerHTML = "<h2>Wait for green...</h2>";

    // After a random delay between 1.5s and 3.5s, turn the box green
    const randomDelay = 1500 + Math.random() * 2000;

    timer = setTimeout(function() {

        state     = "go";
        startTime = performance.now();

        box.className = "box go";
        box.innerHTML = "<h1>CLICK!</h1>";

    }, randomDelay);
}


// Called when the player clicks the reaction box
function handleBoxClick() {

    // Clicked too early — penalise and restart the attempt
    if (state === "wait") {

        clearTimeout(timer);

        const box      = document.getElementById("reactionBox");
        box.className  = "box idle";
        box.style.borderColor = "var(--danger)";
        box.innerHTML  = "<h2>Too Early!</h2>";
        state          = "idle";

        // Wait a second then try again
        setTimeout(function() {
            box.style.borderColor = "";
            nextAttempt();
        }, 1000);

        return;
    }

    // Clicked at the right time — record the reaction time
    if (state === "go") {

        const reactionTime = Math.round(performance.now() - startTime);
        attempts.push(reactionTime);
        updateDots();

        const box      = document.getElementById("reactionBox");
        box.className  = "box idle";

        // Show the time in big text inside the box
        box.innerHTML = `
            <h1 style="
                color: var(--accent);
                font-family: 'Bebas Neue', sans-serif;
                font-size: 3rem;
                letter-spacing: 4px;
            ">
                ${reactionTime}
                <span style="font-size: 1.2rem; color: var(--muted);"> ms</span>
            </h1>
        `;

        state = "idle";

        // Short pause then move to next attempt
        setTimeout(nextAttempt, 800);
    }
}


// Stops everything and returns to the initial state
function resetTest() {

    clearTimeout(timer);

    state    = "idle";
    attempts = [];

    updateDots();

    const box      = document.getElementById("reactionBox");
    box.className  = "box idle";
    box.innerHTML  = "<h2>Click Start</h2>";

    // Swap Reset → Start button
    document.getElementById("startBtn").style.display = "inline";
    document.getElementById("resetBtn").style.display = "none";

    // Clear results
    document.getElementById("resultsPanel").innerHTML = "";
}


// -------------------------------------------------
//  RESULTS
// -------------------------------------------------

// Calculates stats and renders result cards below the box
function showResults() {

    state = "idle";
    updateDots();

    const box      = document.getElementById("reactionBox");
    box.className  = "box idle";
    box.innerHTML  = "<h2>Done!</h2>";

    // Calculate average and best
    const total   = attempts.reduce(function(sum, val) { return sum + val; }, 0);
    const average = Math.round(total / attempts.length);
    const best    = Math.min(...attempts);

    // Render result cards + save button
    document.getElementById("resultsPanel").innerHTML = `
        <div class="results-grid">

            <div class="result-card">
                <div class="result-label">Average</div>
                <div class="result-value">${average}<span> ms</span></div>
            </div>

            <div class="result-card">
                <div class="result-label">Best</div>
                <div class="result-value">${best}<span> ms</span></div>
            </div>

        </div>

        <button class="btn btn-primary" onclick="saveScore(${average}, ${best})">
            Save Score
        </button>
    `;
}


// -------------------------------------------------
//  LEADERBOARD  (uses localStorage)
// -------------------------------------------------

// Saves the current run to localStorage and disables the save button
function saveScore(average, best) {

    let scores = JSON.parse(localStorage.getItem("scores") || "[]");

    scores.push({
        name: playerName,
        avg:  average,
        best: best
    });

    // Sort by average ascending (fastest first)
    scores.sort(function(a, b) { return a.avg - b.avg; });

    localStorage.setItem("scores", JSON.stringify(scores));

    // Update the button to show it was saved
    const saveBtn      = document.querySelector("#resultsPanel .btn-primary");
    saveBtn.textContent = "Saved ✓";
    saveBtn.disabled   = true;
    saveBtn.style.opacity = "0.6";
}


// Renders the leaderboard table from localStorage data
function renderLeaderboard() {

    const scores   = JSON.parse(localStorage.getItem("scores") || "[]");
    const tbody    = document.getElementById("lbBody");
    const emptyMsg = document.getElementById("lbEmpty");

    // Nothing saved yet
    if (scores.length === 0) {
        emptyMsg.style.display = "block";
        tbody.innerHTML        = "";
        return;
    }

    emptyMsg.style.display = "none";

    // Build one <tr> per score
    tbody.innerHTML = scores.map(function(score, index) {
        return `
            <tr>
                <td class="rank-num">${index + 1}</td>
                <td>${score.name}</td>
                <td class="lb-ms">${score.avg}</td>
                <td class="lb-ms">${score.best}</td>
            </tr>
        `;
    }).join("");
}


// -------------------------------------------------
//  FORUM  (uses localStorage)
// -------------------------------------------------

// Reads the input fields, saves a new post, then re-renders
function postForum() {

    const nameField = document.getElementById("forumName");
    const msgField  = document.getElementById("forumMsg");

    const name = nameField.value.trim() || "Anon";
    const msg  = msgField.value.trim();

    // Don't post if the message is empty
    if (!msg) return;

    let posts = JSON.parse(localStorage.getItem("forum") || "[]");

    // Add new post at the front so newest appears first
    posts.unshift({ name: name, msg: msg });

    localStorage.setItem("forum", JSON.stringify(posts));

    // Clear the message field after posting
    msgField.value = "";

    renderForum();
}


// Reads all posts from localStorage and renders them
function renderForum() {

    const posts     = JSON.parse(localStorage.getItem("forum") || "[]");
    const container = document.getElementById("forumPosts");

    container.innerHTML = posts.map(function(post) {
        return `
            <div class="forum-post">
                <b>${post.name}</b>
                <p>${post.msg}</p>
            </div>
        `;
    }).join("");
}
