'use client';
import { WORLD_OBJECTS } from '@/lib/gameData';

// SVGs detallados para cada tipo de objeto del mapa
function TreeSVG({ pine = false }: { pine?: boolean }) {
  return pine ? (
    <svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="40" cy="88" rx="14" ry="4" fill="#2d1a0a" opacity="0.35" />
      <rect x="35" y="68" width="10" height="20" fill="#6b3e1e" />
      <polygon points="40,5 10,45 22,40 8,70 30,62 26,78 54,78 50,62 72,70 58,40 70,45" fill="#1a6b2e" />
      <polygon points="40,5 14,42 26,37 12,66 34,58 30,75 50,75 46,58 68,66 54,37 66,42" fill="#2d9e4a" />
      <polygon points="40,10 18,44 28,40 16,64 36,57 33,72 47,72 44,57 64,64 52,40 62,44" fill="#3dbf5a" opacity="0.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="45" cy="97" rx="18" ry="5" fill="#2d1a0a" opacity="0.3" />
      <rect x="39" y="65" width="12" height="32" fill="#7c4a1e" />
      <rect x="37" y="75" width="4" height="10" fill="#5c3210" transform="rotate(-30 37 75)" />
      <rect x="49" y="78" width="4" height="8" fill="#5c3210" transform="rotate(25 49 78)" />
      <circle cx="45" cy="42" r="32" fill="#1e6e2f" />
      <circle cx="30" cy="36" r="20" fill="#2a8f3e" />
      <circle cx="58" cy="38" r="22" fill="#2a8f3e" />
      <circle cx="45" cy="28" r="18" fill="#35b050" />
      <circle cx="28" cy="30" r="8" fill="#3ec45a" opacity="0.6" />
      <circle cx="60" cy="32" r="6" fill="#3ec45a" opacity="0.5" />
    </svg>
  );
}

function HouseSVG() {
  return (
    <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="55" cy="107" rx="30" ry="5" fill="#2d1a0a" opacity="0.25" />
      {/* Paredes */}
      <rect x="15" y="58" width="80" height="48" fill="#d4a96a" />
      <rect x="15" y="58" width="80" height="48" fill="url(#wall)" opacity="0.3" />
      {/* Techo */}
      <polygon points="8,62 55,18 102,62" fill="#b33a2a" />
      <polygon points="8,62 55,18 102,62" fill="#d44a35" opacity="0.5" />
      {/* Techo borde */}
      <polygon points="6,64 55,16 104,64 102,62 55,18 8,62" fill="#8a2218" />
      {/* Chimenea */}
      <rect x="68" y="22" width="12" height="22" fill="#8a6040" />
      <rect x="65" y="20" width="18" height="5" fill="#6a4020" />
      {/* Puerta */}
      <rect x="43" y="78" width="24" height="28" rx="2" fill="#7c4a1e" />
      <rect x="43" y="78" width="24" height="28" rx="2" fill="#5c3210" opacity="0.3" />
      <circle cx="63" cy="93" r="2.5" fill="#d4a030" />
      {/* Ventana izquierda */}
      <rect x="20" y="65" width="22" height="18" rx="2" fill="#aee4f5" />
      <rect x="20" y="65" width="22" height="18" rx="2" fill="#7bc8e8" opacity="0.4" />
      <line x1="31" y1="65" x2="31" y2="83" stroke="#7a9aaa" strokeWidth="1.5" />
      <line x1="20" y1="74" x2="42" y2="74" stroke="#7a9aaa" strokeWidth="1.5" />
      {/* Ventana derecha */}
      <rect x="68" y="65" width="22" height="18" rx="2" fill="#aee4f5" />
      <rect x="68" y="65" width="22" height="18" rx="2" fill="#7bc8e8" opacity="0.4" />
      <line x1="79" y1="65" x2="79" y2="83" stroke="#7a9aaa" strokeWidth="1.5" />
      <line x1="68" y1="74" x2="90" y2="74" stroke="#7a9aaa" strokeWidth="1.5" />
      {/* Escalon */}
      <rect x="40" y="104" width="30" height="6" rx="1" fill="#b8956a" />
    </svg>
  );
}

