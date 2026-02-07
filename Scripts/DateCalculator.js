// DateCalculator.js

function PreciseDuration(startDate) {
  const now = new Date();
  let delta = now - startDate; // milliseconds

  const msInSecond = 1000;
  const msInMinute = msInSecond * 60;
  const msInHour = msInMinute * 60;
  const msInDay = msInHour * 24;
  const msInYear = msInDay * 365.25; // average including leap years
  const msInMonth = msInYear / 12;

  const years = Math.floor(delta / msInYear);
  delta -= years * msInYear;

  const months = Math.floor(delta / msInMonth);
  delta -= months * msInMonth;

  const days = Math.floor(delta / msInDay);
  delta -= days * msInDay;

  const hours = Math.floor(delta / msInHour);
  delta -= hours * msInHour;

  const minutes = Math.floor(delta / msInMinute);
  delta -= minutes * msInMinute;

  const seconds = Math.floor(delta / msInSecond);

  return { years, months, days, hours, minutes, seconds };
}

function GetUnitLabel(value, unitKey, language) {
  const label = translations[language]?.[unitKey] || unitKey;

  if (language === 'en') {
    return value === 1 ? label : label + 's';
  }
  return label;
}

function FormatDuration(dur) {
  const language = document.documentElement.lang || 'en';

  // Define the units and their labels
  const units = [
    { val: dur.years, label: 'years' },
    { val: dur.months, label: 'months' },
    { val: dur.days, label: 'days' },
    { val: dur.hours, label: 'hours' },
    { val: dur.minutes, label: 'minutes' },
    { val: dur.seconds, label: 'seconds' }
  ];

 return units.map(u => `
    <div class="time-block">
      <div class="val">${u.val}</div>
      <div class="lab">${GetUnitLabel(u.val, u.label, language)}</div>
    </div>
  `).join('');
}

// Hard-coded dates
const babyDevStart = new Date(2011, 10, 14, 11, 50, 11); // November 14, 2011, 12:00 PM
const devStart = new Date(2017, 8, 5, 7, 30, 0, 16); // September 5, 2017, 07:30 AM
const aaaStart = new Date(2020, 4, 4, 9, 0, 45); // May 4, 2020, 09:00 AM

function UpdateCounters() {
  // Check if translations have loaded yet
  // If not, skip updating the counters until they are available
  if (!translations || Object.keys(translations).length === 0) {
    return;
  }

  document.getElementById('baby-dev-years').innerHTML = FormatDuration(PreciseDuration(babyDevStart));
  document.getElementById('total-dev-years').innerHTML = FormatDuration(PreciseDuration(devStart));
  document.getElementById('aaa-dev-years').innerHTML = FormatDuration(PreciseDuration(aaaStart));
}

setInterval(UpdateCounters, 1000);
UpdateCounters();
window.addEventListener('languageChanged', UpdateCounters);