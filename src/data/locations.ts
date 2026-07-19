export interface State { slug: string; name: string; cities: { slug: string; name: string; }[]; }
export interface Country { slug: string; name: string; region: string; }
export const STATES: State[] = [
  { slug: 'arizona', name: 'Arizona', cities: [
    { slug: 'phoenix', name: 'Phoenix' },
    { slug: 'scottsdale', name: 'Scottsdale' },
    { slug: 'tucson', name: 'Tucson' },
  ]},
  { slug: 'california', name: 'California', cities: [
    { slug: 'long-beach', name: 'Long Beach' },
    { slug: 'los-angeles', name: 'Los Ángeles' },
    { slug: 'oakland', name: 'Oakland' },
    { slug: 'orange-county', name: 'Condado de Orange' },
    { slug: 'sacramento', name: 'Sacramento' },
    { slug: 'san-francisco', name: 'San Francisco' },
    { slug: 'san-jose', name: 'San José' },
  ]},
  { slug: 'colorado', name: 'Colorado', cities: [
    { slug: 'colorado-springs', name: 'Colorado Springs' },
    { slug: 'denver', name: 'Denver' },
    { slug: 'fort-collins', name: 'Fort Collins' },
  ]},
  { slug: 'idaho', name: 'Idaho', cities: [
    { slug: 'boise', name: 'Boise' },
    { slug: 'meridian', name: 'Meridian' },
    { slug: 'nampa', name: 'Nampa' },
  ]},
  { slug: 'nevada', name: 'Nevada', cities: [
    { slug: 'henderson', name: 'Henderson' },
    { slug: 'las-vegas', name: 'Las Vegas' },
    { slug: 'reno', name: 'Reno' },
  ]},
  { slug: 'new-mexico', name: 'Nuevo México', cities: [
    { slug: 'albuquerque', name: 'Albuquerque' },
    { slug: 'las-cruces', name: 'Las Cruces' },
    { slug: 'santa-fe', name: 'Santa Fe' },
  ]},
  { slug: 'oregon', name: 'Oregón', cities: [
    { slug: 'bend', name: 'Bend' },
    { slug: 'eugene', name: 'Eugene' },
    { slug: 'gresham', name: 'Gresham' },
    { slug: 'hillsboro', name: 'Hillsboro' },
    { slug: 'medford', name: 'Medford' },
    { slug: 'portland', name: 'Portland' },
    { slug: 'salem', name: 'Salem' },
  ]},
  { slug: 'texas', name: 'Texas', cities: [
    { slug: 'austin', name: 'Austin' },
    { slug: 'dallas', name: 'Dallas' },
    { slug: 'houston', name: 'Houston' },
    { slug: 'san-antonio', name: 'San Antonio' },
  ]},
  { slug: 'utah', name: 'Utah', cities: [
    { slug: 'ogden', name: 'Ogden' },
    { slug: 'provo', name: 'Provo' },
    { slug: 'salt-lake-city', name: 'Salt Lake City' },
  ]},
  { slug: 'washington', name: 'Washington', cities: [
    { slug: 'bellevue', name: 'Bellevue' },
    { slug: 'everett', name: 'Everett' },
    { slug: 'olympia', name: 'Olympia' },
    { slug: 'seattle', name: 'Seattle' },
    { slug: 'spokane', name: 'Spokane' },
    { slug: 'tacoma', name: 'Tacoma' },
    { slug: 'vancouver', name: 'Vancouver' },
  ]},
];
export const STATE_MAP: Record<string, State> = Object.fromEntries(STATES.map(s => [s.slug, s]));

export const COUNTRIES: Country[] = [
  { slug: 'mexico', name: 'México', region: 'Central' },
  { slug: 'guatemala', name: 'Guatemala', region: 'Central' },
  { slug: 'el-salvador', name: 'El Salvador', region: 'Central' },
  { slug: 'honduras', name: 'Honduras', region: 'Central' },
  { slug: 'nicaragua', name: 'Nicaragua', region: 'Central' },
  { slug: 'costa-rica', name: 'Costa Rica', region: 'Central' },
  { slug: 'panama', name: 'Panamá', region: 'Central' },
  { slug: 'cuba', name: 'Cuba', region: 'Caribe' },
  { slug: 'republica-dominicana', name: 'República Dominicana', region: 'Caribe' },
  { slug: 'puerto-rico', name: 'Puerto Rico', region: 'Caribe' },
  { slug: 'argentina', name: 'Argentina', region: 'Sur' },
  { slug: 'bolivia', name: 'Bolivia', region: 'Sur' },
  { slug: 'chile', name: 'Chile', region: 'Sur' },
  { slug: 'colombia', name: 'Colombia', region: 'Sur' },
  { slug: 'ecuador', name: 'Ecuador', region: 'Sur' },
  { slug: 'paraguay', name: 'Paraguay', region: 'Sur' },
  { slug: 'peru', name: 'Perú', region: 'Sur' },
  { slug: 'uruguay', name: 'Uruguay', region: 'Sur' },
  { slug: 'venezuela', name: 'Venezuela', region: 'Sur' },
];
export const COUNTRY_MAP: Record<string, Country> = Object.fromEntries(COUNTRIES.map(c => [c.slug, c]));
