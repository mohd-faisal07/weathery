import { useEffect, useState } from "react";
import { renderIntoDocument } from "react-dom/test-utils";
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(country_code) {
  const codePoints = country_code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

async function getWeather(location) {}

export default function App() {
  const [location, setLocation] = useState("");
  const [IsLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState("");

  async function handleFetch() {
    try {
      if (location.length < 2) return setWeather("");
      setIsLoading(true);
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      // console.log(weather.weathercode);
    }
  }
  useEffect(
    function () {
      handleFetch();
    },
    [location]
  );
  return (
    <div className="app">
      <h1>weathery</h1>
      <Input location={location} setLocation={setLocation} />
      {/* <button onClick={handleFetch}>Get Weather </button> */}
      {IsLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}
function Input({ location, setLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="select from location.."
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
    </div>
  );
}

function Weather({ weather, location }) {
  return (
    <div>
      <h2>Weather in {location}</h2>
      <ul className="weather">
        {weather.time.map((date, i) => (
          <Day
            date={date}
            max={weather.temperature_2m_max.at(i)}
            min={weather.temperature_2m_min.at(i)}
            code={weather.weathercode.at(i)}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}
