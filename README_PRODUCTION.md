Preparación y despliegue en Azure (contenedor)

Resumen
- Multi-stage Dockerfile construye la app Vite y empaqueta el servidor Node/Express.
- El servidor usa `pg.Pool` y mantiene alive la conexión con `SELECT 1` cada 5 minutos.
- Workflow de GitHub Actions (si está configurado) construye la imagen y la despliega a Azure App Service.

Requisitos locales
- Docker
- Azure CLI (si vas a crear recursos desde terminal)
- Cuenta de Azure y suscripción
- (Opcional) Azure Container Registry (ACR) o Docker Hub

Variables de entorno importantes
- DATABASE_URL (ej: postgres://user:pass@host:6543/db)
- NODE_ENV=production
- PORT (opcional, default 4000)
- CORS_ORIGIN (ej: https://<app>.azurewebsites.net)

Cómo probar localmente (producción)
1. Generar build del frontend:

```bash
npm install
npm run build
```

2. Construir imagen Docker:

```bash
docker build -t myregistry.azurecr.io/web-registro-datos:latest .
```

3. Ejecutar contenedor (pasa `DATABASE_URL` real):

```bash
docker run -e DATABASE_URL="postgres://user:pass@host:6543/db" -p 4000:4000 myregistry.azurecr.io/web-registro-datos:latest
```

4. Abrir `http://localhost:4000` (servidor sirve `dist` y API en `/api/*`)

Desplegar a Azure (resumen rápido usando ACR)

1. Login y crear recursos (cambia nombres):

```bash
az login
az group create -n myRg -l eastus
az acr create -n myRegistry --sku Basic -g myRg
az acr login --name myRegistry
```

2. Construir y push a ACR:

```bash
docker tag web-registro-datos:latest myregistry.azurecr.io/web-registro-datos:latest
docker push myregistry.azurecr.io/web-registro-datos:latest
```

3. Crear App Service con imagen del contenedor:

```bash
az appservice plan create -g myRg -n myPlan --is-linux --sku B1
az webapp create -g myRg -p myPlan -n myWebApp --deployment-container-image-name myregistry.azurecr.io/web-registro-datos:latest
# configurar acceso al ACR
az webapp config container set -g myRg -n myWebApp --docker-registry-server-url https://myregistry.azurecr.io --docker-registry-server-user <acr-user> --docker-registry-server-password <acr-password>
```

4. Configurar variables de entorno desde portal o CLI:

```bash
az webapp config appsettings set -g myRg -n myWebApp --settings DATABASE_URL="postgres://..." NODE_ENV=production CORS_ORIGIN="https://myWebApp.azurewebsites.net"
```

Notas
- El `Dockerfile` ya expone el puerto 4000 y el `CMD` arranca `node server/index.js`.
- El `server/index.js` hace un `SELECT 1` en startup y un keep-alive cada 5 minutos para mantener conexiones.
- Asegúrate de no subir credenciales sensibles al repositorio. Usa secretos en GitHub Actions o App Settings en Azure.

Si quieres, puedo:
- Añadir el README principal (`README.md`) con estos pasos.
- Generar comandos `az` exactos y un script `deploy-azure.sh`.
- Probar construir la imagen aquí y correrla (requiere Docker instalado en tu máquina).