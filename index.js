const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const moment = require('moment');

// Helper function to parse movie runtime from text to minutes
const runtimeToMinutes = (runtime) => {
  const [hours, minutes] = runtime.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calculate showtimes for a single movie
const calculateShowtimes = (movie, openingTime, closingTime) => {
  const setupTime = 60; // 1 hour setup time before any movies
  const changeOverTime = 35; // 35 minutes between showings
  const runtime = runtimeToMinutes(movie.runTime);
  let showtimes = [];
  let currentTime = openingTime.clone().add(setupTime, 'minutes');

  while (currentTime.clone().add(runtime + changeOverTime, 'minutes').isBefore(closingTime)) {
    const endTime = currentTime.clone().add(runtime, 'minutes');
    showtimes.push(`${currentTime.format('HH:mm')} - ${endTime.format('HH:mm')}`);
    currentTime.add(runtime + changeOverTime, 'minutes');
  }

  return showtimes;
};

// Main function to read file and generate schedule
const generateSchedule = async () => {
  const { filePath, scheduleDate } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Enter the path to the movie list file:',
      validate: input => fs.existsSync(input) ? true : 'File does not exist, please enter a valid path.'
    },
    {
      type: 'input',
      name: 'scheduleDate',
      message: 'Enter the date for the schedule (MM/DD/YYYY):',
      validate: input => moment(input, 'MM/DD/YYYY', true).isValid() ? true : 'Please enter a date in MM/DD/YYYY format.'
    }
  ]);

  const date = moment(scheduleDate, 'MM/DD/YYYY');
  const isWeekend = date.day() === 0 || date.day() === 6;

  const openingTime = isWeekend ? moment(scheduleDate).hour(10).minute(30) : moment(scheduleDate).hour(8);
  const closingTime = isWeekend ? moment(scheduleDate).hour(23).minute(30) : moment(scheduleDate).hour(23);

  const data = fs.readFileSync(path.resolve(filePath), 'utf8');
  const movies = data.split('\n').slice(1).map(line => {
    const [title, releaseYear, mpaaRating, runTime] = line.split(', ');
    return { title, releaseYear, mpaaRating, runTime };
  });

  console.log(`\nSchedule for ${date.format('dddd MM/DD/YYYY')}\n`);

  movies.forEach(movie => {
    const showtimes = calculateShowtimes(movie, openingTime, closingTime);
    console.log(`${movie.title} - Rated ${movie.mpaaRating}, ${movie.runTime}`);
    showtimes.forEach(showtime => console.log(`  ${showtime}`));
    console.log('');
  });
};

generateSchedule().catch(err => console.error(err));