function WellSVG() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="40" cy="77" rx="20" ry="5" fill="#2d1a0a" opacity="0.25" />
      {/* Base */}
      <ellipse cx="40" cy="52" rx="22" ry="8" fill="#8a7060" />
      <rect x="18" y="32" width="44" height="20" fill="#9a8070" />
      <ellipse cx="40" cy="32" rx="22" ry="8" fill="#b09080" />
      {/* Agua */}
      <ellipse cx="40" cy="32" rx="18" ry="6" fill="#4a9fc4" />
      <ellipse cx="40" cy="32" rx="18" ry="6" fill="#6ab8d8" opacity="0.5" />
      {/* Postes */}
      <rect x="20" y="12" width="7" height="28" fill="#7c4a1e" rx="2" />
      <rect x="53" y="12" width="7" height="28" fill="#7c4a1e" rx="2" />
      {/* Techo */}
      <polygon points="12,22 40,6 68,22" fill="#b33a2a" />
      <polygon points="12,22 40,8 68,22 66,20 40,6 14,20" fill="#8a2218" />
      {/* Polea */}
      <rect x="36" y="14" width="8" height="3" fill="#5a3010" rx="1" />
      <line x1="40" y1="17" x2="40" y2="26" stroke="#5a3010" strokeWidth="1.5" />
    </svg>
  );
}

function MillSVG() {
  return (
    <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="50" cy="107" rx="28" ry="5" fill="#2d1a0a" opacity="0.25" />
      {/* Torre */}
      <rect x="28" y="40" width="44" height="67" fill="#c8b49a" />
      <rect x="28" y="40" width="44" height="10" fill="#b8a48a" />
      {/* Techo */}
      <polygon points="22,44 50,10 78,44" fill="#8a6040" />
      <polygon points="22,44 50,12 78,44 76,42 50,10 24,42" fill="#6a4020" />
      {/* Aspas */}
      <line x1="50" y1="28" x2="50" y2="2" stroke="#6a4020" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="28" x2="50" y2="54" stroke="#6a4020" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="28" x2="24" y2="28" stroke="#6a4020" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="28" x2="76" y2="28" stroke="#6a4020" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="28" r="5" fill="#4a2810" />
      {/* Puerta */}
      <rect x="40" y="84" width="20" height="23" rx="10" fill="#7c4a1e" />
      {/* Ventana */}
      <circle cx="50" cy="64" r="9" fill="#aee4f5" />
      <circle cx="50" cy="64" r="9" fill="#7bc8e8" opacity="0.4" />
      <line x1="41" y1="64" x2="59" y2="64" stroke="#7a9aaa" strokeWidth="1.5" />
      <line x1="50" y1="55" x2="50" y2="73" stroke="#7a9aaa" strokeWidth="1.5" />
    </svg>
  );
}

function CropZoneSVG() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Tierra arada */}
      <rect x="4" y="4" width="72" height="72" rx="4" fill="#8B6340" />
      {/* Surcos */}
      {[0,1,2,3].map(i => (
        <rect key={i} x="4" y={12 + i * 16} width="72" height="8" fill="#7a5530" opacity="0.6" rx="1" />
      ))}
      {/* Plantas */}
      {[0,1,2].map(col => [0,1,2,3].map(row => (
        <g key={`${col}-${row}`} transform={`translate(${14 + col * 26}, ${14 + row * 16})`}>
          <line x1="0" y1="6" x2="0" y2="0" stroke="#3a8a2a" strokeWidth="2" />
          <ellipse cx="-3" cy="2" rx="4" ry="2.5" fill="#4aaa35" transform="rotate(-30)" />
          <ellipse cx="3" cy="2" rx="4" ry="2.5" fill="#4aaa35" transform="rotate(30)" />
        </g>
      )))}
    </svg>
  );
}

function PondSVG() {
  return (
    <svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="35" cy="40" rx="30" ry="18" fill="#2d7a9a" />
      <ellipse cx="35" cy="40" rx="30" ry="18" fill="#4a9fc4" opacity="0.6" />
      <ellipse cx="28" cy="36" rx="10" ry="5" fill="#6ab8d8" opacity="0.5" />
      {/* Nenufar */}
      <ellipse cx="42" cy="44" rx="7" ry="4" fill="#2a8a3a" />
      <circle cx="42" cy="42" r="3" fill="#e84a7a" />
      {/* Juncos */}
      <line x1="10" y1="42" x2="10" y2="28" stroke="#5a8a3a" strokeWidth="2" />
      <ellipse cx="10" cy="27" rx="3" ry="6" fill="#6a5a20" />
      <line x1="16" y1="44" x2="14" y2="30" stroke="#5a8a3a" strokeWidth="2" />
      <ellipse cx="14" cy="29" rx="2.5" ry="5" fill="#6a5a20" />
      {/* Piedras borde */}
      <ellipse cx="8" cy="50" rx="5" ry="3" fill="#8a8a7a" />
      <ellipse cx="60" cy="48" rx="4" ry="2.5" fill="#8a8a7a" />
      <ellipse cx="35" cy="56" rx="6" ry="3" fill="#9a9a8a" />
    </svg>
  );
}

