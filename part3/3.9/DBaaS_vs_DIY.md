# DBaaS vs DIY — Comparación práctica

Este documento resume las diferencias significativas entre usar un DBaaS (Database as a Service) y desplegar/operar tu propia base de datos (DIY), focalizándose en: trabajo requerido, costes de inicio y mantenimiento, y métodos de backup y su facilidad.

## Resumen
- DBaaS: proveedor gestiona la infraestructura, parches, backups y parte del monitoreo. Menos trabajo operativo para el equipo.
- DIY: control total sobre la arquitectura y configuración; mayor responsabilidad operativa.

## Inicialización
- Trabajo requerido
  - DBaaS: crear instancia/cluster desde consola o API, configurar red/credenciales y parámetros básicos. Tiempo: horas.
  - DIY: aprovisionar máquinas/instancias, configurar almacenamiento (I/O, IOPS), red, usuarios, seguridad, HA/replicación. Tiempo: días‑semanas.
- Costes iniciales
  - DBaaS: bajo coste inicial (pago por hora/mes). Costes variables por I/O/almacenamiento/transferencia.
  - DIY: coste inicial mayor (instancias, discos, licencias, setup de red), plus horas de ingeniería.

## Mantenimiento
- Trabajo requerido
  - DBaaS: proveedor aplica parches, upgrades y puede ofrecer monitoreo y alertas integradas; el equipo gestiona schemas, índices y tuning lógico.
  - DIY: equipo responsable de OS, motor de BD, parches, upgrades, backups, DR tests y monitorización (Prometheus/Grafana/alertmanager, etc.).
- Costes operativos
  - DBaaS: coste mensual/consumo; fácil de prever pero puede crecer con uso intensivo.
  - DIY: costes de infra y personal (SRE/DBA). Potencialmente más económico a escala si se automatiza bien, pero riesgo de overrun por horas humanas.

## Backups — métodos y facilidad
- DBaaS
  - Backups automáticos (snapshots), retenciones configurables y restauración desde consola o API.
  - Soporte para PITR (Point‑In‑Time Recovery) en muchos proveedores.
  - Facilidad: alta — restauraciones y pruebas de restore simples y documentadas.
- DIY
  - Requiere diseñar/automatizar backups: snapshots de disco (consistencia física), dumps lógicos (ej. `pg_dump`, `mongodump`) y/o backups en bloque (`pg_basebackup`, `xtrabackup`).
  - Hay que orquestar verificación de backups y pruebas de restauración.
  - Facilidad: baja‑media — depende de automatización y pruebas que implemente el equipo.

### Ejemplos rápidos (DIY)
- Postgres (dump lógico):

```bash
pg_dump -Fc -f /backups/db-$(date +%F).dump mydb
```

- Postgres (base backup con WAL):

```bash
pg_basebackup -h primary -D /backups/base -Ft -z -P -X stream
```

- MongoDB (dump):

```bash
mongodump --out /backups/mongo-$(date +%F)
```

- Snapshots de disco: crear snapshots consistente con flushing y bloquear I/O o usar filesystem/DB tools para garantizar consistencia.

## Escalado y rendimiento
- DBaaS: escalado vertical/horizontal simplificado (cambio de plan, añadir réplicas read‑only). Latencia de cambios baja; límites impuestos por el proveedor.
- DIY: control de la arquitectura (sharding, réplicas, caching), pero requiere ingeniería para implementar y operar escalado y pruebas de carga.

## Seguridad y cumplimiento
- DBaaS: suele ofrecer cifrado en tránsito/repósito, gestión de parches y certificaciones (depende del proveedor). Modelo de responsabilidad compartida: el proveedor gestiona infraestructura, tú la configuración y accesos.
- DIY: control completo, pero debes implementar cifrado, auditoría, rotación de claves y cumplir normativas por cuenta propia.

## Alta disponibilidad y recuperación ante desastres
- DBaaS: opciones multi‑zona/regional y SLAs; recuperación orquestada por el proveedor.
- DIY: requiere configurar réplicas, failover automatizado, backups offsite y probar procedimientos de DR.

## Observabilidad y soporte
- DBaaS: dashboards, métricas y soporte comercial (según plan). Menos trabajo en instrumentación básica.
- DIY: necesitas desplegar y mantener stack de observabilidad, alertas y soporte interno.

## Coste vs Control — decisiones habituales
- Elige DBaaS si:
  - Quieres reducir la carga operativa y acelerar time‑to‑market.
  - Tu equipo no tiene DBAs/SREs dedicados.
  - Aceptas pagar prima por conveniencia y soporte.
- Elige DIY si:
  - Necesitas control fino sobre la infraestructura, optimizaciones de rendimiento o configuraciones no soportadas por DBaaS.
  - Tienes equipos y procesos para operar bases de datos a nivel de producción.
  - Buscas potencial ahorro a gran escala y puedes invertir en automatización.

## Recomendaciones prácticas
- Siempre: definir RTO/RPO (objetivos de recuperación y pérdida de datos) antes de elegir.
- Si eliges DIY: documentar y automatizar backups, cifrado, patching y pruebas regulares de restore.
- Si eliges DBaaS: entender límites del SLA, costes por I/O/egress y procesos de exportación/restore fuera del proveedor.

---

_Fin del documento._
