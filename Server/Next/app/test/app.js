
import questionsData from "../question.json";

const ANSWERS_STORAGE_KEY = "answers";
const backupQuestions = [];

const scoringMap = [
    { type: "cards", options: { 0: { Learnability: 3 }, 1: { "stress ability": 2, discipline: 2 }, 2: { adaptive: 2 }, 3: { adaptive: 2, communicable: 2 } } },
    { type: "swipe", true: { communicable: 3 }, false: { organizationable: 2, discipline: 1 } },
    { type: "compare", left: { communicable: 2, "stress ability": 1 }, right: { organizationable: 3, discipline: 1 } },
    { type: "rate", target: ["Responsability", "stress ability"] },
    { type: "cards", options: { 0: { Learnability: 2, organizationable: 1 }, 1: { adaptive: 2, "stress ability": 1 }, 2: { Learnability: 3 }, 3: { adaptive: 3, Learnability: 2 } } },
    { type: "swipe", true: { communicable: 4, "stress ability": 2 }, false: { organizationable: 1 } },
    { type: "compare", left: { adaptive: 2, communicable: 1 }, right: { organizationable: 3, discipline: 2 } },
    { type: "rate", target: ["adaptive"] },
    { type: "cards", options: { 0: { discipline: 3, organizationable: 2 }, 1: { communicable: 3 }, 2: { Responsability: 4, communicable: 1 }, 3: { adaptive: 3, organizationable: -1 } } },
    { type: "swipe", true: { "stress ability": 3, adaptive: 2 }, false: { organizationable: 2, discipline: 2 } },
    { type: "compare", left: { organizationable: 3, discipline: 2 }, right: { adaptive: 3, Learnability: 2 } },
    { type: "rate", target: ["communicable", "Responsability"] },
    { type: "cards", options: { 0: { adaptive: 2 }, 1: { adaptive: 2, Learnability: 1 }, 2: { communicable: 2, organizationable: 1 }, 3: { discipline: 2, organizationable: 2 } } },
    { type: "swipe", true: { "stress ability": 3, Responsability: 2 }, false: { communicable: 2, organizationable: 1 } },
    { type: "compare", left: { organizationable: 3, discipline: 3 }, right: { adaptive: 3, "stress ability": 2 } },
    { type: "rate", target: ["discipline", "organizationable"] },
    { type: "cards", options: { 0: { organizationable: 2, Learnability: 2 }, 1: { Responsability: 3, "stress ability": 2 }, 2: { adaptive: 3 }, 3: { Learnability: 4 } } },
    { type: "swipe", true: { Responsability: 4, "stress ability": 2 }, false: { discipline: 1 } },
    { type: "compare", left: { organizationable: 4, discipline: 2 }, right: { adaptive: 4, "stress ability": 2 } },
    { type: "rate", target: ["Learnability"] }
];

function generateId() {
    let id = "";

    for (let i = 0; i < 12; i++) {
        id += Math.floor(Math.random() * 10);
    }

    return id;
}

// Функция для получения или создания постоянного uniq_user_id
function getUniqueUserId() {
    const STORAGE_KEY = "unique_user_id";
    let uniqueUserId = localStorage.getItem(STORAGE_KEY);

    if (!uniqueUserId) {
        uniqueUserId = generateId();
        localStorage.setItem(STORAGE_KEY, uniqueUserId);
    }

    return uniqueUserId;
}

async function fetchQuestions() {
    const questions = Array.isArray(questionsData) ? questionsData : questionsData.question || [];
    return questions.filter((question) => Math.random() <= (question.chance ?? 1));
}

async function sendAnswers(data, name = "") {
    const id = generateId();
    const unique_user_id = getUniqueUserId();

    const answerData = {
        id: id,
        unique_user_id: unique_user_id,
        timestamp: new Date().toISOString(),
        name: name,
        answers: data
    };

    const savedAnswers = JSON.parse(localStorage.getItem(ANSWERS_STORAGE_KEY) || "[]");
    savedAnswers.push(answerData);
    localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(savedAnswers));

    return { id, unique_user_id, result: calculateUserStats(answerData) };
}

function calculateUserStats(userData) {
    const parameters = ["adaptive", "organizationable", "stress ability", "communicable", "Learnability", "Responsability", "discipline"];
    const rawScores = Object.fromEntries(parameters.map((parameter) => [parameter, 0]));
    const maxScores = Object.fromEntries(parameters.map((parameter) => [parameter, 0]));

    userData.answers.forEach((answer, index) => {
        const rule = scoringMap[index];
        if (!rule) return;

        let points = {};
        if (rule.type === "cards") points = rule.options[Number(answer) - 1] || {};
        if (rule.type === "swipe") points = answer === 1 ? rule.true : rule.false;
        if (rule.type === "compare") points = answer === false ? rule.left : rule.right;
        if (rule.type === "rate") rule.target.forEach((parameter) => { points[parameter] = Number(answer) || 0; });

        Object.entries(points).forEach(([parameter, value]) => {
            if (rawScores[parameter] !== undefined) rawScores[parameter] += value;
        });
    });

    scoringMap.forEach((rule) => {
        if (rule.type === "cards") {
            parameters.forEach((parameter) => {
                maxScores[parameter] += Math.max(...Object.values(rule.options).map((option) => option[parameter] || 0));
            });
        } else if (rule.type === "swipe" || rule.type === "compare") {
            parameters.forEach((parameter) => {
                const choices = rule.type === "swipe" ? [rule.true, rule.false] : [rule.left, rule.right];
                maxScores[parameter] += Math.max(...choices.map((choice) => choice[parameter] || 0));
            });
        } else {
            rule.target.forEach((parameter) => { maxScores[parameter] += 5; });
        }
    });

    return parameters.reduce((result, parameter) => {
        const percentage = Math.max(0, Math.min(1, rawScores[parameter] / (maxScores[parameter] || 1)));
        result[parameter] = Math.round(percentage * 9) + 1;
        return result;
    }, { unique_user_id: userData.unique_user_id });
}

export {
    generateId,
    getUniqueUserId,
    fetchQuestions,
    backupQuestions,
    sendAnswers,
    calculateUserStats
};