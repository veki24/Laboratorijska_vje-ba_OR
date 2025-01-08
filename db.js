const { Pool } = require('pg');

// Konfiguracija za spajanje na bazu
const pool = new Pool({
    user: 'postgres', // npr. postgres
    host: 'localhost',           // ili IP adresa servera
    database: 'Klub',       // naziv baze
    password: 'bazepodataka',    // lozinka za korisnika
    port: 5432,                  // defaultni port za PostgreSQL
});

module.exports = pool;
