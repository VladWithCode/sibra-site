-- Test Properties Data for Sibra Durango
-- Properties for sale in various Mexican cities
-- Usage: \i sql/test_properties.sql

-- First, insert a test agent user
INSERT INTO users (id, fullName, password, username, role, email, phone, email_verified, phone_verified, img)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Administración Sibra',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- bcrypt hash for 'password123'
    'sibraadmin',
    'admin',
    'administracion@sibra.mx',
    '618 194 1145',
    true,
    true,
    ''
) ON CONFLICT (username) DO NOTHING;

-- Insert 20 properties for sale across Mexico
INSERT INTO properties (
    id, address, description, city, state, zip, nb_hood, country,
    price, property_type, contract, beds, baths, square_mt, lot_size,
    listing_date, year_built, status, lat, lon, featured,
    featured_expires_at, main_img, imgs, agent, slug, features
) VALUES

-- 1. Luxury house in Polanco, CDMX
('550e8400-e29b-41d4-a716-446655440001',
'Av. Presidente Masaryk 123',
'Hermosa casa de lujo en una de las zonas más exclusivas de la Ciudad de México. Cuenta con acabados de primera calidad, amplios espacios y excelente ubicación cerca de centros comerciales y restaurantes de clase mundial.',
'Ciudad de México', 'CDMX', '11560', 'Polanco', 'México',
12500000.00, 'Casa', 'venta', 4, 3, 350.0, 200.0,
'2024-01-15', 2018, 'disponible', 19.4326, -99.1332, true,
'2024-03-15 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-lujo-polanco-masaryk',
'{"alberca": true, "jardin": true, "estacionamiento": 3, "seguridad": true, "gimnasio": true, "terraza": true}'),

-- 2. Modern apartment in Roma Norte, CDMX
('550e8400-e29b-41d4-a716-446655440002',
'Calle Álvaro Obregón 85',
'Moderno departamento en el corazón de Roma Norte, una de las colonias más vibrantes de la ciudad. Diseño contemporáneo con excelente iluminación natural y cerca de cafeterías, galerías y vida nocturna.',
'Ciudad de México', 'CDMX', '06700', 'Roma Norte', 'México',
6800000.00, 'Departamento', 'venta', 2, 2, 120.0, 0.0,
'2024-01-20', 2020, 'disponible', 19.4145, -99.1626, true,
'2024-03-20 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'departamento-moderno-roma-norte',
'{"balcon": true, "estacionamiento": 1, "elevador": true, "gym": true, "roof_garden": true}'),

-- 3. Family house in Zapopan, Jalisco
('550e8400-e29b-41d4-a716-446655440003',
'Av. Patria 1250',
'Amplia casa familiar en Zapopan, perfecta para familias que buscan tranquilidad sin alejarse de la ciudad. Cuenta con jardín amplio, cochera para dos autos y excelente ubicación cerca de escuelas y centros comerciales.',
'Zapopan', 'Jalisco', '45110', 'Providencia', 'México',
4200000.00, 'Casa', 'venta', 3, 2, 180.0, 150.0,
'2024-01-25', 2015, 'disponible', 20.7333, -103.4167, false,
'2024-03-25 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-familiar-zapopan-patria',
'{"jardin": true, "estacionamiento": 2, "seguridad": true, "cuarto_servicio": true}'),

-- 4. Beachfront land in Playa del Carmen
('550e8400-e29b-41d4-a716-446655440004',
'Carretera Federal 307 Km 45',
'Terreno con frente de playa en Playa del Carmen, ideal para desarrollo turístico o residencial. Ubicación privilegiada con acceso directo al mar Caribe y todos los servicios disponibles.',
'Playa del Carmen', 'Quintana Roo', '77710', 'Zona Hotelera', 'México',
8500000.00, 'Terreno', 'venta', 0, 0, 0.0, 500.0,
'2024-02-01', 0, 'disponible', 20.6296, -87.0739, true,
'2024-04-01 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'terreno-frente-playa-carmen',
'{"frente_playa": true, "servicios": true, "acceso_carretera": true, "uso_turistico": true}'),

