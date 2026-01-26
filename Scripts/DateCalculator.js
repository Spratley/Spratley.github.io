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

function FormatDuration(dur) {
  // Define the units and their labels for the loop
  const units = [
    { val: dur.years, label: 'Years' },
    { val: dur.months, label: 'Months' },
    { val: dur.days, label: 'Days' },
    { val: dur.hours, label: 'Hours' },
    { val: dur.minutes, label: 'Minutes' },
    { val: dur.seconds, label: 'Seconds' }
  ];

  // Map through units to create the "Value OVER Label" structure
  return units.map(u => `
    <div class="time-block">
      <div class="val">${u.val}</div>
      <div class="lab">${u.label}</div>
    </div>
  `).join('');
}

// Hard-coded dates
const babyDevStart = new Date(2011, 10, 14, 11, 50, 11); // November 14, 2011, 12:00 PM
const devStart = new Date(2017, 8, 5, 7, 30, 0, 16); // September 5, 2017, 07:30 AM
const aaaStart = new Date(2020, 4, 4, 9, 0, 45); // May 4, 2020, 09:00 AM

function UpdateCounters() {
  // Use innerHTML instead of textContent since we are adding spans
  document.getElementById('baby-dev-years').innerHTML = FormatDuration(PreciseDuration(babyDevStart));
  document.getElementById('total-dev-years').innerHTML = FormatDuration(PreciseDuration(devStart));
  document.getElementById('aaa-dev-years').innerHTML = FormatDuration(PreciseDuration(aaaStart));
}

setInterval(UpdateCounters, 1000);
UpdateCounters();