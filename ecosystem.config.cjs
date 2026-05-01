module.exports = {
  apps: [
    {
      name: "personal-blog",
      script: ".output/server/index.mjs",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        HOST: "127.0.0.1",
      },
    },
  ],
};
