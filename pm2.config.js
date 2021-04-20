
/**
 * pm2 init command
 * pm2 start pm2.config.js
 */
module.exports = {
  "apps": [
    {
      "name": "utopia-game",
      "script": "npm",
      "args" : "start"
    }
  ]
}
