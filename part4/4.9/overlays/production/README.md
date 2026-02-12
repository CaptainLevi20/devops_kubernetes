Requisitos para el overlay `production`

- Secret `broadcaster-external` (tipo generic) con la clave `EXTERNAL_URL` que contiene la URL objetivo del `broadcaster`.
- Secret `todo-backend-secret` con `POSTGRES_USER` y `POSTGRES_PASSWORD`.
- ConfigMap `todo-backend-config` con `POSTGRES_DB` (si aplica).
- Secret `gcs-backup-secret` con la clave `bucket` (y credenciales necesarias para `gsutil`/provider).

Nota: Según el enunciado, los secretos se aplican fuera del repositorio / ArgoCD. Aquí se referencia su nombre (`broadcaster-external`, `todo-backend-secret`, `gcs-backup-secret`) y se espera que existan en el `namespace: production`.

CI / GitHub Actions:
- El workflow asume el secret de GitHub `KUBE_CONFIG_DATA` (kubeconfig en base64) disponible en el repositorio.
