import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meadow',
  description: 'My little farm',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Meadow' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4a7c59',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}

        {/* Blackout de privacidad: tapa la app al instante al minimizar/cambiar de app,
            asi la miniatura de "apps recientes" de Android y el flash al volver
            nunca muestran el chat. Se controla con vanilla JS (no React) para
            ganarle la carrera a la captura de pantalla del sistema. */}
        <div
          id="meadow-blackout"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'none',
            background: '#4a7c59',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🌾
          </div>
          <p style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: 0, letterSpacing: 0.5 }}>Meadow</p>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var el = document.getElementById('meadow-blackout');
              if (!el) return;
              var pendingHide = null;
              function show(){
                if (pendingHide) { clearTimeout(pendingHide); pendingHide = null; }
                el.style.display = 'flex';
              }
              function hide(){
                el.style.display = 'none';
              }
              function onHidden(){ show(); }
              function onVisible(){
                // Esperar la señal de que React ya cerro el chat antes de descubrir la pantalla.
                // Si la señal nunca llega (no habia chat abierto), se quita por timeout corto.
                if (pendingHide) clearTimeout(pendingHide);
                pendingHide = setTimeout(hide, 700);
              }
              document.addEventListener('visibilitychange', function(){
                if (document.hidden) onHidden(); else onVisible();
              });
              window.addEventListener('pagehide', onHidden);
              window.addEventListener('meadow:chat-closed', function(){
                if (pendingHide) { clearTimeout(pendingHide); pendingHide = null; }
                hide();
              });
            })();`,
          }}
        />
      </body>
    </html>
  );
}