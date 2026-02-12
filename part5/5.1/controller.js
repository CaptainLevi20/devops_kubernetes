const crypto = require('crypto');
const k8s = require('@kubernetes/client-node');

const GROUP = 'dummy.example.com';
const VERSION = 'v1alpha1';
const PLURAL = 'dummysites';
const KIND = 'DummySite';

const DEFAULT_NGINX_IMAGE = process.env.NGINX_IMAGE || 'nginx:1.27-alpine';
const WATCH_NAMESPACE = process.env.WATCH_NAMESPACE || 'default';

function isNotFound(error) {
  const statusCode = error?.response?.statusCode ?? error?.statusCode;
  return statusCode === 404;
}

function stableShortHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 8);
}

function k8sSafeName(base, suffix) {
  const safeBase = String(base).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
  const safeSuffix = String(suffix).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');

  const join = safeSuffix ? `${safeBase}-${safeSuffix}` : safeBase;
  if (join.length <= 63) return join;

  const hash = stableShortHash(join);
  const maxBaseLen = 63 - (safeSuffix ? safeSuffix.length + 1 : 0) - 1 - hash.length;
  const trimmedBase = safeBase.slice(0, Math.max(1, maxBaseLen)).replace(/-+$/g, '');
  const rebuilt = safeSuffix ? `${trimmedBase}-${safeSuffix}-${hash}` : `${trimmedBase}-${hash}`;
  return rebuilt.slice(0, 63).replace(/-+$/g, '');
}

function injectBaseTagIfPossible(html, websiteUrl) {
  if (!html || typeof html !== 'string') return html;
  if (!websiteUrl || typeof websiteUrl !== 'string') return html;
  if (/<base\s+/i.test(html)) return html;

  const baseTag = `<base href="${websiteUrl}">`;
  const headOpen = html.match(/<head[^>]*>/i);
  if (!headOpen) return html;
  const index = headOpen.index + headOpen[0].length;
  return `${html.slice(0, index)}\n  ${baseTag}\n${html.slice(index)}`;
}

async function fetchHtml(websiteUrl) {
  const response = await fetch(websiteUrl, {
    redirect: 'follow',
    headers: {
      'user-agent': 'dummy-site-controller/1.0'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${websiteUrl}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return injectBaseTagIfPossible(text, websiteUrl);
}

async function replaceOrCreate({ read, replace, create }, namespace, name, body) {
  try {
    const existing = await read(name, namespace);
    body.metadata = body.metadata || {};
    body.metadata.resourceVersion = existing.body.metadata.resourceVersion;

    if (body.kind === 'Service') {
      body.spec = body.spec || {};
      const existingSpec = existing.body.spec || {};
      if (existingSpec.clusterIP && !body.spec.clusterIP) body.spec.clusterIP = existingSpec.clusterIP;
      if (existingSpec.clusterIPs && !body.spec.clusterIPs) body.spec.clusterIPs = existingSpec.clusterIPs;
      if (existingSpec.ipFamilies && !body.spec.ipFamilies) body.spec.ipFamilies = existingSpec.ipFamilies;
      if (existingSpec.ipFamilyPolicy && !body.spec.ipFamilyPolicy) body.spec.ipFamilyPolicy = existingSpec.ipFamilyPolicy;
    }

    await replace(name, namespace, body);
    return;
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  await create(namespace, body);
}

function ownerRefFor(dummySite) {
  return [
    {
      apiVersion: `${GROUP}/${VERSION}`,
      kind: KIND,
      name: dummySite.metadata.name,
      uid: dummySite.metadata.uid,
      controller: true,
      blockOwnerDeletion: true
    }
  ];
}

function buildResources(dummySite, html, websiteUrl) {
  const name = dummySite.metadata.name;
  const labels = {
    app: 'dummy-site',
    'dummy.example.com/name': name
  };

  const htmlSha = crypto.createHash('sha256').update(html).digest('hex');

  const configMapName = k8sSafeName(name, 'html');
  const deploymentName = k8sSafeName(name, 'site');
  const serviceName = k8sSafeName(name, 'svc');

  const ownerReferences = ownerRefFor(dummySite);

  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: configMapName,
      labels,
      ownerReferences
    },
    data: {
      'index.html': html,
      'source-url.txt': websiteUrl
    }
  };

  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: deploymentName,
      labels,
      ownerReferences
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: labels
      },
      template: {
        metadata: {
          labels,
          annotations: {
            'dummy.example.com/html-sha256': htmlSha
          }
        },
        spec: {
          containers: [
            {
              name: 'nginx',
              image: DEFAULT_NGINX_IMAGE,
              ports: [{ containerPort: 80 }],
              volumeMounts: [
                {
                  name: 'html',
                  mountPath: '/usr/share/nginx/html',
                  readOnly: true
                }
              ]
            }
          ],
          volumes: [
            {
              name: 'html',
              configMap: {
                name: configMapName,
                items: [{ key: 'index.html', path: 'index.html' }]
              }
            }
          ]
        }
      }
    }
  };

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: serviceName,
      labels,
      ownerReferences
    },
    spec: {
      type: 'ClusterIP',
      selector: labels,
      ports: [
        {
          name: 'http',
          port: 80,
          targetPort: 80
        }
      ]
    }
  };

  return { configMap, deployment, service };
}

