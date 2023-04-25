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

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Route for total recovered patients
app.get('/totalRecovered', async (req, res) => {
  const recovered = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        recovered: {
          $sum: '$recovered'
        }
      }
    }
  ]);
  res.json({ data: recovered[0] });
});

// Route for total active patients
app.get('/totalActive', async (req, res) => {
  const active = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        active: {
          $sum: {
            $subtract: ['$infected', '$recovered']
          }
        }
      }
    }
  ]);
  res.json({ data: active[0] });
});

// Route for total deaths
app.get('/totalDeath', async (req, res) => {
  const death = await connection.aggregate([
    {
      $group: {
        _id: 'total',
        death: {
          $sum: '$death'
        }
      }
    }
  ]);
  res.json({ data: death[0] });
});

// Route for hotspot states
app.get('/hotspotStates', async (req, res) => {
  const hotspots = await connection.aggregate([
    {
      $project: {
        state: 1,
        rate: {
          $round: [{ $subtract: [{ $divide: [{ $subtract: ['$infected', '$recovered'] }, '$infected'] }, 1] }, 5]
        }
      }
    },
    {
      $match: {
        rate: { $gt: 0.1 }
      }
    }
  ]);
  res.json({ data: hotspots });
});

// Route for healthy states
app.get('/healthyStates', async (req, res) => {
  const healthy = await connection.aggregate([
    {
      $project: {
        state: 1,
        mortality: {
          $round: [{ $divide: ['$death', '$infected'] }, 5]
        }
      }
    },
    {
      $match: {
        mortality: { $lt: 0.005 }
      }
    }
  ]);
  res.json({ data: healthy });
});


// Endpoint to get hotspot states
app.get('/hotspotStates', async (req, res) => {
  try {
    const states = await connection.aggregate([
      // Group by state and calculate rate
      {
        $group: {
          _id: '$state',
          infected: { $sum: '$infected' },
          recovered: { $sum: '$recovered' },
        },
      },
      {
        $project: {
          state: '$_id',
          rate: {
            $round: [
              {
                $cond: {
                  if: { $eq: ['$infected', 0] },
                  then: 0,
                  else: {
                    $divide: [
                      { $subtract: ['$infected', '$recovered'] },
                      '$infected',
                    ],
                  },
                },
              },
              5,
            ],
          },
          _id: 0,
        },
      },
      // Match where rate is greater than 0.1
      {
        $match: { rate: { $gt: 0.1 } },
      },
    ]).toArray();

    const response = { data: states };
    res.status(200).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/hotspotStates', async (req, res) => {
  try {
    const data = await covid19Stats.aggregate([
      {
        $project: {
          state: "$state",
          rate: {
            $round: [
              {
                $divide: [
                  {
                    $subtract: ["$infected", "$recovered"]
                  },
                  "$infected"
                ]
              },
              5
            ]
          }
        }
      },
      {
        $match: {
          rate: { $gt: 0.1 }
        }
      },
      {
        $project: {
          state: 1,
          rate: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      data: data
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});


app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports = app;
