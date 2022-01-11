const fastify = require("fastify");

// You will be able to access the demo on http://localhost:7200
const PROXY_PORT = 7200;

// Just a serial ID to track which server we are using.
let UPSTREAM_ID = 0;

// Reference to the upstream server.
let UPSTREAM_INST;

const createServer = () => {
  return fastify({
    logger: {
      level: "debug",
      prettyPrint: true,
    },
    disableRequestLogging: true,
  });
};

const createUpstream = async () => {
  const srv = createServer();
  const id = ++UPSTREAM_ID;

  console.log(`Upstream [${id}] starting`);

  srv.get("/", (req, rep) => {
    console.log(`Upstream [${id}] serving [${req.id}]`);

    rep.statusCode = 200;
    rep.send({
      instanceId: id,
      from: "upstream",
    });
  });

  srv.addHook("onClose", () => {
    console.log(`Upstream [${id}] closed`);
  });

  await srv.listen(0);
  console.log(`Upstream [${id}] started`);

  // Upstream already running, will serve the active keep alive connections before switching
  if (UPSTREAM_INST) {
    UPSTREAM_INST.close();
  }

  // Swap instance, server new request from the new instance.
  UPSTREAM_INST = srv;
};

(async () => {
  const proxy = createServer();

  proxy.all("/*", (req, rep) => {
    console.log("Proxy serving fallback until the first upstream is ready...");

    rep.statusCode = 503;
    rep.send({
      from: "proxy",
      status: "waiting for upstream",
      onPort: PROXY_PORT,
    });
  });

  proxy.addHook("onRequest", (req, rep, done) => {
    // Upstream is ready to accept
    if (UPSTREAM_INST) {
      console.log("Proxy passing request to upstream", req.id);
      UPSTREAM_INST.routing(req.raw, rep.hijack().raw);
    }

    done();
  });

  await proxy.listen(PROXY_PORT, "0.0.0.0");
  await createUpstream();

  // DEMO starting new upstream server every 5 second
  setInterval(() => createUpstream(), 5_000);
})();
