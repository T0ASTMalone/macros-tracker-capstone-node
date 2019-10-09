module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL:
    process.env.DATABASE_URL ||
    'postgresql://dunder_mifflin:itstoasty@localhost/macros-tracker',

  JWT_SECRET: process.env.JWT_SECRET || 'mumbai-power',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '5m'
};
