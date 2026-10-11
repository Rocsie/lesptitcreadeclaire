import { PrismaClient, Role, ProductStatus, DiscountType, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Amorçage de la base de données : Les P\'tites Créa de Claire ---');

  // 1. Utilisateurs par défaut
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('claire2026!', salt);
  const clientPassword = await bcrypt.hash('client123!', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lesptitescreadeclaire.fr' },
    update: {},
    create: {
      email: 'admin@lesptitescreadeclaire.fr',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      firstName: 'Claire',
      lastName: 'Artisane',
      phone: '04 68 00 00 00',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'sophie.martin@example.fr' },
    update: {},
    create: {
      email: 'sophie.martin@example.fr',
      passwordHash: clientPassword,
      role: Role.CLIENT,
      firstName: 'Sophie',
      lastName: 'Martin',
      phone: '06 12 34 56 78',
      addresses: {
        create: {
          title: 'Mon domicile',
          recipientName: 'Sophie Martin',
          addressLine1: '14 Rue de la Mer',
          postalCode: '11210',
          city: 'Port-la-Nouvelle',
          country: 'France',
          phone: '06 12 34 56 78',
          isDefault: true,
        },
      },
    },
  });

  console.log(`Utilisateurs créés: Admin (${admin.email}), Client (${client.email})`);

  // 2. Catégories
  const categoriesData = [
    { name: "Boucles d'oreilles", slug: 'boucles-d-oreilles', description: "Créations étincelantes, résines pailletées, cristaux et dormeuses délicates.", imageUrl: '/images/boucles-oreilles.jpg', displayOrder: 1 },
    { name: 'Bagues', slug: 'bagues', description: 'Finesse des détails, anneaux ciselés, dorures et géométrie sacrée.', imageUrl: '/images/bagues.jpg', displayOrder: 2 },
    { name: 'Broches & Pin\'s', slug: 'broches', description: 'Poésie et esprit marin, poissons chatoyants et motifs méditerranéens.', imageUrl: '/images/broches.jpg', displayOrder: 3 },
    { name: 'Colliers & Pendentifs', slug: 'colliers', description: 'Pierres fines facettées, cabochons colorés et chaînes dorées avec soin.', imageUrl: '/images/colliers.jpg', displayOrder: 4 },
    { name: 'Bracelets', slug: 'bracelets', description: 'Joncs et créations au fil doré pour sublimer votre poignet.', imageUrl: '/images/hero-atelier.jpg', displayOrder: 5 },
    { name: 'Pièces uniques', slug: 'pieces-uniques', description: 'Modèles exclusifs créés en un seul exemplaire numéroté.', imageUrl: '/images/claire-atelier.jpg', displayOrder: 6 },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categories.push(created);
  }

  // 3. Collections
  const collectionsData = [
    { name: "Éclat de Couleurs", slug: 'eclat-de-couleurs', description: 'Palette festive, paillettes lumineuses et résines coulées à la main.', imageUrl: '/images/boucles-oreilles.jpg' },
    { name: "Esprit Marin", slug: 'esprit-marin', description: 'Inspirations du littoral de Port-la-Nouvelle, vagues et faune marine.', imageUrl: '/images/broches.jpg' },
    { name: "Lumière & Finesse", slug: 'lumiere-et-finesse', description: 'Cristaux taillés, reflets précieux et dorures élégantes.', imageUrl: '/images/bagues.jpg' },
  ];

  const collections = [];
  for (const col of collectionsData) {
    const created = await prisma.collection.upsert({
      where: { slug: col.slug },
      update: col,
      create: col,
    });
    collections.push(created);
  }

  // 4. Produits
  const p1 = await prisma.product.upsert({
    where: { slug: 'boucles-pivoine-rose-poudre' },
    update: {},
    create: {
      name: "Boucles Pivoine Rose Poudré & Paillettes",
      slug: "boucles-pivoine-rose-poudre",
      reference: "PCC-BO-001",
      shortDescription: "Résine artisanale rose fuchsia et paillettes dorées, monture plaqué or.",
      description: "Conçues et façonnées avec passion à Port-la-Nouvelle. Chaque goutte de résine capture un kaléidoscope de micro-paillettes brillantes surmontées d'un cabochon facetté. Ultra légères à porter toute la journée.",
      price: 34.00,
      compareAtPrice: 39.00,
      categoryId: categories[0].id,
      collectionId: collections[0].id,
      stock: 4,
      lowStockThreshold: 2,
      status: ProductStatus.PUBLISHED,
      isUniquePiece: false,
      isNew: true,
      badgeText: "Coup de cœur",
      materials: "Résine d'inclusion hypoallergénique, poudres irisées, monture en laiton doré à l'or fin 24k sans nickel.",
      dimensions: "Longueur totale : 5,5 cm. Largeur du cabochon : 1,8 cm.",
      weightGrams: 8,
      careInstructions: "Conserver à l'abri de l'humidité et des parfums directs. Nettoyer avec un chiffon doux sec.",
      images: {
        create: [
          { url: '/images/boucles-oreilles.jpg', altText: 'Boucles d\'oreilles pivoine face', displayOrder: 0 },
          { url: '/images/hero-atelier.jpg', altText: 'Composition atelier', displayOrder: 1 },
        ],
      },
      variants: {
        create: [
          { name: 'Fuchsia étincelant', color: '#D92374', stock: 2, priceDiff: 0 },
          { name: 'Vieux rose poudré', color: '#C87D88', stock: 2, priceDiff: 0 },
        ],
      },
    },
  });

  const p2 = await prisma.product.upsert({
    where: { slug: 'bague-ciselee-fleur-de-vie' },
    update: {},
    create: {
      name: "Bague Ciselée Fleur de Vie & Anneaux Entrelacés",
      slug: "bague-ciselee-fleur-de-vie",
      reference: "PCC-BAG-002",
      shortDescription: "Dentelle de métal ciselée à la main, géométrie sacrée et triple anneau.",
      description: "Inspirée par la finesse des détails de l'artisanat d'art. Cette bague ajustable épouse avec grâce votre doigt. Son motif ajouré diffuse la lumière avec subtilité.",
      price: 29.00,
      categoryId: categories[1].id,
      collectionId: collections[2].id,
      stock: 3,
      lowStockThreshold: 2,
      status: ProductStatus.PUBLISHED,
      isUniquePiece: false,
      isNew: true,
      badgeText: "Nouveauté",
      materials: "Laiton doré et or rose trempé, finition vernis protecteur dermatologique.",
      dimensions: "Taille ajustable du 52 au 58.",
      weightGrams: 5,
      careInstructions: "Éviter le contact prolongé avec l'eau de mer et les produits ménagers.",
      images: {
        create: [
          { url: '/images/bagues.jpg', altText: 'Bagues dorées fleur de vie', displayOrder: 0 },
        ],
      },
      variants: {
        create: [
          { name: 'Doré solaire', color: '#D4AF37', stock: 2, priceDiff: 0 },
          { name: 'Or rose délicat', color: '#E8B4B8', stock: 1, priceDiff: 0 },
        ],
      },
    },
  });

  const p3 = await prisma.product.upsert({
    where: { slug: 'broche-poisson-lagunes-esprit-marin' },
    update: {},
    create: {
      name: "Broche Poisson des Lagunes 'Esprit Marin'",
      slug: "broche-poisson-lagunes-esprit-marin",
      reference: "PCC-BRO-003",
      shortDescription: "Pièce haute joaillerie de fantaisie, pavage de cristaux lagon et améthyste.",
      description: "Hommage direct au littoral audois de Port-la-Nouvelle ! Ce poisson étincelant associe des cristaux facettés turquoise, bleu outremer et prune. Une pièce forte à fixer sur un blazer ou une maille d'hiver.",
      price: 45.00,
      compareAtPrice: 52.00,
      categoryId: categories[2].id,
      collectionId: collections[1].id,
      stock: 2,
      lowStockThreshold: 1,
      status: ProductStatus.PUBLISHED,
      isUniquePiece: true,
      isNew: true,
      badgeText: "Pièce unique",
      materials: "Cristaux facettés autrichiens sertis à la main, alliage bronze vieilli avec épingle de sécurité renforcée.",
      dimensions: "6,2 cm x 4,8 cm.",
      weightGrams: 19,
      careInstructions: "Ranger individuellement dans son écrin en velours fourni.",
      images: {
        create: [
          { url: '/images/broches.jpg', altText: 'Broche poisson turquoise et violet', displayOrder: 0 },
        ],
      },
      variants: {
        create: [
          { name: 'Nuance Lagon & Améthyste', color: '#00A896', stock: 2, priceDiff: 0 },
        ],
      },
    },
  });

  const p4 = await prisma.product.upsert({
    where: { slug: 'plastron-mineral-style-unique' },
    update: {},
    create: {
      name: "Plastron Minéral 'Un Style Unique'",
      slug: "plastron-mineral-style-unique",
      reference: "PCC-COL-004",
      shortDescription: "Cabochons turquoise, lapis-lazuli et cornaline tressés en fil d'or fin.",
      description: "Création signature entièrement forgée à la main à l'atelier. L'alliance de pierres semi-précieuses polies et de volutes dorées fait de ce bijou une œuvre d'art portable.",
      price: 68.00,
      categoryId: categories[3].id,
      collectionId: collections[0].id,
      stock: 2,
      lowStockThreshold: 1,
      status: ProductStatus.PUBLISHED,
      isUniquePiece: true,
      isNew: true,
      badgeText: "Pièce unique",
      materials: "Turquoise naturelle, lapis lazuli d'Afghanistan, cornaline, fil gold-filled 14k.",
      dimensions: "Longueur chaîne : 42 cm + chaînette de rallonge 5 cm. Pendentif : 6 cm.",
      weightGrams: 24,
      careInstructions: "Nettoyer uniquement avec un chiffon en microfibre doux sans solvant.",
      images: {
        create: [
          { url: '/images/colliers.jpg', altText: 'Collier plastron pierres colorées', displayOrder: 0 },
        ],
      },
    },
  });

  // 5. Horaires de la boutique L'Atelier (conformes aux flyers)
  await prisma.openingHour.deleteMany({});
  await prisma.openingHour.createMany({
    data: [
      { dayGroup: 'Lundi - Mardi', morningHours: '10 h - 12 h', afternoonHours: '14 h - 17 h', isClosed: false, sortOrder: 1 },
      { dayGroup: 'Mercredi - Samedi', morningHours: '10 h - 12 h', afternoonHours: '15 h - 18 h 30', isClosed: false, sortOrder: 2 },
      { dayGroup: 'Dimanche', morningHours: '10 h - 12 h', afternoonHours: '14 h - 17 h', isClosed: false, sortOrder: 3 },
    ],
  });

  // 6. Codes de promotion
  await prisma.coupon.upsert({
    where: { code: 'BIENVENUE10' },
    update: {},
    create: {
      code: 'BIENVENUE10',
      description: '10% de bienvenue pour votre première commande à l\'atelier',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 30.00,
      maxUses: 100,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'PORTLANOUVELLE' },
    update: {},
    create: {
      code: 'PORTLANOUVELLE',
      description: 'Livraison offerte sur toutes les créations',
      discountType: DiscountType.FREE_SHIPPING,
      discountValue: 0,
      minOrderAmount: 25.00,
      maxUses: 200,
      isActive: true,
    },
  });

  // 7. Paramètres du site (CMS)
  const settings = [
    { key: 'site_name', value: "Les P'tites Créa de Claire", description: 'Nom officiel de la boutique' },
    { key: 'site_tagline', value: "Boutique L'Atelier • Port-la-Nouvelle", description: 'Slogan d\'en-tête' },
    { key: 'banner_announcement', value: "✨ Retrait gratuit à la boutique L'Atelier à Port-la-Nouvelle • Livraison offerte dès 60€ !", description: 'Bannière d\'annonce supérieure' },
    { key: 'hero_title', value: "Des créations uniques, imaginées et réalisées avec passion.", description: 'Grand titre Hero' },
    { key: 'hero_subtitle', value: "Créations artisanales • Pièces uniques & petites séries • Port-la-Nouvelle", description: 'Sous-titre Hero' },
    { key: 'about_story', value: "Nichée à Port-la-Nouvelle dans l'Aude, la boutique L'Atelier des P'tites Créa de Claire est née d'un amour sincère pour la couleur, la lumière méditerranéenne et le travail méticuleux du bijou fait main.", description: 'Texte d\'introduction atelier' },
    { key: 'shipping_standard_cost', value: "4.90", description: 'Frais de livraison standard' },
    { key: 'shipping_free_threshold', value: "60.00", description: 'Seuil pour la livraison offerte' },
    { key: 'contact_phone', value: "04 68 00 00 00", description: 'Téléphone de la boutique' },
    { key: 'contact_email', value: "contact@lesptitescreadeclaire.fr", description: 'Email de contact' },
    { key: 'contact_address', value: "Boutique L'Atelier, Port-la-Nouvelle (11210), France", description: 'Adresse de la boutique' },
    { key: 'instagram_url', value: "https://instagram.com", description: 'Lien profil Instagram' },
    { key: 'facebook_url', value: "https://facebook.com", description: 'Lien page Facebook' },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 8. Commande de démonstration
  const existingOrder = await prisma.order.findUnique({ where: { orderNumber: 'PCC-2026-000001' } });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderNumber: 'PCC-2026-000001',
        userId: client.id,
        customerEmail: 'sophie.martin@example.fr',
        customerFirstName: 'Sophie',
        customerLastName: 'Martin',
        customerPhone: '06 12 34 56 78',
        shippingMethod: 'pickup',
        shippingCost: 0,
        subtotal: 63.00,
        discountAmount: 0,
        total: 63.00,
        status: OrderStatus.DELIVERED,
        paymentMethod: 'card',
        paymentStatus: PaymentStatus.COMPLETED,
        shippingAddress: {
          name: 'Sophie Martin',
          address1: '14 Rue de la Mer',
          postalCode: '11210',
          city: 'Port-la-Nouvelle',
        },
        items: {
          create: [
            {
              productName: "Boucles Pivoine Rose Poudré & Paillettes",
              productReference: "PCC-BO-001",
              variantTitle: "Fuchsia étincelant",
              imageUrl: "/images/boucles-oreilles.jpg",
              unitPrice: 34.00,
              quantity: 1,
              totalPrice: 34.00,
              productId: p1.id,
            },
            {
              productName: "Bague Ciselée Fleur de Vie",
              productReference: "PCC-BAG-002",
              variantTitle: "Doré solaire",
              imageUrl: "/images/bagues.jpg",
              unitPrice: 29.00,
              quantity: 1,
              totalPrice: 29.00,
              productId: p2.id,
            },
          ],
        },
      },
    });
  }

  console.log('--- Amorçage terminé avec succès ! ---');
}

main()
  .catch((e) => {
    console.error('Erreur lors de l\'amorçage Prisma:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
