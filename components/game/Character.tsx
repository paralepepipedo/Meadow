'use client';

export default function Character({ x, y, walking, facing }: { x: number; y: number; walking: boolean; facing: 1 | -1 }) {
  return (
    <div
      className={`absolute z-20 ${walking ? 'walking' : 'idle'}`}
      style={{
        left: x - 30,
        top: y - 80,
        width: 60,
        height: 90,
        transform: `scaleX(${facing})`,
        pointerEvents: 'none',
      }}
    >
      <img
        src="/granjero.png"
        alt="granjero"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'auto',
        }}
      />
    </div>
  );
}
