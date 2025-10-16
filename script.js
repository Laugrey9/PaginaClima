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

function updateLandscapeColor(weatherCode) {
    const landscape = document.getElementById('landscape');
    let baseColor;

    if ([0, 1].includes(weatherCode)) {
        // Sunny - warmer, more vibrant green
        baseColor = 'rgba(50, 205, 50, 0.7)'; // Lime green
    } else if ([2, 3, 45, 48].includes(weatherCode)) {
        // Cloudy/Fog - neutral green
        baseColor = 'rgba(34, 139, 34, 0.7)'; // Forest green
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
        // Rain - cooler, bluer green
        baseColor = 'rgba(0, 128, 0, 0.7)'; // Dark green
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        // Snow - very cool, almost blue-green
        baseColor = 'rgba(0, 100, 0, 0.7)'; // Very dark green
    } else if ([95, 96, 99].includes(weatherCode)) {
        // Storm - dramatic, darker
        baseColor = 'rgba(25, 25, 112, 0.7)'; // Midnight blue
    } else {
        // Default
        baseColor = 'rgba(34, 139, 34, 0.7)';
    }

    landscape.style.background = `linear-gradient(to top, ${baseColor} 0%, ${baseColor.replace('0.7', '0.6')} 50%, ${baseColor.replace('0.7', '0.5')} 100%)`;
}

function createWeatherEffects(weatherCode) {
    const effectsContainer = document.getElementById('weather-effects');
    effectsContainer.innerHTML = '';

    updateLandscapeColor(weatherCode);

    if ([0, 1].includes(weatherCode)) {
        // Sunny - add sun (left side)
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.left = '10%';
        effectsContainer.appendChild(sun);
    } else if ([2, 3, 45, 48].includes(weatherCode)) {
        // Cloudy/Fog - add clouds (left side)
        for (let i = 0; i < 5; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.left = `${5 + Math.random() * 40}%`;
            cloud.style.top = `${10 + i * 20 + Math.random() * 30}px`;
            cloud.style.animationDelay = `${i * 4 + Math.random() * 3}s`;
            effectsContainer.appendChild(cloud);
        }
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
        // Rain - add rain drops (random across screen)
        for (let i = 0; i < 35; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDelay = `${Math.random() * 1.5}s`;
            drop.style.animationDuration = `${0.6 + Math.random() * 0.3}s`;
            effectsContainer.appendChild(drop);
        }
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        // Snow - add snow flakes (random across screen)
        for (let i = 0; i < 30; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.animationDelay = `${Math.random() * 4}s`;
            flake.style.animationDuration = `${2 + Math.random() * 2}s`;
            effectsContainer.appendChild(flake);
        }
    }
}

function displayWeather(cityName, temp, icon, desc, weatherCode) {
    const weatherInfo = weatherCodeMap[weatherCode] || { bg: 'linear-gradient(135deg, #1f2937 0%, #0f172a 100%)' };
    document.body.classList.add('changing');
    setTimeout(() => {
        document.body.style.background = weatherInfo.bg;
        document.body.classList.remove('changing');
        createWeatherEffects(weatherCode);
        // Ocultar estrellas cuando hay clima
        document.getElementById('stars').style.opacity = '0';
    }, 500);
    weatherResult.innerHTML = `
        <div class="mt-4 animate-fadeIn">
            <div class="text-8xl mb-4 transition duration-500 transform hover:rotate-3">${icon}</div>
            <div class="weather-text-bg">
                <p class="text-6xl font-bold mb-2">${temp}°C</p>
                <p class="text-2xl font-semibold mb-4">${cityName}</p>
                <p class="text-lg text-gray-300 mb-6">${desc}</p>
            </div>
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

// Función para crear estrellas
function createStars() {
    const starsContainer = document.getElementById('stars');
    starsContainer.innerHTML = '';

    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 70}%`; // Solo en la parte superior
        star.style.animationDelay = `${Math.random() * 2}s`;
        starsContainer.appendChild(star);
    }
}

// Mensaje inicial
window.onload = () => {
    createStars();
    weatherResult.innerHTML = `
        <p class="text-gray-300 text-lg mb-2">Busca una ciudad para ver el clima.</p>
        <p class="text-base font-bold">¡Prueba con Madrid, Tokio o París!</p>
    `;
};
