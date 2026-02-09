# Todo App

Este es un servidor básico de Node.js que se prepara para desplegarse en Kubernetes. Actualmente solo muestra un mensaje de que el servidor está activo y permite configurar el puerto mediante una variable de entorno.

Próximamente se añadirá funcionalidad de aplicación **Todo**.

## Archivos principales

* `server.js` - Servidor Express que imprime el puerto en el que se inicia.
* `package.json` - Dependencias y scripts de Node.js.
* `Dockerfile` - Para construir la imagen Docker.
* `deployment.yaml` - Deployment de Kubernetes.

---

## Instalación y ejecución local

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar el servidor (por defecto puerto 3000):

```bash
npm start
```

3. Para usar un puerto personalizado:

```bash
PORT=5000 npm start
```

4. Abrir en el navegador:

```
http://localhost:<PORT>
```

---

## Construcción y despliegue con Docker

1. Construir la imagen:

```bash
docker build -t <your-dockerhub-username>/todo-app:1.0 .
```

2. Subir la imagen a Docker Hub:

```bash
docker push <your-dockerhub-username>/todo-app:1.0
```

---

## Despliegue en Kubernetes

1. Reemplaza `<YOUR_DOCKER_IMAGE>` en `deployment.yaml` por tu imagen Docker.
2. Aplicar el deployment:

```bash
kubectl apply -f deployment.yaml
```

3. Verificar que el pod esté corriendo:

```bash
kubectl get pods
```

4. Ver logs del pod:

```bash
kubectl logs <pod-name>
```

Deberías ver:

```
Server started in port 8080
```