function RockSVG() {
  return (
    <svg viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="30" cy="47" rx="22" ry="5" fill="#2d1a0a" opacity="0.2" />
      <ellipse cx="30" cy="32" rx="26" ry="18" fill="#8a8a7a" />
      <ellipse cx="22" cy="24" rx="16" ry="12" fill="#aaaaaa" />
      <ellipse cx="38" cy="28" rx="12" ry="10" fill="#999988" />
      <ellipse cx="18" cy="22" rx="8" ry="5" fill="#bbbbbb" opacity="0.5" />
    </svg>
  );
}

function SunflowerSVG() {
  return (
    <svg viewBox="0 0 55 70" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <line x1="27" y1="65" x2="27" y2="30" stroke="#4a8a2a" strokeWidth="4" strokeLinecap="round" />
      <line x1="27" y1="52" x2="14" y2="42" stroke="#4a8a2a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="27" y1="48" x2="40" y2="38" stroke="#4a8a2a" strokeWidth="2.5" strokeLinecap="round" />
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <ellipse key={i} cx="27" cy="18" rx="5" ry="9" fill="#f5c518"
          transform={`rotate(${angle} 27 28)`} opacity="0.9" />
      ))}
      <circle cx="27" cy="28" r="9" fill="#7a4010" />
      <circle cx="27" cy="28" r="7" fill="#8a5010" />
      {[0,60,120,180,240,300].map((a, i) => (
        <circle key={i} cx={27 + 4 * Math.cos(a * Math.PI / 180)}
          cy={28 + 4 * Math.sin(a * Math.PI / 180)} r="1.5" fill="#5a3008" />
      ))}
    </svg>
  );
}

function MailboxSVG() {
  return (
    <svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="18" y="42" width="6" height="16" fill="#6a4020" rx="1" />
      <rect x="10" y="24" width="30" height="20" rx="3" fill="#c03030" />
      <rect x="10" y="24" width="30" height="10" rx="3" fill="#d84040" />
      <rect x="10" y="24" width="15" height="20" rx="2" fill="#c83838" opacity="0.3" />
      <rect x="22" y="28" width="6" height="8" rx="1" fill="#b02020" />
      <rect x="8" y="36" width="4" height="6" rx="1" fill="#e8e0b0" />
      <circle cx="38" cy="34" r="2" fill="#d4a030" />
    </svg>
  );
}

function AnimalPenSVG() {
  return (
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {/* Corral de madera */}
      <rect x="2" y="10" width="116" height="65" rx="4" fill="none" stroke="#8B6040" strokeWidth="4" strokeDasharray="8,4" opacity="0.7" />
      <rect x="2" y="25" width="116" height="2" fill="#8B6040" opacity="0.4" />
      <rect x="2" y="50" width="116" height="2" fill="#8B6040" opacity="0.4" />
    </svg>
  );
}

const SVG_MAP: Record<string, React.ReactNode> = {
  house:       <HouseSVG />,
  tree:        <TreeSVG />,
  tree2:       <TreeSVG />,
  tree3:       <TreeSVG pine />,
  well:        <WellSVG />,
  mill:        <MillSVG />,
  cropzone:    <CropZoneSVG />,
  pond:        <PondSVG />,
  rock:        <RockSVG />,
  sunflower:   <SunflowerSVG />,
  sunflower2:  <SunflowerSVG />,
  mailbox_ext: <MailboxSVG />,
  cow:         null,
  chicken:     null,
  sheep:       null,
};

export default function MapObjects({ onObjectClick }: { onObjectClick: (id: string) => void }) {
  return (
    <>
      {WORLD_OBJECTS.map((obj) => {
        const svgContent = SVG_MAP[obj.id];
        return (
          <button
            key={obj.id}
            onClick={(e) => { e.stopPropagation(); onObjectClick(obj.id); }}
            className="world-obj absolute z-10 flex items-center justify-center"
            style={{
              left: obj.x - obj.size / 2,
              top: obj.y - obj.size / 2,
              width: obj.size,
              height: obj.size,
              fontSize: obj.size * 0.65,
              lineHeight: 1,
              background: 'transparent',
              border: 'none',
            }}
            aria-label={obj.label}
          >
            {svgContent !== null ? svgContent : obj.emoji}
          </button>
        );
      })}
    </>
  );
}