-- 5. Modern office in Santa Fe, CDMX
('550e8400-e29b-41d4-a716-446655440005',
'Av. Santa Fe 482',
'Moderna oficina en el distrito financiero de Santa Fe. Edificio corporativo clase A+ con tecnología de punta, estacionamiento amplio y excelente conectividad con toda la ciudad.',
'Ciudad de México', 'CDMX', '01376', 'Santa Fe', 'México',
8900000.00, 'Oficina', 'venta', 0, 2, 150.0, 0.0,
'2024-02-05', 2019, 'disponible', 19.3570, -99.2608, false,
'2024-04-05 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'oficina-moderna-santa-fe',
'{"aire_acondicionado": true, "estacionamiento": 5, "elevador": true, "seguridad": true, "internet_fibra": true}'),

-- 6. Luxury house in San Pedro, Nuevo León
('550e8400-e29b-41d4-a716-446655440006',
'Av. Gómez Morín 400',
'Espectacular residencia en San Pedro Garza García, la zona más exclusiva de Monterrey. Casa de lujo con acabados premium, alberca, jardín amplio y vista panorámica de la ciudad.',
'San Pedro Garza García', 'Nuevo León', '66260', 'Del Valle', 'México',
9200000.00, 'Casa', 'venta', 4, 3, 400.0, 300.0,
'2024-02-10', 2017, 'disponible', 25.6515, -100.3617, true,
'2024-04-10 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-lujo-san-pedro-gomez-morin',
'{"alberca": true, "jardin": true, "estacionamiento": 4, "seguridad": true, "vista_panoramica": true, "cuarto_servicio": true}'),

-- 7. Penthouse in Condesa, CDMX
('550e8400-e29b-41d4-a716-446655440007',
'Av. Amsterdam 120',
'Exclusivo penthouse en la Condesa con terraza privada y vista a los parques. Diseño arquitectónico único, acabados de lujo y ubicación inmejorable en una de las colonias más deseadas de la ciudad.',
'Ciudad de México', 'CDMX', '06140', 'Condesa', 'México',
15800000.00, 'Departamento', 'venta', 3, 3, 250.0, 0.0,
'2024-02-15', 2021, 'disponible', 19.4103, -99.1711, true,
'2024-04-15 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'penthouse-condesa-amsterdam',
'{"terraza": true, "estacionamiento": 2, "elevador": true, "vista_parque": true, "jacuzzi": true, "cuarto_servicio": true}'),

-- 8. Commercial space in Guadalajara Centro
('550e8400-e29b-41d4-a716-446655440008',
'Av. Juárez 500',
'Local comercial en el centro histórico de Guadalajara, ideal para restaurante, boutique o oficinas. Excelente ubicación con alto flujo peatonal y fácil acceso al transporte público.',
'Guadalajara', 'Jalisco', '44100', 'Centro', 'México',
3500000.00, 'Local Comercial', 'venta', 0, 1, 80.0, 0.0,
'2024-02-20', 1995, 'disponible', 20.6767, -103.3475, false,
'2024-04-20 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'local-comercial-guadalajara-centro',
'{"aire_acondicionado": true, "vitrina": true, "acceso_discapacitados": true, "transporte_publico": true}'),

-- 9. Colonial house in Mérida Centro
('550e8400-e29b-41d4-a716-446655440009',
'Calle 60 No. 350',
'Hermosa casa colonial restaurada en el centro histórico de Mérida. Conserva elementos arquitectónicos originales con comodidades modernas. Perfecta para quienes buscan historia y elegancia.',
'Mérida', 'Yucatán', '97000', 'Centro Histórico', 'México',
4800000.00, 'Casa', 'venta', 3, 2, 200.0, 180.0,
'2024-02-25', 1920, 'disponible', 20.9674, -89.5926, false,
'2024-04-25 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-colonial-merida-centro',
'{"arquitectura_colonial": true, "patio_central": true, "estacionamiento": 1, "restaurada": true, "techos_altos": true}'),

