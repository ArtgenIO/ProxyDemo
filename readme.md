# Local Proxy Demo for Fastify Servers

---

This is a demonstration on how You can swap web servers without downtime.

My use case was simple, I had to change the web server routings and handlers without stopping the service, and in this demo You can see how we start a "proxy" instance and pass the request to an "upstream" while continiously swapping out the backend for them.

---

### How to Start

```
git clone git@github.com:ArtgenIO/ProxyDemo.git
cd ProxyDemo
yarn install # or npm i
node index.js
```

then visit the [http://localhost:7200](http://localhost:7200) address. You will see the changing upstream IDs and can follow the events in the console.
