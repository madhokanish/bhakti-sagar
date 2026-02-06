const zenith = 90.833;

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function normalizeDegrees(deg: number) {
  let value = deg % 360;
  if (value < 0) value += 360;
  return value;
}

function dayOfYear(year: number, month: number, day: number) {
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000);
}

function calcSunTime({
  year,
  month,
  day,
  lat,
  lon,
  isSunrise
}: {
  year: number;
  month: number;
  day: number;
  lat: number;
  lon: number;
  isSunrise: boolean;
}) {
  const N = dayOfYear(year, month, day);
  const lngHour = lon / 15;
  const t = N + ((isSunrise ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(degToRad(M)) + 0.020 * Math.sin(degToRad(2 * M)) + 282.634;
  L = normalizeDegrees(L);

  let RA = radToDeg(Math.atan(0.91764 * Math.tan(degToRad(L))));
  RA = normalizeDegrees(RA);

  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA = RA / 15;

  const sinDec = 0.39782 * Math.sin(degToRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(degToRad(zenith)) - sinDec * Math.sin(degToRad(lat))) /
    (cosDec * Math.cos(degToRad(lat)));

  if (cosH > 1 || cosH < -1) {
    return null;
  }

  let H = isSunrise ? 360 - radToDeg(Math.acos(cosH)) : radToDeg(Math.acos(cosH));
  H = H / 15;

  const T = H + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = (UT + 24) % 24;

  return UT;
}

function getSunTimesForDate(dateISO: string, lat: number, lon: number) {
  const [year, month, day] = dateISO.split("-").map((value) => parseInt(value, 10));
  const sunriseUT = calcSunTime({ year, month, day, lat, lon, isSunrise: true });
  const sunsetUT = calcSunTime({ year, month, day, lat, lon, isSunrise: false });

  if (sunriseUT === null || sunsetUT === null) {
    return null;
  }

  const sunrise = new Date(Date.UTC(year, month - 1, day, 0, 0));
  sunrise.setUTCHours(Math.floor(sunriseUT), Math.round((sunriseUT % 1) * 60), 0, 0);

  const sunset = new Date(Date.UTC(year, month - 1, day, 0, 0));
  sunset.setUTCHours(Math.floor(sunsetUT), Math.round((sunsetUT % 1) * 60), 0, 0);

  return {
    sunrise,
    sunset
  };
}

export function getSunTimes(dateISO: string, lat: number, lon: number) {
  const times = getSunTimesForDate(dateISO, lat, lon);
  if (!times) return null;
  const [year, month, day] = dateISO.split("-").map((value) => parseInt(value, 10));
  const next = new Date(Date.UTC(year, month - 1, day, 0, 0));
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDateISO = next.toISOString().slice(0, 10);
  const nextTimes = getSunTimesForDate(nextDateISO, lat, lon);
  return {
    ...times,
    nextSunrise: nextTimes?.sunrise ?? null
  };
}
