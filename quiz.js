const quiz = [
    {
        question: "What year was the University of Rochester founded?",
        options: ["1850", "1900"],
        answer: 0, // Index of the correct answer
    },
    {
        question: "Where was the first campus of the University of Rochester located?",
        options: ["Prince Street", "United States Hotel on Buffalo Street"],
        answer: 1,
    },
    {
        question: "Who was the first president of the University of Rochester?",
        options: ["Martin Brewer Anderson", "Rush Rhees"],
        answer: 0,
    },
    {
        question: "What is the name of the library that was donated by Hiram W. Sibley?",
        options: ["Rush Rhees Library", "Sibley Music Library"],
        answer: 1,
    },
    {
        question: "When did the University of Rochester start admitting women as degree-seeking students?",
        options: ["1900", "1910"],
        answer: 0,
    },
    {
        question: "What is Catherine Strong Hall currently used for?",
        options: ["Visual Studies Workshop", "Writing and Speaking Center"],
        answer: 0,
    },
    {
        question: "Which campus facility was opened as a gift by Emily Sibley Watson?",
        options: ["Memorial Art Gallery", "Eastman Theatre"],
        answer: 0,
    },
    {
        question: "Who was the founder of the Eastman Kodak Company who contributed to the Eastman Theatre?",
        options: ["George Eastman", "Joel Seligman"],
        answer: 0,
    },
    {
        question: "When did the University merge its co-educational program on River Campus?",
        options: ["1955", "1931"],
        answer: 0,
    },
    {
        question: "Who was the first African American woman to graduate from the University of Rochester?",
        options: ["Beatrice Amaza Howard", "Annette Gardner Munro"],
        answer: 0,
    },
    {
        question: "What significant event did the Black Student Union lead in 1969?",
        options: [
            "A six-day takeover of the Frederick Douglass Building",
            "The creation of the Educational Opportunity Program",
        ],
        answer: 0,
    },
    {
        question: "What is the name of the main library on the River Campus?",
        options: ["Rush Rhees Library", "Anderson Hall"],
        answer: 0,
    },
    {
        question: "What does the Learning Center NOT offer?",
        options: ["Study Zone", "Scholarships"],
        answer: 1,
    },
    {
        question: "Which student resource supports effective academic communication?",
        options: ["Writing and Speaking Center", "College Center for Advising Services"],
        answer: 0,
    },
    {
        question: "Which center provides personalized career support at the University of Rochester?",
        options: ["Greene Career Center", "Learning Center"],
        answer: 0,
    },
];

let currentQuestion = 0;
let sessionScore = 0; // Tracks the score for the current session only
let currentUser = ""; // Global variable to store the current user's name

// Start Quiz
function startQuiz() {
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("game-prompt").style.display = "none"; // Hide the prompt when quiz starts
    sessionScore = 0; // Reset session score at the start of the quiz
    currentQuestion = 0; // Start from the first question
    showQuestion();
}

// Show Question
function showQuestion() {
    const question = quiz[currentQuestion];
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = `
        <h2>${question.question}</h2>
        <ul id="answers">
            ${question.options
                .map((option, index) => `<li onclick="checkAnswer(${index})">${option}</li>`)
                .join("")}
        </ul>
        <button id="next-btn" style="display:none;" onclick="nextQuestion()">Next</button>
        <button id="end-quiz-btn" onclick="endQuiz()">End Quiz</button>
    `;
}

// Check Answer
function checkAnswer(selectedIndex) {
    const question = quiz[currentQuestion];
    const answersList = document.querySelectorAll("#answers li");

    // Visual feedback for correct/incorrect answers
    answersList.forEach((li, index) => {
        li.style.backgroundColor = index === question.answer ? "green" : index === selectedIndex ? "red" : "";
    });

    // Adjust score based on answer correctness
    if (selectedIndex === question.answer) {
        sessionScore += 2; // Increment session score by 2 for correct answer
    } else {
        sessionScore -= 1; // Decrement session score by 1 for incorrect answer
    }

    // Prevent negative session scores
    if (sessionScore < 0) sessionScore = 0;

    document.getElementById("next-btn").style.display = "inline-block"; // Show the next button
}

// Next Question
function nextQuestion() {
    currentQuestion++;
    if (currentQuestion < quiz.length) {
        showQuestion();
    } else {
        endQuiz();
    }
}

// End Quiz Anytime
function endQuiz() {
    // Prompt user for name before showing leaderboard
    currentUser = prompt("Enter your name:");

    // Ensure the user enters a name
    if (currentUser) {
        // Hide the quiz container
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("start-quiz-btn").style.display = "inline-block";
        
        // Update the leaderboard
        updateLeaderboard(currentUser, sessionScore);

        // Show the leaderboard
        showLeaderboard();
    } else {
        alert("Please enter a name to proceed.");
    }
}

// Update Leaderboard
function updateLeaderboard(username, userScore) {
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    leaderboard.push({ username, score: userScore });
    leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score in descending order
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard)); // Save updated leaderboard
}

// Show Leaderboard
function showLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    
    // Get the user's rank based on their score
    const rank = leaderboard.findIndex(entry => entry.username === currentUser) + 1;

    // Display top 3 scores only
    const topScores = leaderboard.slice(0, 3);

    const leaderboardContainer = document.getElementById("quiz-container");
    leaderboardContainer.style.display = "block";
    leaderboardContainer.innerHTML = `
        <h2>Leaderboard</h2>
        <div id="leaderboard-entries">
            ${topScores
                .map((entry, index) => `<p>${index + 1}. ${entry.username}: ${entry.score} points</p>`)
                .join("")}
        </div>
        <p>Your Overall Rank: ${rank}</p>
        <button onclick="startQuiz()">Play Again</button>
    `;
}

// Display game prompt (shown by default when page loads)
document.getElementById("game-prompt").addEventListener("click", function() {
    startQuiz();
});
