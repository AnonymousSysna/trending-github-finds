// PM2 config for production deployment
// Usage: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "trending-web",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "500M",
      error_file: "logs/web-error.log",
      out_file: "logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
  // Cron: run pipeline daily at 5:00 AM UTC
  // Set up system cron instead:
  // 0 5 * * * cd /var/www/trending && CRON_SECRET=xxx curl -X POST http://localhost:3000/api/pipeline/run -H "x-cron-secret: xxx"
};
