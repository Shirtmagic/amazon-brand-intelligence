export type RenuvBrandSlug = 'renuv';

export function isSupportedBrand(brand: string): brand is RenuvBrandSlug {
  return brand === 'renuv';
}

export function brandRoot(brand?: string) {
  return brand ? `/${brand}` : '/';
}

export function internalRoute(brand?: string, path = '') {
  const clean = path ? `/${path.replace(/^\/+/, '')}` : '';
  return brand ? `/${brand}/internal${clean}` : `/internal/renuv${clean}`;
}

export function clientRoute(brand?: string, path = '') {
  const clean = path ? `/${path.replace(/^\/+/, '')}` : '';
  return brand ? `/${brand}/client${clean}` : `/client/renuv${clean}`;
}
