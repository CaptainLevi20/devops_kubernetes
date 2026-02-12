Pasos para usar Flux (GitOps) con este repositorio

1) Reemplace la URL en `flux-system/gitrepository.yaml` con la URL de su repositorio (HTTPS) o use el comando `flux bootstrap` descrito abajo.

2) Opciones de bootstrap:

- Usar la CLI de Flux (recomendado):

  flux bootstrap github \
    --owner=<GITHUB_OWNER> \
    --repository=<REPO_NAME> \
    --branch=main \
    --path=./gitops/flux/flux-system

  Esto instalará los controladores de Flux en el clúster y creará el recurso `GitRepository` apuntando a este repo.

- O bien, si ya tiene los controladores instalados, aplique los manifiestos directamente:

  kubectl apply -f gitops/flux/flux-system/

3) Qué hace esto

- `gitops/flux/flux-system/gitrepository.yaml` señala a la rama `main` del repositorio.
- `gitops/flux/flux-system/kustomization-flux.yaml` indica a Flux que sincronice la ruta `part4/4.8` del repo hacia el clúster.

4) Notas

- Reemplace `https://github.com/REPLACE_WITH_YOUR_REPO.git` por la URL real de su repositorio.
- Puede cambiar `path` en el `Kustomization` si quiere desplegar otra carpeta.
- Una vez bootstrapado Flux con la URL correcta, cualquier commit a `main` hará que Flux aplique los cambios automáticamente.
