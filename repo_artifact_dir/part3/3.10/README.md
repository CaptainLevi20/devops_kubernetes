# Resumen: Backup diario de la BD Todo

Este directorio documenta el cambio realizado para crear backups diarios de la base de datos PostgreSQL del ejercicio Todo.

Cambios realizados
- Se añadió el manifiesto del CronJob que realiza un `pg_dump` y sube el volcado a Google Cloud Storage:
  - Archivo: `part2/2.10/cronjob-backup.yaml`
  - Cron: `0 2 * * *` (diario a las 02:00 UTC)
  - Contenedor: `google/cloud-sdk:slim` (instala `postgresql-client` en tiempo de ejecución)
  - Se usa el servicio `postgres` en el namespace `project` como host del dump.

Secretos y configuración
- El CronJob espera dos Secrets en el namespace `project`:
  1. `gcs-credentials` — contiene el fichero JSON de la cuenta de servicio de GCP bajo la clave `key.json` (montado en `/secrets/gcs/key.json`).
  2. `gcs-backup-secret` — contiene al menos las claves:
     - `bucket` : nombre del bucket GCS donde se subirán los backups
     - `prefix` : (opcional) prefijo/prefix dentro del bucket (ej. `todo-db-backups`)

Además el CronJob reutiliza los secretos/configmap ya existentes para acceder a la BD:
- `todo-backend-secret` (contiene `POSTGRES_USER` y `POSTGRES_PASSWORD`)
- `todo-backend-config` (contiene `POSTGRES_DB`)

Comandos útiles

Crear los secretos (ejemplo):

```bash
kubectl -n project create secret generic gcs-credentials --from-file=key.json=/ruta/a/mi-service-account.json
kubectl -n project create secret generic gcs-backup-secret --from-literal=bucket=mi-bucket --from-literal=prefix=todo-db-backups
```

Aplicar el CronJob:

```bash
kubectl apply -f part2/2.10/cronjob-backup.yaml
```

Verificar ejecución y logs (cuando se cree un Job):

```bash
kubectl -n project get cronjob todo-db-backup
kubectl -n project get jobs --selector=job-name
kubectl -n project logs job/<job-name> -c backup
```

Notas
- El `pg_dump` se realiza en formato comprimido `-Fc` y el archivo temporal se borra tras subirlo.
- Ajusta la hora del `schedule` según tu zona horaria/ventana de mantenimiento.
