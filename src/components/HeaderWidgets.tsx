import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Wind } from 'lucide-react';
import { fetchWithProxy } from '../utils/proxy';

interface WeatherData {
  temp: number;
  condition: string;
}

export function HeaderWidgets() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const text = await fetchWithProxy(url, false);
        const data = JSON.parse(text);
        
        if (data.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            condition: getWeatherCondition(data.current_weather.weathercode),
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Fallback to a default location (e.g., Rome) if user denies or it fails
            fetchWeather(41.9028, 12.4964);
          },
          { timeout: 10000 }
        );
      } else {
        // Fallback to Rome
        fetchWeather(41.9028, 12.4964);
      }
    };

    handleGeolocation();
  }, []);

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95) return 'thunderstorm';
    return 'clear';
  };

  const WeatherIcon = ({ condition }: { condition: string }) => {
    switch (condition) {
      case 'clear': return <Sun className="w-4 h-4 text-amber-500" />;
      case 'cloudy': return <Cloud className="w-4 h-4 text-gray-400" />;
      case 'fog': return <CloudFog className="w-4 h-4 text-gray-300" />;
      case 'rain': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'snow': return <CloudSnow className="w-4 h-4 text-blue-200" />;
      case 'thunderstorm': return <CloudLightning className="w-4 h-4 text-yellow-500" />;
      default: return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="flex items-baseline gap-3 text-xl font-bold text-gray-500 tracking-tight">
      <div className="flex items-center">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <span className="opacity-50">...</span>
        </div>
      ) : weather && (
        <div className="flex items-center gap-1.5">
          <WeatherIcon condition={weather.condition} />
          <span>{weather.temp}°C</span>
        </div>
      )}
    </div>
  );
}
