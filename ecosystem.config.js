module.exports = {
  apps: [
    {
      name: "ptites-crea-claire",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3015",
      cwd: "/var/www/ptites-crea-claire",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3015
      },
      error_file: "/var/log/ptites-crea-claire-error.log",
      out_file: "/var/log/ptites-crea-claire-out.log",
      time: true
    }
  ]
};
