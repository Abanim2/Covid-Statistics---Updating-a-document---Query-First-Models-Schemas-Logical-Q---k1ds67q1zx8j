// const express = require('express')
// const app = express()
// const bodyParser = require("body-parser");
// const port = 8080

// // Parse JSON bodies (as sent by API clients)
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
// const { connection } = require('./connector')






// app.listen(port, () => console.log(`App listening on port ${port}!`))

// module.exports = app;



const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const port = 8080;

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const { connection } = require('./connector');

const roundTo5Decimal = (num) => {
  return { $round: [{ $toDouble: num }, 5] };
};

app.get('/totalRecovered', async (req, res) => {
  const totalRecovered = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        recovered: { $sum: '$recovered' },
      },
    },
  ]);
  res.json({
    data: totalRecovered[0],
  });
});

app.get('/totalActive', async (req, res) => {
  const totalActive = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        active: {
          $sum: {
            $subtract: ['$infected', '$recovered'],
          },
        },
      },
    },
  ]);
  res.json({
    data: totalActive[0],
  });
});

app.get('/totalDeath', async (req, res) => {
  const totalDeath = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        death: { $sum: '$death' },
      },
    },
  ]);
  res.json({
    data: totalDeath[0],
  });
});

app.get('/hotspotStates', async (req, res) => {
  const hotspotStates = await connection.aggregate([
    {
      $project: {
        state: 1,
        rate: roundTo5Decimal({
          $divide: [
            { $subtract: ['$infected', '$recovered'] },
            '$infected',
          ],
        }),
      },
    },
    {
      $match: {
        rate: { $gt: 0.1 },
      },
    },
  ]);
  res.json({
    data: hotspotStates,
  });
});

app.get('/healthyStates', async (req, res) => {
  const healthyStates = await connection.aggregate([
    {
      $project: {
        state: 1,
        mortality: roundTo5Decimal({
          $divide: ['$death', '$infected'],
        }),
      },
    },
    {
      $match: {
        mortality: { $lt: 0.005 },
      },
    },
  ]);
  res.json({
    data: healthyStates,
  });
});

app.listen(port, () =>
  console.log(`App listening on port ${port}!`)
);

module.exports = app;
