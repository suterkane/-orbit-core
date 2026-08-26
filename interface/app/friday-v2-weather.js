// FRIDAY v2 Weather — Open-Meteo API (kostenlos, kein Auth)
(()=>{
  const getWeather=async()=>{
    try{
      // Breitengrad/Längengrad Rene's Location (beispiel)
      const lat=52.52, lon=13.40; // Berlin
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Berlin`;
      const r=await fetch(url);
      const data=await r.json();
      const current=data.current;
      
      return {
        temp:Math.round(current.temperature_2m),
        weather:getWeatherDescription(current.weather_code),
        wind:Math.round(current.wind_speed_10m),
        time:new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})
      };
    }catch(e){
      console.log('Wetter offline');
      return {temp:20,weather:'Keine Daten',wind:0};
    }
  };

  const getWeatherDescription=code=>{
    const descriptions={
      0:'Klar',1:'Hauptsächlich klar',2:'Teilweise bewölkt',3:'Bewölkt',
      45:'Neblig',48:'Deposit fog',51:'Leichter Nieselregen',53:'Moderater Nieselregen',
      61:'Leichter Regen',63:'Moderater Regen',65:'Starker Regen',
      71:'Leichter Schneefall',80:'Leichte Regenschauer',
      95:'Gewitter'
    };
    return descriptions[code]||'Bedeckt';
  };

  const displayWeather=async()=>{
    const weather=await getWeather();
    const el=document.querySelector('#panoramaWeather');
    if(el){
      el.innerHTML=`${weather.temp}° ${weather.weather} · Wind ${weather.wind}km/h`;
    }
    
    // Auch in Briefing sprechen
    if(window.FRIDAYComplete){
      window.FRIDAYComplete.weather=weather;
    }
  };

  // Beim Start laden
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',displayWeather);
  }else{
    displayWeather();
  }

  // Alle 10min aktualisieren
  setInterval(displayWeather,600000);

  window.ORBITWeather={displayWeather,getWeather};
})();
