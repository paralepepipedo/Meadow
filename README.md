# Meadow 🌾

Juego de granja 2D para movil (PWA) construido con Next.js 14.

## Stack

- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Neon PostgreSQL (`@neondatabase/serverless`)
- Cloudinary (multimedia)
- Server-Sent Events (tiempo real)
- Web Push (notificaciones)
- PWA instalable en Android

## Setup paso a paso

### 1. Clonar e instalar

```bash
git clone <tu-repo>
cd meadow
npm install
```

### 2. Configurar variables de entorno

```bash
copy .env.local.example .env.local
```

Completar cada variable en `.env.local`:

| Variable | De donde sacarla |
|---|---|
| `DATABASE_URL` | Neon → tu proyecto → Connection string (con `sslmode=require`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary → Settings → Access Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary → Settings → Access Keys |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Los eliges tu (acceso a `/admin`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Generar con `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | `mailto:tu@correo.com` |
| `NEXT_PUBLIC_GIPHY_API_KEY` | (Opcional) developers.giphy.com — si queda vacia, la pestana GIF se oculta |
| `NEXT_PUBLIC_APP_URL` | URL publica de la app |

### 3. Crear las tablas en Neon

Abrir el **SQL Editor** de tu proyecto en Neon, pegar el contenido completo de `lib/schema.sql` y ejecutar. Crea las tablas, 4 usuarios iniciales, animales y la configuracion base.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir http://localhost:3000

### 5. Deploy en Vercel

1. Subir el proyecto a un repositorio de GitHub
2. En Vercel: **Add New → Project** → importar el repo
3. En **Environment Variables**, agregar todas las variables de `.env.local`
4. Deploy

## Rutas

| Ruta | Descripcion |
|---|---|
| `/` | Seleccion de jugador |
| `/game` | Juego de granja |
| `/admin` | Panel de administracion (usuario y clave de `.env`) |

## Panel admin

- **Usuarios**: crear, editar emoji/color, bloquear, activar/desactivar notificaciones
- **Mensajes**: ver, filtrar por fecha, borrar, ocultar hasta una fecha, limpiar todo, retencion
- **Gatillo**: objeto activo y cantidad de toques (2-8 dentro de 4 segundos)
- **Config**: clima manual o aleatorio, dias de retencion de mensajes

## Notas tecnicas

- El tiempo real usa SSE: el servidor revisa Neon cada 2.5s mientras la conexion esta abierta y empuja solo los mensajes nuevos. Vercel corta la conexion (~25s) y `EventSource` reconecta solo, continuando desde el ultimo mensaje (`Last-Event-ID`).
- Las notificaciones push usan texto neutro de granja.
- Los uploads van server-side a Cloudinary (el API secret nunca llega al navegador). Limite 25MB.
- Los mensajes mas antiguos que la retencion configurada se marcan como borrados automaticamente.

## Instalar como app en Android

Abrir la URL en Chrome → menu ⋮ → **Agregar a pantalla principal**.
