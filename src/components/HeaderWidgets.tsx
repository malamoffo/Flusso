import React, { useState, useEffect, memo } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog } from 'lucide-react';
import { fetchWithProxy } from '../utils/proxy';

interface WeatherData {
  temp: number;
  condition: string;
  lat: number;
  lon: number;
}

const WeatherWidget = memo(({ loading, weather }: { loading: boolean, weather: WeatherData | null }) => {
  const getWeatherIcon = (condition: string) => {
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

  if (loading) {
    return (
      <div className="animate-pulse">
        <span className="opacity-50">...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div 
      className="flex items-center gap-1.5 transition-colors"
    >
      {getWeatherIcon(weather.condition)}
      <span>{weather.temp}°C</span>
    </div>
  );
});

export const HeaderWidgets = memo(function HeaderWidgets() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      setLoading(true);
      try {
        // Try direct fetch first as Open-Meteo supports CORS and is very reliable
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        
        let data = null;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            data = await response.json();
          }
        } catch (e) {
          console.warn('Direct weather fetch failed, trying proxy utility');
        }

        if (!data) {
          try {
            const text = await fetchWithProxy(url, false);
            if (text && text.trim().startsWith('{')) {
              data = JSON.parse(text);
            } else if (text) {
              console.warn('Weather proxy returned non-JSON content:', text.substring(0, 100));
            }
          } catch (e) {
            console.warn('Weather proxy fetch failed');
          }
        }
        
        if (data) {
          const current = data.current || data.current_weather;
          if (current) {
            setWeather({
              temp: Math.round(current.temperature_2m ?? current.temperature),
              condition: getWeatherCondition(current.weather_code ?? current.weathercode),
              lat,
              lon
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleGeolocation = () => {
      let fallbackTriggered = false;
      
      const triggerFallback = () => {
        if (!fallbackTriggered) {
          fallbackTriggered = true;
          console.log('Using fallback location (Rome)');
          fetchWeather(41.9028, 12.4964);
        }
      };

      // Set a shorter timeout for the initial wait
      const fallbackTimeout = setTimeout(triggerFallback, 4000);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(fallbackTimeout);
            if (!fallbackTriggered) {
              fetchWeather(position.coords.latitude, position.coords.longitude);
            }
          },
          (error) => {
            clearTimeout(fallbackTimeout);
            console.warn('Geolocation error:', error.message);
            triggerFallback();
          },
          { timeout: 8000, enableHighAccuracy: false }
        );
      } else {
        clearTimeout(fallbackTimeout);
        triggerFallback();
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

  return (
    <div className="flex items-baseline gap-3 text-xl font-bold text-white/80 tracking-tight">
      <WeatherWidget loading={loading} weather={weather} />
    </div>
  );
});
