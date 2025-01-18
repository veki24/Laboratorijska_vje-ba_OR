const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');
const { auth, requiresAuth } = require('express-openid-connect');
const swaggerUi = require('swagger-ui-express'); // Fix: Ensure swagger-ui-express is imported
const openApiSpec = require('./openapi.json');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Auth0 Configuration
const config = {
  authRequired: false, // Disable forced login globally
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL || `http://localhost:${process.env.PORT}`,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
};

app.use(auth(config));

// Middleware to pass user data to views
app.use((req, res, next) => {
  res.locals.user = req.oidc.user;
  next();
});

app.get('/', (req, res) => {
  res.render('index', {
      title: 'Otvoreni podaci: Klub i igrači',
      isAuthenticated: req.oidc.isAuthenticated(),
      user: req.oidc.user,
  });
});


app.get('/profile', requiresAuth(), (req, res) => {
  res.render('profile', {
    title: 'Profile Page',
    userProfile: JSON.stringify(req.oidc.user, null, 2),
  });
});

// API Endpoints
app.get('/api/clubs-with-players', async (req, res) => {
  try {
    const clubsResult = await pool.query('SELECT * FROM klub');
    const clubs = clubsResult.rows;

    const clubsWithPlayers = await Promise.all(
      clubs.map(async (club) => {
        const playersResult = await pool.query('SELECT * FROM igrac WHERE klub_id = $1', [club.klub_id]);
        return {
          ...club,
          players: playersResult.rows,
        };
      })
    );

    res.json({
      status: 'success',
      data: clubsWithPlayers,
    });
  } catch (error) {
    console.error('Error fetching clubs with players:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.get('/api/clubs/:id', async (req, res) => {
  const clubId = parseInt(req.params.id);
  try {
    const clubResult = await pool.query('SELECT * FROM klub WHERE klub_id = $1', [clubId]);
    const playersResult = await pool.query('SELECT * FROM igrac WHERE klub_id = $1', [clubId]);

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Club not found' });
    }

    const clubWithPlayers = {
      ...clubResult.rows[0],
      players: playersResult.rows,
    };

    res.json({ status: 'success', data: clubWithPlayers });
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.get('/api/clubs', async (req, res) => {
  try {
    const clubResult = await pool.query('SELECT * FROM klub');
    res.json({ status: 'success', data: clubResult.rows });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const playersResult = await pool.query('SELECT * FROM igrac');
    res.json({ status: 'success', data: playersResult.rows });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.get('/api/players/:id', async (req, res) => {
  const playerId = parseInt(req.params.id);
  try {
    const playerResult = await pool.query('SELECT * FROM igrac WHERE igrac_id = $1', [playerId]);

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Player not found' });
    }

    res.json({ status: 'success', data: playerResult.rows[0] });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.post('/api/clubs', async (req, res) => {
  const { ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO klub (ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [ime_kluba, grad, osnovan, stadion, kapacitet_stadiona, liga, trener]
    );

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding club:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

app.get('/api/clubs-jsonld', async (req, res) => {
  try {
    const clubsResult = await pool.query('SELECT * FROM klub');
    const clubs = clubsResult.rows;

    const clubsWithPlayers = await Promise.all(
      clubs.map(async (club) => {
        const playersResult = await pool.query('SELECT * FROM igrac WHERE klub_id = $1', [club.klub_id]);
        return {
          "@context": {
            "@vocab": "http://schema.org/",
            "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#"
          },
          "@type": "SportsTeam",
          "name": club.ime_kluba,
          "location": {
            "@type": "Place",
            "name": club.grad,
          },
          "foundingDate": club.osnovan,
          "areaServed": {
            "@type": "Place",
            "name": club.stadion
          },
          "members": playersResult.rows.map(player => ({
            "@type": "Person",
            "name": player.ime_igraca,
            "jobTitle": player.pozicija, 
            "identifier": player.broj_dresa, 
            "description": `Zabio ${player.broj_golova} golova i ostavrio ${player.broj_asistencija} asistencija`, // Changed
            "nationality": player.nacionalnost
          }))
        };
      })
    );

    res.json({ status: 'success', data: clubsWithPlayers });
  } catch (error) {
    console.error('Error fetching clubs with players (JSON-LD):', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});


// Swagger/OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get('/api/openapi', (req, res) => {
  res.json(openApiSpec);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
