// =============================
// HELPERS
// =============================
function getTodayString() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
}

function getNowDateTimeLocal() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
}

function getCalorieData() {
    return JSON.parse(localStorage.getItem("calorieData")) || {};
}

function saveCalorieData(data) {
    localStorage.setItem("calorieData", JSON.stringify(data));
}

// =============================
// DOM LOAD
// =============================
window.addEventListener("DOMContentLoaded", () => {
    const foodTime = document.getElementById("food-time");
    if (foodTime) foodTime.value = getNowDateTimeLocal();

    updateTodayCalories();
    updateWeeklyData();
    updateCharts();
});

// =============================
// ADD FOOD
// =============================
function addFood() {
    const foodName = document.getElementById("food-name")?.value.trim();
    const calories = parseInt(document.getElementById("food-calories")?.value);
    const dateTime = document.getElementById("food-time")?.value;
    const message = document.getElementById("message");

    if (!foodName || isNaN(calories) || !dateTime) {
        if (message) message.textContent = "Please fill all fields!";
        return;
    }

    const date = dateTime.split("T")[0];
    const data = getCalorieData();

    if (!data[date]) data[date] = { foods: [], totalCalories: 0 };

    data[date].foods.push({ name: foodName, calories, time: dateTime });
    data[date].totalCalories += calories;

    saveCalorieData(data);

    if (message) message.textContent = "Food added successfully!";

    resetFoodInputs();
    updateTodayCalories();
    updateWeeklyData();
    updateCharts();
}

// =============================
// RESET INPUTS
// =============================
function resetFoodInputs() {
    const name = document.getElementById("food-name");
    const cal = document.getElementById("food-calories");
    const time = document.getElementById("food-time");
    const message = document.getElementById("message");

    if (name) name.value = "";
    if (cal) cal.value = "";
    if (time) time.value = getNowDateTimeLocal();
    if (message) message.textContent = "Inputs cleared.";
}

// =============================
// UNDO LAST FOOD
// =============================
function undoLastFood() {
    const data = getCalorieData();
    const today = getTodayString();
    const message = document.getElementById("message");

    if (data[today] && data[today].foods.length > 0) {
        const removedFood = data[today].foods.pop();
        data[today].totalCalories -= removedFood.calories;

        if (data[today].foods.length === 0) delete data[today];

        saveCalorieData(data);

        updateTodayCalories();
        updateWeeklyData();
        updateCharts();

        if (message) message.textContent = `Removed: ${removedFood.name}`;
    } else {
        if (message) message.textContent = "No food to remove today.";
    }
}

// =============================
// RESET ALL DATA
// =============================
function resetAllData() {
    if (confirm("Delete all saved food data?")) {
        localStorage.removeItem("calorieData");
        updateTodayCalories();
        updateWeeklyData();
        updateCharts();

        const message = document.getElementById("message");
        if (message) message.textContent = "All data reset!";
    }
}

// =============================
// UPDATE TODAY CALORIES
// =============================
function updateTodayCalories() {
    const data = getCalorieData();
    const total = data[getTodayString()]
        ? data[getTodayString()].totalCalories
        : 0;

    const el = document.getElementById("daily-calories");
    if (el) el.textContent = total;
}

// =============================
// UPDATE WEEKLY DATA
// =============================
function updateWeeklyData() {
    const data = getCalorieData();
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

    let weeklyTotal = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        if (data[dateStr])
            weeklyTotal += data[dateStr].totalCalories;
    }

    const el = document.getElementById("weekly-calories");
    if (el) el.textContent = weeklyTotal;
}

// =============================
// CHARTS
// =============================
let dailyChart, weeklyChart;

function renderDailyChart() {
    const canvas = document.getElementById("dailyChart");
    if (!canvas) return;

    const data = getCalorieData();
    const foods = data[getTodayString()]?.foods || [];

    const labels = foods.map(f =>
        new Date(f.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );

    const calories = foods.map(f => f.calories);

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels.length ? labels : ["No Food"],
            datasets: [{
                label: "Calories per meal",
                data: calories.length ? calories : [0],
                backgroundColor: "rgba(75,192,192,0.5)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderWeeklyChart() {
    const canvas = document.getElementById("weeklyChart");
    if (!canvas) return;

    const data = getCalorieData();
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

    const labels = [];
    const weeklyCalories = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        labels.push(d.toLocaleDateString([], { weekday: "short" }));
        weeklyCalories.push(data[dateStr]?.totalCalories || 0);
    }

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Calories per day",
                data: weeklyCalories,
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateCharts() {
    renderDailyChart();
    renderWeeklyChart();
}


