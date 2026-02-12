Resumen de la solución - log-output (ejercicio)
=============================================

Cambios realizados:
- Se creó `configmap.yaml` con la ConfigMap `log-output-config` que contiene la clave `MESSAGE` y el archivo `information.txt`.
- Se actualizó `deployment.yaml` para montar la ConfigMap en `/etc/config` y exponer `MESSAGE` como variable de entorno en ambos contenedores (`writer` y `reader`).
- Para asegurar que la aplicación imprima automáticamente el contenido de `/etc/config/information.txt` y la variable `MESSAGE` al iniciar, se añadió un `command` que ejecuta:

  - `cat /etc/config/information.txt` y `echo "$MESSAGE"` antes de `npm start`.

Por qué esta opción:
- Es una solución rápida y no requiere reconstrucción de imágenes; cumple con el enunciado del ejercicio (imprimir archivo + env var al arrancar).

Aplicar los cambios en el clúster:

```bash
kubectl apply -f part2/2.5/configmap.yaml -n exercises
kubectl apply -f part2/2.5/deployment.yaml -n exercises
```

Verificar pods y logs:

```bash
kubectl get pods -n exercises
kubectl logs -l app=log-output -n exercises --all-containers --tail=200
```

Pasos futuros (opcional):
- Revertir el `command` y reconstruir las imágenes para que el `npm start` ya incluya la impresión (más limpio a largo plazo).
- Rebuild de imágenes (limpio): modificar los ficheros de arranque y reconstruir las imágenes `log-output-writer` y `log-output-reader`, subirlas a un registry y actualizar el `Deployment` para usar las nuevas imágenes.

Instrucciones para reconstruir y desplegar las imágenes (ejemplo con Docker):

```bash
# Desde `part2/2.5` build reader
docker build -f Dockerfile.reader -t <your-registry>/log-output-reader:latest .
# Build writer
docker build -f Dockerfile.writer -t <your-registry>/log-output-writer:latest .
# Push to registry
docker push <your-registry>/log-output-reader:latest
docker push <your-registry>/log-output-writer:latest

# Actualizar deployment (opcional editar image: en part2/2.5/deployment.yaml)
kubectl set image deployment/log-output -n exercises \
  reader=<your-registry>/log-output-reader:latest \
  writer=<your-registry>/log-output-writer:latest
kubectl rollout status deployment/log-output -n exercises
```

Notas:
- Reemplaza `<your-registry>` por tu repositorio (Docker Hub, GitHub Container Registry, o el registry usado por k3d).
- Si usas k3d/local registry, asegúrate de etiquetar/transferir la imagen al registry del cluster o usar `imagePullPolicy: IfNotPresent` y cargar la imagen en los nodos.
