import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CROP_TYPES, ANIMAL_TYPES, xpForLevel } from '@/lib/gameData';

export const dynamic = 'force-dynamic';

async function getWeather() {
  const rows = await sql`SELECT key, value FROM app_config WHERE key IN ('weather_current','weather_updated_at')`;
  let weather = 'sunny';
  let updatedAt = new Date(0);
  for (const r of rows) {
    if (r.key === 'weather_current') weather = r.value;
    if (r.key === 'weather_updated_at') updatedAt = new Date(r.value);
  }
  // Cambia solo cada 24h reales
  if (Date.now() - updatedAt.getTime() > 24 * 3600 * 1000) {
    const options = ['sunny', 'cloudy', 'rainy'];
    weather = options[Math.floor(Math.random() * options.length)];
    await sql`UPDATE app_config SET value = ${weather} WHERE key = 'weather_current'`;
    await sql`UPDATE app_config SET value = NOW()::text WHERE key = 'weather_updated_at'`;
  }
  return weather;
}

async function fullState(userId: number) {
  const weather = await getWeather();
  const stateRows = await sql`SELECT coins, level, xp, last_tree_chop FROM game_state WHERE user_id = ${userId}`;
  if (stateRows.length === 0) {
    await sql`INSERT INTO game_state (user_id) VALUES (${userId}) ON CONFLICT (user_id) DO NOTHING`;
  }
  const state = stateRows[0] || { coins: 50, level: 1, xp: 0, last_tree_chop: null };
  const crops = await sql`
    SELECT id, type, planted_at, ready_at, grid_x, grid_y, (ready_at <= NOW()) AS ready
    FROM crops WHERE user_id = ${userId} AND harvested = FALSE ORDER BY id`;
  // Hambre baja 10 por hora real
  const animals = await sql`
    SELECT id, type, name,
      GREATEST(0, hunger - FLOOR(EXTRACT(EPOCH FROM (NOW() - last_fed)) / 3600) * 10)::int AS hunger,
      (NOW() - last_collected > INTERVAL '6 hours') AS produce_ready
    FROM animals WHERE user_id = ${userId} ORDER BY id`;
  await sql`UPDATE game_state SET last_seen = NOW() WHERE user_id = ${userId}`;
  return { ...state, weather, crops, animals };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('user_id'));
  if (!userId) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });
  return NextResponse.json(await fullState(userId));
}

