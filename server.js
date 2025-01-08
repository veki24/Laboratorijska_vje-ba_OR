const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(cors());
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./openapi.json');



// Posluživanje statičkih datoteka iz mape "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta za osnovni URL "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/clubs-with-players', async (req, res) => {
  try {
      const clubsResult = await pool.query('SELECT * FROM klub');
      const clubs = clubsResult.rows;

      const clubsWithPlayers = await Promise.all(
          clubs.map(async (club) => {
              const playersResult = await pool.query('SELECT * FROM igrac WHERE klub_id = $1', [club.klub_id]);
              return {
                  ...club,
                  players: playersResult.rows
              };
          })
      );

      res.json({
          status: 'success',
          data: clubsWithPlayers
      });
  } catch (error) {
      console.error('Error fetching clubs with players:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.get('/api/clubs/:id', async (req, res) => {
  const clubId = parseInt(req.params.id);
  try {
      const clubResult = await pool.query('SELECT * FROM klub WHERE klub_id = $1', [clubId]);
      const playersResult = await pool.query('SELECT * FROM igrac WHERE klub_id = $1', [clubId]);

      if (clubResult.rows.length === 0) {
          return res.status(404).json({
              status: 'error',
              message: 'Club not found'
          });
      }

      const clubWithPlayers = {
          ...clubResult.rows[0],
          players: playersResult.rows
      };

      res.json({
          status: 'success',
          data: clubWithPlayers
      });
  } catch (error) {
      console.error('Error fetching club:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.get('/api/clubs', async (req, res) => {
    try {
        const clubResult = await pool.query('SELECT * FROM klub');
        res.json({
            status: 'success',
            data: clubResult.rows
        });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
  });

app.get('/api/players', async (req, res) => {
  try {
      const playersResult = await pool.query('SELECT * FROM igrac');
      res.json({
          status: 'success',
          data: playersResult.rows
      });
  } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.get('/api/players/:id', async (req, res) => {
  const playerId = parseInt(req.params.id);
  try {
      const playerResult = await pool.query('SELECT * FROM igrac WHERE igrac_id = $1', [playerId]);

      if (playerResult.rows.length === 0) {
          return res.status(404).json({
              status: 'error',
              message: 'Player not found'
          });
      }

      res.json({
          status: 'success',
          data: playerResult.rows[0]
      });
  } catch (error) {
      console.error('Error fetching player:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.get('/api/clubs/city/:city', async (req, res) => {
  const city = req.params.city;
  try {
      const clubsResult = await pool.query('SELECT * FROM klub WHERE grad ILIKE $1', [city]);

      if (clubsResult.rows.length === 0) {
          return res.status(404).json({
              status: 'error',
              message: 'No clubs found in the specified city'
          });
      }

      res.json({
          status: 'success',
          data: clubsResult.rows
      });
  } catch (error) {
      console.error('Error fetching clubs by city:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.post('/api/clubs', async (req, res) => {
  const { ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener } = req.body;
  try {
      const result = await pool.query(
          'INSERT INTO klub (ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener]
      );

      res.status(201).json({
          status: 'success',
          data: result.rows[0]
      });
  } catch (error) {
      console.error('Error adding club:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.put('/api/clubs/:id', async (req, res) => {
  const clubId = parseInt(req.params.id);
  const { ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener } = req.body;
  try {
      const result = await pool.query(
          'UPDATE klub SET ime_kluba = $1, grad = $2, osnovan = $3, stadion = $4, kapacitet_stadiona = $5, liga = $6, trener = $7 WHERE klub_id = $8 RETURNING *',
          [ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener, clubId]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({
              status: 'error',
              message: 'Club not found'
          });
      }

      res.json({
          status: 'success',
          data: result.rows[0]
      });
  } catch (error) {
      console.error('Error updating club:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

app.delete('/api/clubs/:id', async (req, res) => {
  const clubId = parseInt(req.params.id);
  try {
      const result = await pool.query('DELETE FROM klub WHERE klub_id = $1 RETURNING *', [clubId]);

      if (result.rows.length === 0) {
          return res.status(404).json({
              status: 'error',
              message: 'Club not found'
          });
      }

      res.json({
          status: 'success',
          message: 'Club deleted successfully',
          data: result.rows[0]
      });
  } catch (error) {
      console.error('Error deleting club:', error);
      res.status(500).json({
          status: 'error',
          message: 'Internal Server Error'
      });
  }
});

// Posluživanje OpenAPI specifikacije
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Krajnja točka za preuzimanje OpenAPI specifikacije
app.get('/api/openapi', (req, res) => {
    res.json(openApiSpec);
});


// Start servera
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
