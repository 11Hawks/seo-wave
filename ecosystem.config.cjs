module.exports = {
  apps: [
    {
      name: 'seo-platform',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 4000,
      max_memory_restart: '500M'
    }
  ]
}