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
const bodyParser = require('body-parser');
const port = 8080;
const { connection } = require('./connector');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/totalRecovered', async (req, res) => {
  const data = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        recovered: {
          $sum: '$recovered',
        },
      },
    },
  ]);
  res.status(200).json({ data: data[0] });
});

app.get('/totalActive', async (req, res) => {
  const data = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        active: {
          $sum: { $subtract: ['$infected', '$recovered'] },
        },
      },
    },
  ]);
  res.status(200).json({ data: data[0] });
});

app.get('/totalDeath', async (req, res) => {
  const data = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        death: {
          $sum: '$death',
        },
      },
    },
  ]);
  res.status(200).json({ data: data[0] });
});

app.get('/hotspotStates', async (req, res) => {
  try {
    const data = await connection.aggregate([
      { $project: { _id: 0, state: 1, rate: { $round: [{ $divide: ["$infected", "$population"] }, 5] } } },
      { $match: { rate: { $gt: 0.1 } } }
    ]).toArray();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/healthyStates', async (req, res) => {
  const data = await connection.aggregate([
    {
      $addFields: {
        mortality: {
          $round: [{ $divide: ['$death', '$infected'] }, 5],
        },
      },
    },
    {
      $match: {
        mortality: { $lt: 0.005 },
      },
    },
    {
      $project: {
        state: 1,
        mortality: 1,
        _id: 0,
      },
    },
  ]);
  res.status(200).json({ data });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports = app;
