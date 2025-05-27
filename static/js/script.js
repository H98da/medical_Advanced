// استيراد بيانات الاختبار
let quizData = [];
let currentTopic = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let wrongQuestions = [];

// عناصر DOM
const topicSelectionScreen = document.getElementById('topic-selection');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const topicsGrid = document.querySelector('.topics-grid');
const topicTitle = document.getElementById('topic-title');
const questionText = document.getElementById('question-text');
const optionsContainer = document.querySelector('.options-container');
const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');
const progressFill = document.querySelector('.progress-fill');
const feedbackContainer = document.querySelector('.feedback-container');
const correctFeedback = document.querySelector('.feedback.correct');
const incorrectFeedback = document.querySelector('.feedback.incorrect');
const correctAnswerElement = document.getElementById('correct-answer');
const nextButton = document.getElementById('next-btn');
const scoreNumber = document.querySelector('.score-number');
const correctCountElement = document.getElementById('correct-count');
const totalCountElement = document.getElementById('total-count');
const retryAllButton = document.getElementById('retry-all-btn');
const retryWrongButton = document.getElementById('retry-wrong-btn');
const backToTopicsButton = document.getElementById('back-to-topics-btn');
const themeToggleButton = document.getElementById('theme-toggle');
const homeButton = document.getElementById('home-button');

// تحميل بيانات الاختبار
async function loadQuizData() {
    try {
        const response = await fetch('quiz_data.json');
        quizData = await response.json();
        renderTopics();
        
        // تحميل إعدادات الوضع المظلم من التخزين المحلي
        loadThemePreference();
    } catch (error) {
        console.error('خطأ في تحميل بيانات الاختبار:', error);
    }
}

// تبديل الوضع المظلم/المشرق
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    
    // تحديث أيقونة الزر
    if (isDarkMode) {
        themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // حفظ التفضيل في التخزين المحلي
    localStorage.setItem('darkMode', isDarkMode);
}

// تحميل تفضيل الوضع المظلم من التخزين المحلي
function loadThemePreference() {
    const darkModePreference = localStorage.getItem('darkMode');
    
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// العودة إلى الصفحة الرئيسية
function goToHome() {
    showScreen(topicSelectionScreen);
}

// عرض المواضيع
function renderTopics() {
    topicsGrid.innerHTML = '';
    quizData.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';
        topicCard.innerHTML = `
            <h3>${topic.name}</h3>
            <p>${topic.questions.length} سؤال</p>
        `;
        topicCard.addEventListener('click', () => startQuiz(topic));
        topicsGrid.appendChild(topicCard);
    });
}

// بدء الاختبار
function startQuiz(topic, questionsToUse = null) {
    currentTopic = topic;
    currentQuestionIndex = 0;
    userAnswers = [];
    
    // إذا تم تحديد أسئلة محددة (مثل الأسئلة الخاطئة فقط)
    if (questionsToUse) {
        currentTopic = {
            ...topic,
            questions: questionsToUse
        };
    }
    
    topicTitle.textContent = currentTopic.name;
    totalQuestionsElement.textContent = currentTopic.questions.length;
    
    showScreen(quizScreen);
    renderQuestion();
}

// عرض سؤال
function renderQuestion() {
    const question = currentTopic.questions[currentQuestionIndex];
    
    // تحديث رقم السؤال الحالي والتقدم
    currentQuestionElement.textContent = currentQuestionIndex + 1;
    const progressPercentage = ((currentQuestionIndex + 1) / currentTopic.questions.length) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    
    // عرض نص السؤال
    questionText.textContent = question.question;
    
    // عرض الخيارات
    optionsContainer.innerHTML = '';
    Object.entries(question.options).forEach(([letter, text]) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = `
            <div class="option-letter">${letter}</div>
            <div class="option-text">${text}</div>
        `;
        option.addEventListener('click', () => selectOption(option, letter));
        optionsContainer.appendChild(option);
    });
    
    // إعادة تعيين حالة الزر والتعليقات
    nextButton.disabled = true;
    feedbackContainer.classList.add('hidden');
    correctFeedback.classList.add('hidden');
    incorrectFeedback.classList.add('hidden');
}

// اختيار إجابة
function selectOption(selectedOption, letter) {
    // إذا تم بالفعل اختيار إجابة، لا تفعل شيئًا
    if (!nextButton.disabled) return;
    
    const question = currentTopic.questions[currentQuestionIndex];
    const isCorrect = letter === question.correct_letter;
    
    // تخزين إجابة المستخدم
    userAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        selectedLetter: letter,
        isCorrect: isCorrect
    };
    
    // إذا كانت الإجابة خاطئة، أضف السؤال إلى قائمة الأسئلة الخاطئة
    if (!isCorrect) {
        wrongQuestions.push(question);
    }
    
    // تحديث مظهر الخيارات
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    selectedOption.classList.add('selected');
    
    // عرض التعليقات
    feedbackContainer.classList.remove('hidden');
    if (isCorrect) {
        correctFeedback.classList.remove('hidden');
        selectedOption.classList.add('correct');
    } else {
        incorrectFeedback.classList.remove('hidden');
        selectedOption.classList.add('incorrect');
        
        // عرض الإجابة الصحيحة
        correctAnswerElement.textContent = `${question.correct_letter}. ${question.options[question.correct_letter]}`;
        
        // تمييز الخيار الصحيح
        options.forEach(option => {
            const optionLetter = option.querySelector('.option-letter').textContent;
            if (optionLetter === question.correct_letter) {
                option.classList.add('correct');
            }
        });
    }
    
    // تمكين زر التالي
    nextButton.disabled = false;
}

// الانتقال إلى السؤال التالي
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentTopic.questions.length) {
        renderQuestion();
    } else {
        showResults();
    }
}

// عرض النتائج
function showResults() {
    const totalQuestions = currentTopic.questions.length;
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    scoreNumber.textContent = `${scorePercentage}%`;
    correctCountElement.textContent = correctAnswers;
    totalCountElement.textContent = totalQuestions;
    
    // تعطيل زر إعادة الأسئلة الخاطئة إذا لم تكن هناك أسئلة خاطئة
    retryWrongButton.disabled = wrongQuestions.length === 0;
    
    showScreen(resultsScreen);
}

// إعادة جميع الأسئلة
function retryAllQuestions() {
    startQuiz(currentTopic);
}

// إعادة الأسئلة الخاطئة فقط
function retryWrongQuestions() {
    if (wrongQuestions.length > 0) {
        // إنشاء نسخة من الأسئلة الخاطئة لتجنب التداخل
        const wrongQuestionsCopy = [...wrongQuestions];
        wrongQuestions = []; // إعادة تعيين قائمة الأسئلة الخاطئة
        startQuiz(currentTopic, wrongQuestionsCopy);
    }
}

// العودة إلى قائمة المواضيع
function backToTopics() {
    showScreen(topicSelectionScreen);
}

// تبديل الشاشات
function showScreen(screen) {
    topicSelectionScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    
    screen.classList.add('active');
    
    // إظهار أو إخفاء زر العودة للصفحة الرئيسية
    if (screen === topicSelectionScreen) {
        homeButton.classList.add('hidden');
    } else {
        homeButton.classList.remove('hidden');
    }
}

// إضافة مستمعي الأحداث
nextButton.addEventListener('click', nextQuestion);
retryAllButton.addEventListener('click', retryAllQuestions);
retryWrongButton.addEventListener('click', retryWrongQuestions);
backToTopicsButton.addEventListener('click', backToTopics);
themeToggleButton.addEventListener('click', toggleDarkMode);
homeButton.addEventListener('click', goToHome);

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadQuizData);
