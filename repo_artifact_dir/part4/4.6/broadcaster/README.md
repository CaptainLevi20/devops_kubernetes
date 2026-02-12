Broadcaster
=========

This service subscribes to NATS (`todos.events`) in a queue group `broadcasters` and forwards events to an external HTTP endpoint set by `EXTERNAL_URL`.

Build locally:

```
cd part4/4.6/broadcaster
docker build -t broadcaster:latest .
```

Deploy (example):

```
# edit the deployment.yaml to set EXTERNAL_URL to your endpoint
kubectl apply -f part4/4.6/broadcaster/deployment.yaml
```

Notes:
- Uses a NATS queue group so multiple replicas will not forward the same message.
- Uses best-effort forwarding; failures are logged but not retried indefinitely.
