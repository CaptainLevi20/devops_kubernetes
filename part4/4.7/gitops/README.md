Instrucciones rápidas para habilitar GitOps (Argo CD)

1. Requisitos
- Argo CD instalado en el cluster y accesible en el namespace `argocd`.

2. Añadir la aplicación a Argo CD
- Ajusta `repoURL` o `path` en `argocd-application.yaml` si es necesario.
- Aplica el manifiesto en el cluster (esto crea la Application en Argo CD):

```bash
kubectl apply -f part4/4.7/gitops/argocd-application.yaml -n argocd
```

3. Flujo de trabajo GitOps
- Haz cambios en los manifiestos dentro de `part4/4.7` y haz commit + push al repositorio remoto.
- Argo CD (con `syncPolicy.automated`) detectará los cambios y sincronizará automáticamente el clúster.

4. Notas
- Si tu rama principal no es `main`, cambia `targetRevision` en el Application.
- Si no tienes Argo CD, instala siguiendo https://argo-cd.readthedocs.io/.
