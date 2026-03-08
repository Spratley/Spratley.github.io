// DateCalculator.js

function GetYearsSince(date) {
  return PreciseDuration(date).years;
}

function PreciseDuration(startDate) {
  const now = new Date();

  // Get pure date differences, negatives are allowed for now
  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();
  let hours = now.getHours() - startDate.getHours();
  let minutes = now.getMinutes() - startDate.getMinutes();
  let seconds = now.getSeconds() - startDate.getSeconds();

  // Resolve negatives in reverse order
  if (seconds < 0) {
    minutes -= 1;
    seconds += 60;
  }
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  if (hours < 0) {
    days -= 1;
    hours += 24;
  }
  if (days < 0) {
    // Days need to be relative to the number of days in the previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  // Years doesn't need to be resolved, it can only be negative if startDate is in the future

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

function SetStaticDateCounters() {
  document.querySelectorAll('#aaa-years-experience-count').forEach(element => {
    element.textContent = GetYearsSince(aaaStart);
  });
}

SetStaticDateCounters();
setInterval(UpdateCounters, 1000);
UpdateCounters();
window.addEventListener('languageChanged', UpdateCounters);