-- 10. Modern apartment in Zona Río, Tijuana
('550e8400-e29b-41d4-a716-446655440010',
'Blvd. Agua Caliente 4558',
'Departamento moderno en Zona Río, el distrito financiero de Tijuana. Excelente inversión con alta plusvalía, cerca de la frontera y centros comerciales importantes.',
'Tijuana', 'Baja California', '22420', 'Zona Río', 'México',
5200000.00, 'Departamento', 'venta', 2, 2, 110.0, 0.0,
'2024-03-01', 2019, 'disponible', 32.5149, -117.0382, false,
'2024-05-01 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'departamento-moderno-zona-rio-tijuana',
'{"balcon": true, "estacionamiento": 1, "elevador": true, "gym": true, "alberca": true}'),

-- 11. Luxury condo in Angelópolis, Puebla
('550e8400-e29b-41d4-a716-446655440011',
'Blvd. del Niño Poblano 2901',
'Lujoso departamento en Angelópolis, la zona más moderna de Puebla. Desarrollo exclusivo con amenidades de primer nivel y excelente ubicación cerca de centros comerciales y universidades.',
'Puebla', 'Puebla', '72810', 'Angelópolis', 'México',
3800000.00, 'Departamento', 'venta', 2, 2, 95.0, 0.0,
'2024-03-05', 2020, 'disponible', 19.0414, -98.2063, false,
'2024-05-05 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'departamento-lujo-angelopolis-puebla',
'{"balcon": true, "estacionamiento": 1, "elevador": true, "gym": true, "alberca": true, "salon_eventos": true}'),

-- 12. Beach house in Cancún
('550e8400-e29b-41d4-a716-446655440012',
'Blvd. Kukulcán Km 14.5',
'Casa frente al mar en la Zona Hotelera de Cancún. Propiedad única con acceso privado a la playa, ideal para uso vacacional o inversión en renta turística.',
'Cancún', 'Quintana Roo', '77500', 'Zona Hotelera', 'México',
18500000.00, 'Casa', 'venta', 4, 4, 300.0, 250.0,
'2024-03-10', 2016, 'disponible', 21.1619, -86.8515, true,
'2024-05-10 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-frente-mar-cancun-kukulcan',
'{"frente_playa": true, "alberca": true, "jardin": true, "estacionamiento": 3, "terraza": true, "acceso_privado_playa": true}'),

-- 13. Industrial warehouse in Guadalajara
('550e8400-e29b-41d4-a716-446655440013',
'Carretera a Chapala 1500',
'Bodega industrial en zona estratégica de Guadalajara. Ideal para distribución y logística con fácil acceso a carreteras principales y aeropuerto.',
'Guadalajara', 'Jalisco', '45640', 'Industrial', 'México',
6200000.00, 'Bodega', 'venta', 0, 2, 800.0, 1000.0,
'2024-03-15', 2010, 'disponible', 20.6597, -103.3496, false,
'2024-05-15 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'bodega-industrial-guadalajara-chapala',
'{"anden_carga": true, "estacionamiento": 10, "oficinas": true, "seguridad": true, "acceso_trailer": true}'),

-- 14. Townhouse in Del Valle, CDMX
('550e8400-e29b-41d4-a716-446655440014',
'Av. Insurgentes Sur 1200',
'Casa en condominio horizontal en Del Valle, una de las colonias más tradicionales del sur de la ciudad. Excelente ubicación con fácil acceso a Insurgentes y el metro.',
'Ciudad de México', 'CDMX', '03100', 'Del Valle', 'México',
7500000.00, 'Casa', 'venta', 3, 2, 160.0, 80.0,
'2024-03-20', 2005, 'disponible', 19.3723, -99.1677, false,
'2024-05-20 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-condominio-del-valle-insurgentes',
'{"jardin": true, "estacionamiento": 2, "seguridad": true, "areas_comunes": true, "metro_cercano": true}'),

-- 15. Luxury apartment in Monterrey Centro
('550e8400-e29b-41d4-a716-446655440015',
'Av. Constitución 300',
'Departamento de lujo en el centro de Monterrey, en edificio histórico completamente renovado. Combina la elegancia clásica con comodidades modernas.',
'Monterrey', 'Nuevo León', '64000', 'Centro', 'México',
4500000.00, 'Departamento', 'venta', 2, 2, 130.0, 0.0,
'2024-03-25', 1950, 'disponible', 25.6714, -100.3089, false,
'2024-05-25 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'departamento-lujo-monterrey-centro',
'{"balcon": true, "estacionamiento": 1, "elevador": true, "edificio_historico": true, "techos_altos": true}'),

