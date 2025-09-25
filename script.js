// API Config
const API_KEY = "2a4c6686091c26bf640e864bc7c92fe1";
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

// DOM Elements
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const tempEl = document.getElementById("temp");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById('pressure');
const SunriseEl = document.getElementById('sunrise');
const SunsetEl = document.getElementById('sunset');
const SealevelEl = document.getElementById('sea-level');
const GrdlevelEl = document.getElementById('grd-level');
const descEl = document.getElementById("weather-desc");
const cityNameEl = document.getElementById("city-name");
const weatherIcon = document.getElementById("weather-icon");
const searchList = document.getElementById("search-list");
const alertPopup = document.getElementById("alert-popup");
const alertMessage = document.getElementById("alert-message");
const themeToggle = document.getElementById("theme-toggle");
const unitToggle = document.getElementById("unit-toggle");
const recent_list = document.getElementById('search-list');
let forecastChart, hourlyChart;
let unit = "metric"; // metric = °C, imperial = °F  


// Fetch Weather
async function fetchWeather(city) {
  try {
    const res = await fetch(`${BASE_URL}weather?q=${city}&appid=${API_KEY}&units=${unit}`);
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();
    displayWeather(data);
    fetchForecast(city);
    saveSearch(city);
  } catch (err) {
    alert(err.message);
  }
}

// Display Current Weather
function displayWeather(data) {
  cityNameEl.textContent = data.name;
  tempEl.textContent = formatTemp(data.main.temp);
  humidityEl.textContent = data.main.humidity;
  windEl.textContent = data.wind.speed;
  pressureEl.textContent = data.main.pressure;
  descEl.textContent = data.weather[0].description;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  SealevelEl.textContent = data.main.sea_level;
  GrdlevelEl.textContent = data.main.grnd_level;
  SunriseEl.textContent = MinuteToTime(data.sys.sunrise);
  SunsetEl.textContent = MinuteToTime(data.sys.sunset);
  if (data.alerts && data.alerts.length > 0) {
    showAlert(data.alerts[0].description);
  }
}

// Seconds To Normal time
function MinuteToTime(totalMinute){
  const date = new Date(totalMinute*1000);

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const formattedHours = hours.toString().padStart(2,'0');
  const formattedMinutes = minutes.toString().padStart(2,'0');
  const formattedSecond = seconds.toString().padStart(2,'0');

  return `${formattedHours}:${formattedMinutes}:${formattedSecond}`;
}

// Fetch Forecast
async function fetchForecast(city) {
  const res = await fetch(`${BASE_URL}forecast?q=${city}&appid=${API_KEY}&units=${unit}`);
  const data = await res.json();

  const labels = data.list.map(item => item.dt_txt);
  const temps = data.list.map(item => item.main.temp);

  renderChart("forecastChart", labels, temps, "5-Day Forecast", "line");
  renderChart("hourlyChart", labels.slice(0, 12), temps.slice(0, 12), "Hourly Forecast", "bar");
}

// Render Chart
function renderChart(id, labels, temps, label, type) {
  const ctx = document.getElementById(id).getContext("2d");
  if (id === "forecastChart" && forecastChart) forecastChart.destroy();
  if (id === "hourlyChart" && hourlyChart) hourlyChart.destroy();

  const chart = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: temps,
        borderColor: "blue",
        backgroundColor: "rgba(0,123,255,0.5)",
        fill: type === "line" ? true : false
      }]
    }
  });

  if (id === "forecastChart") forecastChart = chart;
  if (id === "hourlyChart") hourlyChart = chart;
}

// Format Temperature
function formatTemp(temp) {
  return unit === "metric" ? `${temp} °C` : `${temp} °F`;
}

// Alert Popup
function showAlert(message) {
  alertMessage.textContent = message;
  alertPopup.style.display = "block";
}
function closeAlert() {
  alertPopup.style.display = "none";
}

// Save & Load Recent Searches
function saveSearch(city) {
  let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  if (!searches.includes(city)) {
    searches.unshift(city);
    if (searches.length > 5) searches.pop();
    localStorage.setItem("recentSearches", JSON.stringify(searches));
    renderRecentSearches();
  }
}
function renderRecentSearches() {
  const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  searchList.innerHTML = "";
  searches.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.addEventListener("click", () => fetchWeather(city));
    searchList.appendChild(li);
  });
}

// Events
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

// Current Location
document.getElementById("current-location-btn").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const res = await fetch(`${BASE_URL}weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}`);
    const data = await res.json();
    displayWeather(data);
    fetchForecast(data.name);
    saveSearch(data.name);
  });
});

// Theme Toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.innerHTML = document.body.classList.contains("dark") ? `<h1 id="toggle">☀️</h1>` : `<h1 id="toggle">🌙</h1>`;
  searchList.style.color = "black";
});

// Unit Toggle
unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  unitToggle.textContent = unit === "metric" ? "°C / °F" : "°F / °C";
  const lastCity = document.getElementById("city-name").textContent;
  if (lastCity !== "--") fetchWeather(lastCity);
});

// Init
renderRecentSearches();