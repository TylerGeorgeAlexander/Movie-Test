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

  const date = moment(scheduleDate, 'MM/DD/YYYY', true);
  const isWeekend = date.day() === 0 || date.day() === 6;

  const openingTime = isWeekend ? moment(scheduleDate, 'MM/DD/YYYY', true).set({hour: 10, minute: 30}) : moment(scheduleDate, 'MM/DD/YYYY', true).set({hour: 8, minute: 0});
  const closingTime = isWeekend ? moment(scheduleDate, 'MM/DD/YYYY', true).set({hour: 23, minute: 30}) : moment(scheduleDate, 'MM/DD/YYYY', true).set({hour: 23, minute: 0});

  const data = fs.readFileSync(path.resolve(filePath), 'utf8');
  const movies = data.split('\n').slice(1).map(line => {
    const [title, releaseYear, mpaaRating, runTime] = line.split(', ');
    return { title, releaseYear, mpaaRating, runTime };
  });

//   console.log(`\nSchedule for ${date.format('dddd MM/DD/YYYY')}\n`);

//   movies.forEach(movie => {
//     const showtimes = calculateShowtimes(movie, openingTime, closingTime);
//     console.log(`${movie.title} - Rated ${movie.mpaaRating}, ${movie.runTime}`);
//     showtimes.forEach(showtime => console.log(`  ${showtime}`));
//     console.log('');
//   });

  // Initialize the output with the schedule date header
  let output = `Schedule for ${date.format('dddd MM/DD/YYYY')}\n\n`;

  movies.forEach(movie => {
    const showtimes = calculateShowtimes(movie, openingTime, closingTime);
    output += `${movie.title} - Rated ${movie.mpaaRating}, ${movie.runTime}\n`;
    showtimes.forEach(showtime => output += `  ${showtime}\n`);
    output += '\n'; // Add an extra newline for spacing between movies
  });

  // Ensure the /dist directory exists
  const distPath = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
  }

  // Save the output to a file
  const outputPath = path.join(distPath, 'output.csv');
  fs.writeFileSync(outputPath, output, 'utf8');

  console.log(`Schedule saved to ${outputPath}`);
};

generateSchedule().catch(err => console.error(err));