// Acciones: plant, harvest, feed, collect, chop, mill, rest
export async function POST(req: Request) {
  const body = await req.json();
  const userId = Number(body.user_id);
  const action = body.action as string;
  if (!userId || !action) return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });

  const valid = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = TRUE`;
  if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });

  const stateRows = await sql`SELECT coins, level, xp, last_tree_chop FROM game_state WHERE user_id = ${userId}`;
  const state = stateRows[0];
  if (!state) return NextResponse.json({ error: 'Sin estado de juego' }, { status: 400 });

  let msg = '';

  if (action === 'plant') {
    const crop = CROP_TYPES[body.crop_type];
    if (!crop) return NextResponse.json({ error: 'Cultivo invalido' }, { status: 400 });
    if (state.coins < crop.seedCost) return NextResponse.json({ error: 'Monedas insuficientes' }, { status: 400 });
    const gx = Number(body.grid_x ?? 0), gy = Number(body.grid_y ?? 0);
    const occupied = await sql`SELECT id FROM crops WHERE user_id = ${userId} AND harvested = FALSE AND grid_x = ${gx} AND grid_y = ${gy}`;
    if (occupied.length > 0) return NextResponse.json({ error: 'Parcela ocupada' }, { status: 400 });
    // La lluvia acelera 25%
    const weather = await getWeather();
    const hours = weather === 'rainy' ? crop.hours * 0.75 : crop.hours;
    await sql`INSERT INTO crops (user_id, type, ready_at, grid_x, grid_y)
      VALUES (${userId}, ${body.crop_type}, NOW() + (${hours} || ' hours')::interval, ${gx}, ${gy})`;
    await sql`UPDATE game_state SET coins = coins - ${crop.seedCost} WHERE user_id = ${userId}`;
    msg = `${crop.emoji} ${crop.label} plantada`;
  } else if (action === 'harvest') {
    const rows = await sql`
      UPDATE crops SET harvested = TRUE
      WHERE id = ${Number(body.crop_id)} AND user_id = ${userId} AND harvested = FALSE AND ready_at <= NOW()
      RETURNING type`;
    if (rows.length === 0) return NextResponse.json({ error: 'Aun no esta lista' }, { status: 400 });
    const crop = CROP_TYPES[rows[0].type];
    await addReward(userId, crop.sellPrice, crop.xp, state);
    msg = `+${crop.sellPrice} 🪙 por ${crop.label}`;
  } else if (action === 'feed') {
    const animal = await getAnimal(userId, Number(body.animal_id));
    if (!animal) return NextResponse.json({ error: 'Animal no encontrado' }, { status: 400 });
    const def = ANIMAL_TYPES[animal.type];
    if (state.coins < def.feedCost) return NextResponse.json({ error: 'Monedas insuficientes' }, { status: 400 });
    await sql`UPDATE animals SET hunger = 100, last_fed = NOW() WHERE id = ${animal.id}`;
    await sql`UPDATE game_state SET coins = coins - ${def.feedCost} WHERE user_id = ${userId}`;
    msg = `${def.emoji} ${animal.name} alimentado`;
  } else if (action === 'collect') {
    const animal = await getAnimal(userId, Number(body.animal_id));
    if (!animal) return NextResponse.json({ error: 'Animal no encontrado' }, { status: 400 });
    const def = ANIMAL_TYPES[animal.type];
    const check = await sql`
      SELECT (NOW() - last_collected > INTERVAL '6 hours') AS ready,
        GREATEST(0, hunger - FLOOR(EXTRACT(EPOCH FROM (NOW() - last_fed)) / 3600) * 10)::int AS hunger
      FROM animals WHERE id = ${animal.id}`;
    if (!check[0].ready) return NextResponse.json({ error: 'Aun no hay produccion' }, { status: 400 });
    if (check[0].hunger < 20) return NextResponse.json({ error: 'Tiene mucha hambre, alimentalo primero' }, { status: 400 });
    await sql`UPDATE animals SET last_collected = NOW() WHERE id = ${animal.id}`;
    await addReward(userId, def.sellPrice, def.xp, state);
    msg = `${def.produce} +${def.sellPrice} 🪙 (${def.produceLabel})`;
  } else if (action === 'chop') {
    const can = await sql`SELECT (last_tree_chop IS NULL OR NOW() - last_tree_chop > INTERVAL '4 hours') AS ok
      FROM game_state WHERE user_id = ${userId}`;
    if (!can[0].ok) return NextResponse.json({ error: 'El arbol necesita descansar (4h)' }, { status: 400 });
    await sql`UPDATE game_state SET last_tree_chop = NOW() WHERE user_id = ${userId}`;
    await addReward(userId, 5, 3, state);
    msg = '🪵 +5 🪙 de madera';
  } else if (action === 'mill') {
    if (state.coins < 10) return NextResponse.json({ error: 'Necesitas 10 monedas de trigo' }, { status: 400 });
    await sql`UPDATE game_state SET coins = coins - 10 WHERE user_id = ${userId}`;
    await addReward(userId, 18, 6, { ...state, coins: state.coins - 10 });
    msg = '🏭 Trigo molido: +8 🪙 netos';
  } else if (action === 'rest') {
    await addReward(userId, 0, 2, state);
    msg = '😴 Descansaste (+2 XP)';
  } else if (action === 'xp') {
    await addReward(userId, 0, 1, state);
    msg = '+1 XP';
  } else {
    return NextResponse.json({ error: 'Accion desconocida' }, { status: 400 });
  }

  const newState = await fullState(userId);
  return NextResponse.json({ ok: true, message: msg, state: newState });
}

async function getAnimal(userId: number, animalId: number) {
  const rows = await sql`SELECT id, type, name FROM animals WHERE id = ${animalId} AND user_id = ${userId}`;
  return rows[0] || null;
}

async function addReward(userId: number, coins: number, xp: number, state: any) {
  let newXp = Number(state.xp) + xp;
  let level = Number(state.level);
  while (newXp >= xpForLevel(level)) {
    newXp -= xpForLevel(level);
    level++;
  }
  await sql`UPDATE game_state SET coins = coins + ${coins}, xp = ${newXp}, level = ${level} WHERE user_id = ${userId}`;
}
