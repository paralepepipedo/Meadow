'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAP_W, MAP_H, WORLD_OBJECTS } from '@/lib/gameData';
import Character from './Character';
import GameHUD from './GameHUD';
import MapObjects from './MapObjects';
import HouseInterior from './HouseInterior';
import CropPanel from './Crops';
import AnimalMenu from './Animals';
import ChatScreen from '@/components/chat/ChatScreen';
import { useTrigger } from '@/hooks/useTrigger';
import { useVisibility, useBackButton } from '@/hooks/useVisibility';
import { usePush } from '@/hooks/usePush';

type StoredUser = { id: number; display_name: string; emoji: string; color: string };
const SPEED = 120; // px por segundo

export default function GameMap() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [state, setState] = useState<any>(null);
  const [view, setView] = useState<'world' | 'interior'>('world');
  const [chatOpen, setChatOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [animalOpen, setAnimalOpen] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [viewport, setViewport] = useState({ w: 390, h: 700 });

  // Posicion del personaje (ref para el loop, state para render)
  const posRef = useRef({ x: 1200, y: 700 });
  const targetRef = useRef<{ x: number; y: number; objectId?: string } | null>(null);
  const [renderPos, setRenderPos] = useState({ x: 1200, y: 700 });
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);

  // ===== Carga de usuario y estado =====
  useEffect(() => {
    const saved = localStorage.getItem('meadow_user');
    if (!saved) {
      router.replace('/');
      return;
    }
    setUser(JSON.parse(saved));
  }, [router]);

  const refresh = useCallback(async (uid: number) => {
    try {
      const r = await fetch(`/api/game?user_id=${uid}`);
      const data = await r.json();
      setState(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) refresh(user.id);
  }, [user, refresh]);

  usePush(user?.id ?? null);

  // ===== Viewport =====
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ===== Loop de movimiento =====
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const target = targetRef.current;
      if (target) {
        const dx = target.x - posRef.current.x;
        const dy = target.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          posRef.current = { x: target.x, y: target.y };
          const objId = target.objectId;
          targetRef.current = null;
          setWalking(false);
          setRenderPos({ ...posRef.current });
          if (objId) arriveAt(objId);
        } else {
          const move = Math.min(dist, SPEED * dt);
          posRef.current = {
            x: posRef.current.x + (dx / dist) * move,
            y: posRef.current.y + (dy / dist) * move,
          };
          setRenderPos({ ...posRef.current });
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user]);

  // ===== Trigger secreto =====
  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const { registerClick } = useTrigger(openChat);

  // Proteccion: minimizar / apagar pantalla / cambiar app cierra el chat
  const { setPickingFile } = useVisibility(chatOpen, closeChat);
  useBackButton(chatOpen, closeChat);

  // ===== Acciones =====
  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(''), 2000);
  };

  const doAction = useCallback(
    async (action: string, extra: Record<string, any> = {}) => {
      if (!user) return;
      try {
        const r = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, action, ...extra }),
        });
        const data = await r.json();
        if (data.error) flash(`⚠️ ${data.error}`);
        else {
          if (data.message) flash(data.message);
          setState(data.state);
        }
      } catch {
        flash('⚠️ Sin conexion');
      }
    },
    [user]
  );

  const arriveAt = (objectId: string) => {
    // Gatillo silencioso tambien en objetos exteriores
    registerClick(objectId);

    if (objectId.startsWith('tree')) doAction('chop');
    else if (objectId === 'well') flash('💧 Riegas los cultivos cercanos');
    else if (objectId === 'mill') doAction('mill');
    else if (objectId === 'cropzone') setCropOpen(true);
    else if (objectId === 'cow' || objectId === 'chicken' || objectId === 'sheep') setAnimalOpen(objectId);
    else if (objectId === 'house') setView('interior');
    else if (objectId.startsWith('sunflower')) doAction('xp');
    else if (objectId === 'mailbox_ext') flash('📮 No hay cartas nuevas');
    else if (objectId === 'rock') flash('🪨 Una roca firme');
    else if (objectId === 'pond') flash('🪷 El agua esta tranquila');
  };

  const moveTo = (x: number, y: number, objectId?: string) => {
    const cx = Math.max(30, Math.min(MAP_W - 30, x));
    const cy = Math.max(60, Math.min(MAP_H - 20, y));
    setFacing(cx >= posRef.current.x ? 1 : -1);
    targetRef.current = { x: cx, y: cy, objectId };
    setWalking(true);
  };

  const handleObjectClick = (id: string) => {
    const obj = WORLD_OBJECTS.find((o) => o.id === id);
    if (!obj) return;
    // Si ya esta al lado, ejecuta directo (permite clicks rapidos del gatillo)
    const dist = Math.hypot(obj.x - posRef.current.x, obj.y - posRef.current.y);
    if (dist < obj.size / 2 + 50) arriveAt(id);
    else moveTo(obj.x, obj.y + obj.size / 2 + 20, id);
  };

  const handleGroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const worldX = e.clientX - rect.left;
    const worldY = e.clientY - rect.top;
    moveTo(worldX, worldY);
  };

  const changeUser = () => {
    localStorage.removeItem('meadow_user');
    router.replace('/');
  };

  if (!user) return null;

  // Camara centrada en el personaje, limitada a los bordes del mapa
  const camX = Math.max(0, Math.min(MAP_W - viewport.w, renderPos.x - viewport.w / 2));
  const camY = Math.max(0, Math.min(MAP_H - viewport.h, renderPos.y - viewport.h / 2));

  const weather = state?.weather || 'sunny';
  const animal = animalOpen && state?.animals?.find((a: any) => a.type === animalOpen);

  return (
    <main className="fixed inset-0 overflow-hidden">
      {/* Fondo fijo: imagen de granja cubre todo el viewport sin moverse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/granja.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: weather === 'rainy' ? 'brightness(0.75) saturate(0.8)' : weather === 'cloudy' ? 'brightness(0.88) saturate(0.9)' : 'none',
          zIndex: 0,
        }}
      />
      {/* ===== MUNDO ===== */}
      <div style={{ visibility: chatOpen ? 'hidden' : 'visible' }} className="absolute inset-0">
        <div
          className="absolute"
          onClick={handleGroundClick}
          style={{
            width: MAP_W,
            height: MAP_H,
            transform: `translate(${-camX}px, ${-camY}px)`,
            background: 'transparent',
          }}
        >

          <MapObjects onObjectClick={handleObjectClick} />
          <Character x={renderPos.x} y={renderPos.y} walking={walking} facing={facing} />
        </div>

        {/* Overlays de clima sobre el viewport */}
        {weather === 'rainy' && (
          <div className="absolute inset-0 pointer-events-none z-20" style={{ background: 'rgba(40,60,90,0.18)' }}>
            {Array.from({ length: 26 }).map((_, i) => (
              <div
                key={i}
                className="raindrop"
                style={{ left: `${(i * 137) % 100}%`, animationDuration: `${0.6 + (i % 5) * 0.15}s`, animationDelay: `${(i % 7) * 0.2}s` }}
              />
            ))}
          </div>
        )}
        {weather === 'cloudy' && (
          <div className="absolute inset-0 pointer-events-none z-20" style={{ background: 'rgba(120,130,140,0.15)' }}>
            <div className="cloud absolute top-8 text-6xl opacity-70" style={{ animationDuration: '60s' }}>☁️</div>
            <div className="cloud absolute top-20 text-5xl opacity-50" style={{ animationDuration: '85s', animationDelay: '-30s' }}>☁️</div>
          </div>
        )}

        {view !== 'interior' && <GameHUD
          coins={state?.coins ?? 0}
          level={state?.level ?? 1}
          xp={state?.xp ?? 0}
          weather={weather}
          userEmoji={user.emoji}
          onChangeUser={changeUser}
        />}

        {toast && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 bg-black/70 text-white font-pixel text-[9px] px-4 py-3 rounded-xl whitespace-nowrap reward-float" key={toast}>
            {toast}
          </div>
        )}

        {/* Interior de la casa */}
        {view === 'interior' && (
          <HouseInterior
            registerClick={registerClick}
            onExit={() => setView('world')}
            onAction={(a) => doAction(a)}
            stats={{ coins: state?.coins ?? 0, level: state?.level ?? 1, xp: state?.xp ?? 0 }}
          />
        )}

        {/* Panel del huerto */}
        {cropOpen && state && (
          <CropPanel
            crops={state.crops || []}
            coins={state.coins}
            onPlant={(type, gx, gy) => doAction('plant', { crop_type: type, grid_x: gx, grid_y: gy })}
            onHarvest={(id) => doAction('harvest', { crop_id: id })}
            onClose={() => setCropOpen(false)}
          />
        )}

        {/* Menu de animal */}
        {animal && (
          <AnimalMenu
            animal={animal}
            coins={state.coins}
            onFeed={() => { doAction('feed', { animal_id: animal.id }); setAnimalOpen(null); }}
            onCollect={() => { doAction('collect', { animal_id: animal.id }); setAnimalOpen(null); }}
            onClose={() => setAnimalOpen(null)}
          />
        )}
      </div>

      {/* ===== CHAT (overlay, el juego queda montado debajo) ===== */}
      {chatOpen && <ChatScreen user={user} onClose={closeChat} onPickingFile={setPickingFile} />}
    </main>
  );
}
