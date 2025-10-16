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

// Mapea los códigos del clima Open-Meteo a iconos, descripción y fondo
const weatherCodeMap = {
    0: { icon: '☀️', desc: 'Despejado', bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
    1: { icon: '🌤️', desc: 'Parcialmente nublado', bg: 'linear-gradient(135deg, #FFE4B5 0%, #DEB887 100%)' },
    2: { icon: '⛅', desc: 'Nublado', bg: 'linear-gradient(135deg, #D3D3D3 0%, #A9A9A9 100%)' },
    3: { icon: '☁️', desc: 'Muy nublado', bg: 'linear-gradient(135deg, #696969 0%, #2F4F4F 100%)' },
    45: { icon: '🌫️', desc: 'Niebla', bg: 'linear-gradient(135deg, #F5F5F5 0%, #DCDCDC 100%)' },
    48: { icon: '🌫️', desc: 'Niebla helada', bg: 'linear-gradient(135deg, #E0FFFF 0%, #B0E0E6 100%)' },
    51: { icon: '🌦️', desc: 'Llovizna ligera', bg: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)' },
    53: { icon: '🌦️', desc: 'Llovizna moderada', bg: 'linear-gradient(135deg, #6495ED 0%, #4169E1 100%)' },
    55: { icon: '🌧️', desc: 'Llovizna densa', bg: 'linear-gradient(135deg, #0000CD 0%, #000080 100%)' },
    56: { icon: '🌧️', desc: 'Llovizna helada ligera', bg: 'linear-gradient(135deg, #ADD8E6 0%, #87CEFA 100%)' },
    57: { icon: '🌧️', desc: 'Llovizna helada densa', bg: 'linear-gradient(135deg, #00BFFF 0%, #1E90FF 100%)' },
    61: { icon: '🌧️', desc: 'Lluvia ligera', bg: 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)' },
    63: { icon: '🌧️', desc: 'Lluvia moderada', bg: 'linear-gradient(135deg, #006400 0%, #004400 100%)' },
    65: { icon: '🌧️', desc: 'Lluvia fuerte', bg: 'linear-gradient(135deg, #2F4F4F 0%, #191970 100%)' },
    66: { icon: '🌧️', desc: 'Lluvia helada ligera', bg: 'linear-gradient(135deg, #98FB98 0%, #00FF7F 100%)' },
    67: { icon: '🌧️', desc: 'Lluvia helada fuerte', bg: 'linear-gradient(135deg, #00FA9A 0%, #008B8B 100%)' },
    71: { icon: '❄️', desc: 'Nieve ligera', bg: 'linear-gradient(135deg, #F0F8FF 0%, #E6E6FA 100%)' },
    73: { icon: '❄️', desc: 'Nieve moderada', bg: 'linear-gradient(135deg, #DDA0DD 0%, #BA55D3 100%)' },
    75: { icon: '❄️', desc: 'Nieve fuerte', bg: 'linear-gradient(135deg, #9370DB 0%, #8A2BE2 100%)' },
    77: { icon: '❄️', desc: 'Copos de nieve', bg: 'linear-gradient(135deg, #FFFACD 0%, #F0E68C 100%)' },
    80: { icon: '🌧️', desc: 'Chubascos ligeros', bg: 'linear-gradient(135deg, #20B2AA 0%, #008080 100%)' },
    81: { icon: '🌧️', desc: 'Chubascos moderados', bg: 'linear-gradient(135deg, #48D1CC 0%, #40E0D0 100%)' },
    82: { icon: '🌧️', desc: 'Chubascos violentos', bg: 'linear-gradient(135deg, #00CED1 0%, #5F9EA0 100%)' },
    85: { icon: '❄️', desc: 'Chubascos de nieve ligeros', bg: 'linear-gradient(135deg, #AFEEEE 0%, #7FFFD4 100%)' },
    86: { icon: '❄️', desc: 'Chubascos de nieve fuertes', bg: 'linear-gradient(135deg, #40E0D0 0%, #00CED1 100%)' },
    95: { icon: '⛈️', desc: 'Tormenta', bg: 'linear-gradient(135deg, #2F2F2F 0%, #000000 100%)' },
    96: { icon: '⛈️', desc: 'Tormenta con granizo ligera', bg: 'linear-gradient(135deg, #696969 0%, #A9A9A9 100%)' },
    99: { icon: '⛈️', desc: 'Tormenta con granizo fuerte', bg: 'linear-gradient(135deg, #808080 0%, #C0C0C0 100%)' },
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

function displayWeather(cityName, temp, icon, desc, weatherCode) {
    const weatherInfo = weatherCodeMap[weatherCode] || { bg: 'linear-gradient(135deg, #1f2937 0%, #0f172a 100%)' };
    document.body.classList.add('changing');
    setTimeout(() => {
        document.body.style.background = weatherInfo.bg;
        document.body.classList.remove('changing');
    }, 500);
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

        displayWeather(`${coords.name}, ${coords.country}`, weather.temp, weatherInfo.icon, weatherInfo.desc, weather.weatherCode);
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