async function reconcile(dummySite, { coreV1, appsV1 }) {
  const namespace = dummySite.metadata.namespace;
  const websiteUrl = dummySite?.spec?.website_url;

  if (typeof websiteUrl !== 'string' || websiteUrl.trim().length === 0) {
    console.warn(`[reconcile] ${namespace}/${dummySite.metadata.name}: missing spec.website_url`);
    return;
  }

  const html = await fetchHtml(websiteUrl);
  const { configMap, deployment, service } = buildResources(dummySite, html, websiteUrl);

  await replaceOrCreate(
    {
      read: coreV1.readNamespacedConfigMap.bind(coreV1),
      replace: coreV1.replaceNamespacedConfigMap.bind(coreV1),
      create: coreV1.createNamespacedConfigMap.bind(coreV1)
    },
    namespace,
    configMap.metadata.name,
    configMap
  );

  await replaceOrCreate(
    {
      read: appsV1.readNamespacedDeployment.bind(appsV1),
      replace: appsV1.replaceNamespacedDeployment.bind(appsV1),
      create: appsV1.createNamespacedDeployment.bind(appsV1)
    },
    namespace,
    deployment.metadata.name,
    deployment
  );

  await replaceOrCreate(
    {
      read: coreV1.readNamespacedService.bind(coreV1),
      replace: coreV1.replaceNamespacedService.bind(coreV1),
      create: coreV1.createNamespacedService.bind(coreV1)
    },
    namespace,
    service.metadata.name,
    service
  );

  console.log(`[reconcile] OK ${namespace}/${dummySite.metadata.name} -> svc/${service.metadata.name}`);
}

async function listExisting(customObjectsApi) {
  const response = await customObjectsApi.listNamespacedCustomObject(
    GROUP,
    VERSION,
    WATCH_NAMESPACE,
    PLURAL
  );
  return response.body.items || [];
}

async function start() {
  const kc = new k8s.KubeConfig();
  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }

  const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
  const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
  const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);
  const watch = new k8s.Watch(kc);

  console.log(`dummy-site-controller starting: namespace=${WATCH_NAMESPACE} nginxImage=${DEFAULT_NGINX_IMAGE}`);

  const existing = await listExisting(customObjectsApi);
  for (const item of existing) {
    try {
      await reconcile(item, { coreV1, appsV1 });
    } catch (error) {
      console.error(`[startup reconcile] failed for ${item.metadata?.namespace}/${item.metadata?.name}:`, error);
    }
  }

  let backoffMs = 1000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const path = `/apis/${GROUP}/${VERSION}/namespaces/${WATCH_NAMESPACE}/${PLURAL}`;
        watch.watch(
          path,
          { allowWatchBookmarks: true },
          async (type, obj) => {
            if (!obj?.metadata?.name) return;
            if (type === 'ADDED' || type === 'MODIFIED') {
              try {
                await reconcile(obj, { coreV1, appsV1 });
              } catch (error) {
                console.error(`[watch reconcile] failed for ${obj.metadata.namespace}/${obj.metadata.name}:`, error);
              }
            }
          },
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      backoffMs = 1000;
    } catch (error) {
      console.error(`[watch] error (retrying in ${backoffMs}ms):`, error?.message || error);
      await new Promise((r) => setTimeout(r, backoffMs));
      backoffMs = Math.min(30_000, Math.floor(backoffMs * 1.5));
    }
  }
}

start().catch((error) => {
  console.error('fatal error:', error);
  process.exit(1);
});
