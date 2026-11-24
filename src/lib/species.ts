// Datos de cada ave que reconoce el modelo y lo que significa para el pescador.
// Los textos vienen de la app web original (src/lib/classifier.ts y src/lib/audio-player.ts).

export type SpeciesLabel = 'Piquero' | 'Pelicano' | 'Gaviota' | 'Ruido_Fondo';
export type Urgency = 'alta' | 'media' | 'baja' | 'ninguna';
export type SampleId = 'piquero' | 'pelicano' | 'gaviota' | 'ruido_mar';

export interface SpeciesMeta {
  species: SpeciesLabel;
  commonName: string;
  scientificName: string;
  fishIndication: string;
  advice: string;
  urgency: Urgency;
  icon: 'lightning-bolt' | 'fish' | 'bird' | 'waves';
  color: string;
}

export interface ClassificationResult {
  label: string;
  value: number;
}

export interface ClassificationOutput extends SpeciesMeta {
  confidence: number;
  results: ClassificationResult[];
  executionTimeMs: number;
}

export const SPECIES: Record<SpeciesLabel, SpeciesMeta> = {
  Piquero: {
    species: 'Piquero',
    commonName: 'Piquero Peruano',
    scientificName: 'Sula variegata',
    fishIndication: '¡Cardumen denso de Anchoveta y Pejerrey en superficie!',
    advice: 'Piqueros lanzándose en picada vertical. Echar red de cerco o cortina a 2 brazas de inmediato.',
    urgency: 'alta',
    icon: 'lightning-bolt',
    color: '#10B981',
  },
  Pelicano: {
    species: 'Pelicano',
    commonName: 'Pelícano Peruano',
    scientificName: 'Pelecanus thagus',
    fishIndication: 'Peces mayores de costa: Corvina, Machete y Lisa.',
    advice: 'Pelícanos acuatizando cerca a los peñeros. Probar con espinel o pinta manual manteniendo distancia del oleaje.',
    urgency: 'media',
    icon: 'fish',
    color: '#F59E0B',
  },
  Gaviota: {
    species: 'Gaviota',
    commonName: 'Gaviota Peruana',
    scientificName: 'Larus belcheri',
    fishIndication: 'Peces carnada dispersos y Lorna en movimiento superficial.',
    advice: 'Bandada comiendo en superficie. Buen momento para curricán o anzuelo número 5.',
    urgency: 'media',
    icon: 'bird',
    color: '#06B6D4',
  },
  Ruido_Fondo: {
    species: 'Ruido_Fondo',
    commonName: 'Ruido de Fondo (Mar y Motor)',
    scientificName: 'Acústica Marina Ambiental',
    fishIndication: 'Sin cardumen evidente en la zona de escucha.',
    advice: 'Mar tranquilo o ruido del motor de la chalana. Avanzar 500 metros hacia el Morro Solar.',
    urgency: 'ninguna',
    icon: 'waves',
    color: '#64748B',
  },
};

export function metaFor(label: string): SpeciesMeta {
  return SPECIES[label as SpeciesLabel] ?? SPECIES.Ruido_Fondo;
}

// Convierte la respuesta cruda del modelo en el resultado que muestra la app.
export function buildClassification(results: ClassificationResult[], executionTimeMs: number): ClassificationOutput {
  const sorted = [...results].sort((a, b) => b.value - a.value);
  const top = sorted[0] ?? { label: 'Ruido_Fondo', value: 1 };
  return {
    ...metaFor(top.label),
    confidence: Number(top.value.toFixed(4)),
    results: sorted.map((r) => ({ label: r.label, value: Number(r.value.toFixed(4)) })),
    executionTimeMs,
  };
}

export interface BirdSample {
  id: SampleId;
  label: SpeciesLabel;
  name: string;
  tagline: string;
  fishTarget: string;
  sound: number;
}

export const BIRD_SAMPLES: BirdSample[] = [
  {
    id: 'piquero',
    label: 'Piquero',
    name: 'Piquero Peruano',
    tagline: 'Picada vertical = Cardumen de Anchoveta',
    fishTarget: 'Anchoveta / Pejerrey',
    sound: require('../../assets/audio/piquero.wav'),
  },
  {
    id: 'pelicano',
    label: 'Pelicano',
    name: 'Pelícano Peruano',
    tagline: 'Vuelo costero = Corvina y Machete',
    fishTarget: 'Corvina / Lisa',
    sound: require('../../assets/audio/pelicano.wav'),
  },
  {
    id: 'gaviota',
    label: 'Gaviota',
    name: 'Gaviota Peruana',
    tagline: 'Graznido superficial = Lorna y Pez carnada',
    fishTarget: 'Lorna / Pez carnada',
    sound: require('../../assets/audio/gaviota.wav'),
  },
  {
    id: 'ruido_mar',
    label: 'Ruido_Fondo',
    name: 'Ruido Marino y Motor',
    tagline: 'Oleaje chorrillano y motor de chalana',
    fishTarget: 'Sin cardumen activo',
    sound: require('../../assets/audio/ruido_mar.wav'),
  },
];

// Umbrales de la app web: alertar desde 75 % y guardar en la bitácora desde 70 %.
export const ALERT_THRESHOLD = 0.75;
export const SAVE_THRESHOLD = 0.7;
