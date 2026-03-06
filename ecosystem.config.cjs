module.exports = {
  apps: [
    {
      name: 'agent-passport-mcp-remote',
      script: 'build/remote.js',
      cwd: '/Users/tima/agent-passport-remote-mcp',
      env: { NODE_ENV: 'production', PORT: '3002' },
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: 'cloudflared-tunnel',
      script: '/Users/tima/.local/bin/cloudflared',
      args: 'tunnel --url http://localhost:3002',
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      // Quick tunnel — URL changes on restart.
      // To upgrade to mcp.aeoess.com, run:
      //   cloudflared tunnel login
      //   cloudflared tunnel create aeoess-mcp
      //   cloudflared tunnel route dns aeoess-mcp mcp.aeoess.com
      // Then change args to: 'tunnel run aeoess-mcp'
      // and add config.yml (see setup-named-tunnel.sh)
    },
  ],
};
