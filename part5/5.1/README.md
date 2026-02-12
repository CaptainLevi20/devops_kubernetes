# Part 5.1 — DummySite controller

Este ejercicio implementa un CRD **DummySite** y un controlador que, al crear un `DummySite` con `spec.website_url`, genera en el mismo namespace:

- `ConfigMap` con `index.html` (HTML descargado)
- `Deployment` con `nginx` sirviendo el `index.html`
- `Service` (ClusterIP) para acceder al sitio

## Archivos

- `rbac.yaml`: ServiceAccount + Role + RoleBinding (namespace-scoped)
- `deployment.yaml`: CRD + Deployment del controlador
- `dummysite-example.yaml`: ejemplo de DummySite

## Build de la imagen del controlador

Desde `part5/5.1`:

```sh
docker build -t dummy-site-controller:latest .
```

En clusters tipo kind/minikube puede que necesites cargar la imagen al cluster (ej. `kind load docker-image ...`).

## Deploy (workflow pedido)

El controlador opera en **el namespace donde se despliega** (watch namespace = `metadata.namespace`).

Ejemplo usando el namespace `project`:

```sh
kubectl create ns project

# 1) role, account and binding
kubectl -n project apply -f rbac.yaml

# 2) deployment (incluye el CRD)
kubectl -n project apply -f deployment.yaml

# 3) DummySite
kubectl -n project apply -f dummysite-example.yaml
```

## Probar que crea la copia

Busca el Service creado y haz port-forward:

```sh
kubectl -n project get svc -l app=dummy-site
kubectl -n project port-forward svc/example-svc 8080:80
```

Luego abre `http://localhost:8080`.

Notas:
- Para webs complejas, el HTML puede renderizar sin CSS correcto; se inserta un `<base href="...">` para ayudar con rutas relativas.
