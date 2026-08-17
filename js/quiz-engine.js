// --- STATE VARIABLES ---
let currentQuestions = [];
let currentQuestionIndex = 0;
let userState = [];
let mode = 'study'; 
let timerInterval;
let timeLeft = 7200; // 2 hours (120 minutes) in seconds

function startQuiz(selectedMode) {
    mode = selectedMode;
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('quiz-ui').style.display = 'block';

    // quizData is pulled directly from whatever HTML file she opens
    currentQuestions = [...quizData]; 
    
    // Shuffle the questions automatically
    for (let i = currentQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentQuestions[i], currentQuestions[j]] = [currentQuestions[j], currentQuestions[i]];
    }

    currentQuestionIndex = 0;
    
    // Set up the blank tracking state for each question
    userState = currentQuestions.map(() => ({ 
        selectedOption: null, 
        isAnswered: false, 
        isCorrect: false 
    }));

    // Start the 2-hour timer if she chooses Mock Board Mode
    if (mode === 'mock') {
        document.getElementById('timer-display').style.display = 'block';
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                showResults(); // Auto-submit when time is up!
            }
        }, 1000);
    }

    loadQuestion();
}

function updateTimerDisplay() {
    let h = Math.floor(timeLeft / 3600);
    let m = Math.floor((timeLeft % 3600) / 60);
    let s = timeLeft % 60;
    document.getElementById('timer-display').innerText = 
        `⏱ Time Left: ${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
}

function loadQuestion() {
    const qData = currentQuestions[currentQuestionIndex];
    const state = userState[currentQuestionIndex];

    document.getElementById('progress').innerText = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    
    // Clean up any hardcoded numbers (like "31. ") so shuffled questions look clean
    let cleanQuestionText = qData.question.replace(/^\d+\.\s*/, '');
    document.getElementById('question').innerHTML = cleanQuestionText.replace(/\n/g, '<br>');
    
    const optionsEl = document.getElementById('options');
    optionsEl.innerHTML = '';

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.innerHTML = opt;
        btn.classList.add('option-btn');

        if (state.isAnswered) {
            if (mode === 'study') {
                btn.disabled = true; // Lock in Study Mode
                if (index === qData.correct) btn.classList.add('correct');
                if (index === state.selectedOption && index !== qData.correct) btn.classList.add('wrong');
            } else if (mode === 'mock') {
                // In Mock Mode, just highlight the current selection, but DO NOT disable the button
                if (index === state.selectedOption) {
                    btn.style.backgroundColor = '#cbd5e1'; 
                    btn.style.borderColor = '#94a3b8';
                    btn.style.color = '#334155';
                }
            }
        }
        
        // Add click listener (unless it's already answered in Study mode)
        if (!state.isAnswered || mode === 'mock') {
            btn.addEventListener('click', () => selectOption(index));
        }
        
        optionsEl.appendChild(btn);
    });

    const rationaleBox = document.getElementById('rationale-box');
    
    // Only reveal the Rationale instantly if she is in Study Mode
    if (state.isAnswered && mode === 'study') {
        document.getElementById('rationale-text').innerHTML = qData.rationale;
        rationaleBox.style.display = 'block';
    } else {
        rationaleBox.style.display = 'none';
    }

    document.getElementById('prev-btn').disabled = (currentQuestionIndex === 0);
    
    const nextBtn = document.getElementById('next-btn');
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.innerText = "Submit Exam";
    } else {
        nextBtn.innerText = "Next";
    }
}

function selectOption(selectedIndex) {
    const state = userState[currentQuestionIndex];
    
    // If she is in Study Mode and already answered, do nothing
    if (mode === 'study' && state.isAnswered) return;

    state.isAnswered = true;
    state.selectedOption = selectedIndex;
    const qData = currentQuestions[currentQuestionIndex];
    state.isCorrect = (selectedIndex === qData.correct);

    const allButtons = document.getElementById('options').children;

    if (mode === 'study') {
        if (state.isCorrect) {
            allButtons[selectedIndex].classList.add('correct');
        } else {
            allButtons[selectedIndex].classList.add('wrong');
            allButtons[qData.correct].classList.add('correct');
        }
        document.getElementById('rationale-text').innerHTML = qData.rationale;
        document.getElementById('rationale-box').style.display = 'block';
        
        // Lock all buttons after a choice is made in Study Mode
        for (let btn of allButtons) btn.disabled = true;
        
    } else if (mode === 'mock') {
        // In Mock Mode, first clear the shading from all buttons
        for (let btn of allButtons) {
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }
        // Then shade only the new selection
        allButtons[selectedIndex].style.backgroundColor = '#cbd5e1';
        allButtons[selectedIndex].style.borderColor = '#94a3b8';
        allButtons[selectedIndex].style.color = '#334155';
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    // Stop the timer
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('quiz-ui').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';

    let score = userState.filter(s => s.isCorrect).length;
    document.getElementById('score').innerText = score;
    document.getElementById('total').innerText = currentQuestions.length;

    const msgBox = document.getElementById('results-message');
    let percentage = (score / currentQuestions.length) * 100;
    
    if (percentage >= 90) {
        msgBox.innerHTML = "<strong>Amazing job!</strong> You are ready to crush the board exam.";
    } else if (percentage >= 75) {
        msgBox.innerHTML = "<strong>Great work!</strong> You have a solid grasp on these concepts.";
    } else {
        msgBox.innerHTML = "<strong>Keep pushing!</strong> That's exactly why we practice. Review the concepts and try again!";
    }
}
