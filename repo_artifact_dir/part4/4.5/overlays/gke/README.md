Despliegue en GKE usando Kustomize

Pasos resumidos:

1) Autentícate y configura el proyecto/cluster:

```bash
gcloud auth login
gcloud config set project PROJECT_ID
gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID
```

2) Construir y subir las imágenes (frontend: la carpeta raíz de este ejercicio; backend: `todo-backend`):

```bash
# desde c:\Users\asant\devops_kubernetes\part3\3.5
gcloud builds submit --tag gcr.io/$PROJECT_ID/todo-frontend:latest .
cd todo-backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/todo-backend:latest .
```

3) Actualizar las referencias de imagen en el overlay (opcional):

```bash
# usando kustomize (o editar overlays/gke/kustomization.yaml)
kustomize edit set image todo-frontend=gcr.io/$PROJECT_ID/todo-frontend:latest todo-backend=gcr.io/$PROJECT_ID/todo-backend:latest
```

4) Aplicar el overlay a tu cluster GKE:

```bash
kustomize build overlays/gke | kubectl apply -f -
# o con kubectl -k
kubectl apply -k overlays/gke
```

- Notas:
- Reemplaza `PROJECT_ID`, `CLUSTER_NAME` y `ZONE` por tus valores.
- Si los nombres de contenedor en los `Deployment` no coinciden con `todo-frontend`/`todo-backend`, ajusta las entradas `images:` en `overlays/gke/kustomization.yaml`.

CI/CD (Cloud Build):
- Archivo de ejemplo: `part3/3.5/cloudbuild.yaml` — construye y push de imágenes, aplica `overlays/gke` y hace `kubectl set image` con el tag `$SHORT_SHA`.
- Para activar: crea un trigger en Cloud Build apuntando al repositorio y configura las sustituciones `_CLUSTER_NAME` y `_CLUSTER_ZONE`.

PVC y estrategia de despliegue:
- Si uno de tus `Deployment` monta un PVC con `ReadWriteOnce`, usa `strategy: type: Recreate` en ese `Deployment` o mantén un solo `replica`.
- En este repo el Postgres está como `StatefulSet` con `ReadWriteOnce` y `replicas: 1`, lo que es apropiado para RWO.
