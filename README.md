# devops_kubernetes
Desarrollo curso DevOps with Kubernetes

## Namespaces

- **Purpose**: the exercises use a dedicated Kubernetes namespace called `exercises` so resources for the course don't collide with other clusters or namespaces. The project/back-end exercises use a separate `project` namespace.
- **Namespace manifests**: see [namespaces/exercises-namespace.yaml](namespaces/exercises-namespace.yaml#L1) and [namespaces/project-namespace.yaml](namespaces/project-namespace.yaml#L1).

- **Create the namespaces**:

```bash
kubectl apply -f namespaces/exercises-namespace.yaml
kubectl apply -f namespaces/project-namespace.yaml
```

- **Apply an exercise manifest into the exercises namespace** (example):

```bash
kubectl apply -f part1/1.9/deployment.yaml
kubectl apply -f part1/1.9/service.yaml
```

The manifests in the `part1` and `part2` folders are already configured to use `namespace: exercises` for the course exercises and `namespace: project` for the project exercises. Use the `exercises` namespace for all course exercises moving forward.

