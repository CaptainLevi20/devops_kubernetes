# Log Output

Aplicación que genera un string aleatorio al inicio y lo imprime cada 5 segundos con timestamp.

## Archivos

* `index.js`: Código principal de la app.
* `package.json`: Dependencias.
* `Dockerfile`: Para construir la imagen del contenedor.
* `deployment.yaml`: Para desplegar en Kubernetes.

## Cómo ejecutar localmente

1. Construir la imagen Docker:

```bash
docker build -t log-output:1.0 .
```

2. Ejecutar la imagen localmente:

```bash
docker run --rm log-output:1.0
```

Deberías ver una salida similar a:

```
2026-02-08T18:15:17.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43
2026-02-08T18:15:22.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43
```

## Cómo subir la imagen a Docker Hub

1. Iniciar sesión en Docker Hub:

```bash
docker login
```

2. Etiquetar la imagen con tu usuario:

```bash
docker tag log-output:1.0 <tu-usuario-dockerhub>/log-output:1.0
```

3. Subir la imagen:

```bash
docker push <tu-usuario-dockerhub>/log-output:1.0
```

## Despliegue en Kubernetes

1. Actualiza `deployment.yaml` para usar tu imagen de Docker Hub:

```yaml
image: <tu-usuario-dockerhub>/log-output:1.0
imagePullPolicy: Always
```

2. Aplicar el Deployment:

```bash
kubectl apply -f deployment.yaml
```

3. Verificar que el pod esté corriendo:

```bash
kubectl get pods
```

4. Revisar los logs en tiempo real:

```bash
kubectl logs <nombre-del-pod> -f
```

Deberías ver la misma salida que en local, con el string aleatorio impreso cada 5 segundos.

## Notas

* La imagen siempre imprime el **mismo string aleatorio** mientras el pod esté corriendo. Si el pod se reinicia, se generará un nuevo string.
* Asegúrate de usar `imagePullPolicy: Always` para que Kubernetes siempre descargue la última versión de tu imagen desde Docker Hub.
