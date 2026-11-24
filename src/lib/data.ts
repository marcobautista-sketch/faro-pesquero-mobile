// Datos de la app: perfil del pescador, zonas de pesca y bitácora de detecciones.
// Los valores iniciales son los mismos de la app web (src/lib/db.ts).
import type { LatLng } from './geo';
import type { SpeciesLabel } from './species';

export interface Preferences {
  highContrastMode: boolean;
  voiceAlerts: boolean;
  largeFont: boolean;
  vibrationFeedback: boolean;
  autoSaveDetections: boolean;
}

export interface UserProfile {
  name: string;
  nickname: string;
  role: string;
  boatName: string;
  registrationNumber: string;
  pier: string;
  cove: string;
  association: string;
  yearsOfExperience: number;
  phone: string;
  preferences: Preferences;
}

export type DetectionSource = 'live_mic' | 'demo_sample';

export interface DetectionRecord {
  id: string;
  timestamp: string;
  species: SpeciesLabel;
  commonName: string;
  scientificName: string;
  confidence: number;
  location: string;
  coordinates: LatLng;
  usedRealGps: boolean;
  advice: string;
  fishIndication: string;
  source: DetectionSource;
}

export interface FishingSpot {
  id: string;
  name: string;
  description: string;
  depthMeters: number;
  recommendedNet: string;
  commonSpecies: SpeciesLabel[];
  lat: number;
  lng: number;
  distanceFromPierKm: number;
}

export const DEFAULT_USER: UserProfile = {
  name: 'Don Jacinto Ramos Morales',
  nickname: 'El Cholo Jacinto',
  role: 'Patrón Pescador Artesanal',
  boatName: 'Flor del Mar III',
  registrationNumber: 'CO-12948-BM',
  pier: 'Muelle Artesanal de Chorrillos',
  cove: 'Caleta Chorrillos - Agua Dulce',
  association: 'Asociación de Pescadores Artesanales José Olaya Balandra',
  yearsOfExperience: 48,
  phone: '+51 984 512 830',
  preferences: {
    highContrastMode: false,
    voiceAlerts: true,
    largeFont: true,
    vibrationFeedback: true,
    autoSaveDetections: true,
  },
};

// Punto de partida cuando el celular todavía no tiene GPS: el muelle de Chorrillos.
export const PIER: LatLng = { lat: -12.1605, lng: -77.0312 };

export const FISHING_SPOTS: FishingSpot[] = [
  {
    id: 'morro-solar',
    name: 'Bajo del Morro Solar',
    description: 'Zona rocosa profunda con fuertes corrientes. Los piqueros se lanzan en picada vertical cuando sube la anchoveta.',
    depthMeters: 18,
    recommendedNet: 'Red de cerco / Cortina de 2 brazas',
    commonSpecies: ['Piquero', 'Pelicano'],
    lat: -12.1702,
    lng: -77.0345,
    distanceFromPierKm: 1.4,
  },
  {
    id: 'salto-fraile',
    name: 'El Salto del Fraile',
    description: 'Corriente rompiente ideal para corvina y lornas. Presencia continua de gaviotas y pelícanos sobre peñas.',
    depthMeters: 12,
    recommendedNet: 'Espinel de fondo / Pinta manual',
    commonSpecies: ['Gaviota', 'Pelicano'],
    lat: -12.1768,
    lng: -77.0382,
    distanceFromPierKm: 2.3,
  },
  {
    id: 'la-herradura',
    name: 'Bajo de La Herradura',
    description: 'Fondo mixto de piedra y arena. Gran afluencia de pejerrey y lorna cuando las bandadas de piqueros graznan alto.',
    depthMeters: 15,
    recommendedNet: 'Red agallera / Trasmallo',
    commonSpecies: ['Piquero', 'Gaviota'],
    lat: -12.1834,
    lng: -77.0421,
    distanceFromPierKm: 3.1,
  },
  {
    id: 'muelle-chorrillos',
    name: 'Frente al Muelle de Chorrillos',
    description: 'Zona de salida y caleta mansa. Pelícanos descansan en los peñeros esperando el descarte del día.',
    depthMeters: 6,
    recommendedNet: 'Pinta costera / Línea de mano',
    commonSpecies: ['Pelicano', 'Gaviota'],
    lat: -12.1605,
    lng: -77.0312,
    distanceFromPierKm: 0.2,
  },
];

// Bitácora de ejemplo para que la pantalla no arranque vacía.
export function seedDetections(now = Date.now()): DetectionRecord[] {
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  return [
    {
      id: 'det-001',
      timestamp: minutesAgo(35),
      species: 'Piquero',
      commonName: 'Piquero Peruano',
      scientificName: 'Sula variegata',
      confidence: 0.985,
      location: 'Bajo del Morro Solar',
      coordinates: { lat: -12.1702, lng: -77.0345 },
      usedRealGps: false,
      advice: '¡Cardumen en superficie! Echar red de cortina a 2 brazas de profundidad.',
      fishIndication: 'Anchoveta y Pejerrey en cardumen compacto',
      source: 'live_mic',
    },
    {
      id: 'det-002',
      timestamp: minutesAgo(95),
      species: 'Pelicano',
      commonName: 'Pelícano Peruano',
      scientificName: 'Pelecanus thagus',
      confidence: 0.942,
      location: 'El Salto del Fraile',
      coordinates: { lat: -12.1768, lng: -77.0382 },
      usedRealGps: false,
      advice: 'Peces cerca a las rocas. Mantener distancia segura del reventazón.',
      fishIndication: 'Corvina y Machete de orilla',
      source: 'live_mic',
    },
    {
      id: 'det-003',
      timestamp: minutesAgo(180),
      species: 'Gaviota',
      commonName: 'Gaviota Peruana',
      scientificName: 'Larus belcheri',
      confidence: 0.915,
      location: 'Bajo de La Herradura',
      coordinates: { lat: -12.1834, lng: -77.0421 },
      usedRealGps: false,
      advice: 'Peces carnada dispersos. Usar espinel o anzuelo número 5.',
      fishIndication: 'Lorna y Pejerrey superficial',
      source: 'demo_sample',
    },
  ];
}
