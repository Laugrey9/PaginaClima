// Función para obtener coordenadas geográficas usando API gratuita de geocoding de Open-Meteo
async function getCoordinates(city) {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country,
        };
    } else {
        throw new Error('Ciudad no encontrada');
    }
}

// Función para obtener el clima de la ciudad (temperatura horaria del día actual)
async function fetchWeather(latitude, longitude) {
    // Obtener hora actual en formato ISO para filtrar datos
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // yyyy-mm-dd

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&timezone=auto`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.hourly) {
        throw new Error('No se pudo obtener el clima');
    }

    // Extraemos temperatura actual (más cercana a la hora actual)
    const times = data.hourly.time;
    const temps = data.hourly.temperature_2m;
    const weatherCodes = data.hourly.weathercode;

    // Encontrar el índice más cercano a la hora actual
    let closestIndex = 0;
    let minDiff = Infinity;
    const nowTimestamp = now.getTime();

    for (let i = 0; i < times.length; i++) {
        const time = new Date(times[i]).getTime();
        const diff = Math.abs(nowTimestamp - time);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }

    return {
        temp: temps[closestIndex],
        weatherCode: weatherCodes[closestIndex],
    };
}

// Mapea los códigos del clima Open-Meteo a iconos y descripción
const weatherCodeMap = {
    0: { icon: '☀️', desc: 'Despejado' },
    1: { icon: '🌤️', desc: 'Parcialmente nublado' },
    2: { icon: '⛅', desc: 'Nublado' },
    3: { icon: '☁️', desc: 'Muy nublado' },
    45: { icon: '🌫️', desc: 'Niebla' },
    48: { icon: '🌫️', desc: 'Niebla helada' },
    51: { icon: '🌦️', desc: 'Llovizna ligera' },
    53: { icon: '🌦️', desc: 'Llovizna moderada' },
    55: { icon: '🌧️', desc: 'Llovizna densa' },
    56: { icon: '🌧️', desc: 'Llovizna helada ligera' },
    57: { icon: '🌧️', desc: 'Llovizna helada densa' },
    61: { icon: '🌧️', desc: 'Lluvia ligera' },
    63: { icon: '🌧️', desc: 'Lluvia moderada' },
    65: { icon: '🌧️', desc: 'Lluvia fuerte' },
    66: { icon: '🌧️', desc: 'Lluvia helada ligera' },
    67: { icon: '🌧️', desc: 'Lluvia helada fuerte' },
    71: { icon: '❄️', desc: 'Nieve ligera' },
    73: { icon: '❄️', desc: 'Nieve moderada' },
    75: { icon: '❄️', desc: 'Nieve fuerte' },
    77: { icon: '❄️', desc: 'Copos de nieve' },
    80: { icon: '🌧️', desc: 'Chubascos ligeros' },
    81: { icon: '🌧️', desc: 'Chubascos moderados' },
    82: { icon: '🌧️', desc: 'Chubascos violentos' },
    85: { icon: '❄️', desc: 'Chubascos de nieve ligeros' },
    86: { icon: '❄️', desc: 'Chubascos de nieve fuertes' },
    95: { icon: '⛈️', desc: 'Tormenta' },
    96: { icon: '⛈️', desc: 'Tormenta con granizo ligera' },
    99: { icon: '⛈️', desc: 'Tormenta con granizo fuerte' },
};

const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const weatherResult = document.getElementById('weather-result');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

function clearMessages() {
    errorMessage.classList.add('hidden');
    weatherResult.innerHTML = '';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function showLoading(show) {
    loadingSpinner.classList.toggle('hidden', !show);
}

function displayWeather(cityName, temp, icon, desc) {
    weatherResult.innerHTML = `
        <div class="mt-4 animate-fadeIn">
            <div class="text-8xl mb-4 transition duration-500 transform hover:rotate-3">${icon}</div>
            <p class="text-6xl font-bold mb-2">${temp}°C</p>
            <p class="text-2xl font-semibold mb-4">${cityName}</p>
            <p class="text-lg text-gray-300 mb-6">${desc}</p>
        </div>
    `;
}

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Por favor, introduce el nombre de una ciudad.');
        return;
    }

    clearMessages();
    showLoading(true);

    try {
        const coords = await getCoordinates(city);
        const weather = await fetchWeather(coords.latitude, coords.longitude);

        const weatherInfo = weatherCodeMap[weather.weatherCode] || {
            icon: '❓',
            desc: 'Desconocido',
        };

        displayWeather(`${coords.name}, ${coords.country}`, weather.temp, weatherInfo.icon, weatherInfo.desc);
    } catch (err) {
        showError(err.message || 'Error al obtener el clima.');
    } finally {
        showLoading(false);
    }
}

searchButton.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Mensaje inicial
window.onload = () => {
    weatherResult.innerHTML = `
        <p class="text-gray-300 text-lg mb-2">Busca una ciudad para ver el clima.</p>
        <p class="text-base font-bold">¡Prueba con Madrid, Tokio o París!</p>
    `;
};