-- 16. Commercial plaza in Mérida Norte
('550e8400-e29b-41d4-a716-446655440016',
'Av. García Lavín 300',
'Local comercial en plaza establecida en el norte de Mérida. Zona de alto crecimiento con excelente flujo vehicular y peatonal.',
'Mérida', 'Yucatán', '97129', 'García Ginerés', 'México',
2800000.00, 'Local Comercial', 'venta', 0, 1, 60.0, 0.0,
'2024-04-01', 2012, 'disponible', 21.0285, -89.5925, false,
'2024-06-01 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'local-comercial-merida-norte-garcia-lavin',
'{"aire_acondicionado": true, "estacionamiento": 3, "vitrina": true, "plaza_establecida": true}'),

-- 17. Residential land in Tijuana
('550e8400-e29b-41d4-a716-446655440017',
'Blvd. Insurgentes 2000',
'Terreno residencial en zona de alta plusvalía en Tijuana. Ideal para desarrollo habitacional o casa unifamiliar. Todos los servicios disponibles.',
'Tijuana', 'Baja California', '22105', 'Chapultepec', 'México',
1800000.00, 'Terreno', 'venta', 0, 0, 0.0, 300.0,
'2024-04-05', 0, 'disponible', 32.5027, -117.0143, false,
'2024-06-05 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'terreno-residencial-tijuana-chapultepec',
'{"servicios": true, "uso_habitacional": true, "esquina": false, "plano": true, "plusvalia": true}'),

-- 18. Office building in Polanco, CDMX
('550e8400-e29b-41d4-a716-446655440018',
'Av. Horacio 1022',
'Edificio de oficinas completo en Polanco. Excelente oportunidad de inversión en una de las zonas corporativas más importantes de México.',
'Ciudad de México', 'CDMX', '11550', 'Polanco', 'México',
45000000.00, 'Edificio', 'venta', 0, 8, 1200.0, 0.0,
'2024-04-10', 1998, 'disponible', 19.4284, -99.1917, true,
'2024-06-10 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'edificio-oficinas-polanco-horacio',
'{"elevadores": 2, "estacionamiento": 20, "seguridad": true, "aire_acondicionado": true, "internet_fibra": true, "generador": true}'),

-- 19. Beach condo in Puerto Vallarta
('550e8400-e29b-41d4-a716-446655440019',
'Blvd. Francisco Medina Ascencio 2500',
'Departamento frente al mar en Puerto Vallarta. Vista panorámica al océano Pacífico, ideal para vacaciones o inversión turística.',
'Puerto Vallarta', 'Jalisco', '48333', 'Zona Hotelera Norte', 'México',
8200000.00, 'Departamento', 'venta', 2, 2, 140.0, 0.0,
'2024-04-15', 2018, 'disponible', 20.6534, -105.2253, true,
'2024-06-15 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'departamento-frente-mar-puerto-vallarta',
'{"vista_mar": true, "balcon": true, "estacionamiento": 1, "elevador": true, "alberca": true, "playa_privada": true}'),

-- 20. Country house in Tequisquiapan, Querétaro
('550e8400-e29b-41d4-a716-446655440020',
'Carretera a San Juan del Río Km 5',
'Casa de campo en Tequisquiapan, pueblo mágico de Querétaro. Perfecta para descanso de fin de semana, con amplios jardines y ambiente tranquilo.',
'Tequisquiapan', 'Querétaro', '76750', 'Centro', 'México',
3200000.00, 'Casa', 'venta', 3, 2, 220.0, 800.0,
'2024-04-20', 2008, 'disponible', 20.5186, -99.8847, false,
'2024-06-20 23:59:59', '', '{}',
'550e8400-e29b-41d4-a716-446655440000',
'casa-campo-tequisquiapan-queretaro',
'{"jardin": true, "estacionamiento": 3, "pozo_agua": true, "arboles_frutales": true, "tranquilidad": true, "pueblo_magico": true}');

-- Update statistics for better query performance
ANALYZE properties;
ANALYZE users;
