import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Superadmin ──────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexuscommerce.com' },
    update: {},
    create: {
      email: 'admin@nexuscommerce.com',
      username: 'superadmin',
      passwordHash: adminPassword,
      role: 'SUPERADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      authProviders: {
        create: {
          provider: 'LOCAL',
          providerId: 'admin@nexuscommerce.com',
        },
      },
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ─── Categories ───────────────────────────────────────────────────────
  const categories = [
    {
      slug: 'electronics',
      name: { pt: 'Eletrônicos', en: 'Electronics', es: 'Electrónicos', fr: 'Électronique', ja: '電子機器', de: 'Elektronik' },
      iconName: 'cpu',
    },
    {
      slug: 'smartphones',
      name: { pt: 'Smartphones', en: 'Smartphones', es: 'Smartphones', fr: 'Smartphones', ja: 'スマートフォン', de: 'Smartphones' },
      iconName: 'smartphone',
    },
    {
      slug: 'computers',
      name: { pt: 'Computadores', en: 'Computers', es: 'Computadores', fr: 'Ordinateurs', ja: 'コンピューター', de: 'Computer' },
      iconName: 'monitor',
    },
    {
      slug: 'fashion',
      name: { pt: 'Moda', en: 'Fashion', es: 'Moda', fr: 'Mode', ja: 'ファッション', de: 'Mode' },
      iconName: 'shirt',
    },
    {
      slug: 'games',
      name: { pt: 'Games', en: 'Games', es: 'Juegos', fr: 'Jeux', ja: 'ゲーム', de: 'Spiele' },
      iconName: 'gamepad-2',
    },
    {
      slug: 'accessories',
      name: { pt: 'Acessórios', en: 'Accessories', es: 'Accesorios', fr: 'Accessoires', ja: 'アクセサリー', de: 'Zubehör' },
      iconName: 'watch',
    },
    {
      slug: 'home',
      name: { pt: 'Casa', en: 'Home', es: 'Hogar', fr: 'Maison', ja: 'ホーム', de: 'Haus' },
      iconName: 'home',
    },
    {
      slug: 'digital',
      name: { pt: 'Produtos Digitais', en: 'Digital Products', es: 'Productos Digitales', fr: 'Produits Numériques', ja: 'デジタル製品', de: 'Digitale Produkte' },
      iconName: 'download',
    },
    {
      slug: 'audio',
      name: { pt: 'Áudio', en: 'Audio', es: 'Audio', fr: 'Audio', ja: 'オーディオ', de: 'Audio' },
      iconName: 'headphones',
    },
    {
      slug: 'tech',
      name: { pt: 'Tecnologia', en: 'Technology', es: 'Tecnología', fr: 'Technologie', ja: 'テクノロジー', de: 'Technologie' },
      iconName: 'zap',
    },
  ];

  for (const [i, cat] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, sortOrder: i },
    });
  }
  console.log(`✅ ${categories.length} categories created`);

  // ─── Brands ───────────────────────────────────────────────────────────
  const brands = [
    { slug: 'apple', name: 'Apple', website: 'https://apple.com' },
    { slug: 'samsung', name: 'Samsung', website: 'https://samsung.com' },
    { slug: 'sony', name: 'Sony', website: 'https://sony.com' },
    { slug: 'nike', name: 'Nike', website: 'https://nike.com' },
    { slug: 'lg', name: 'LG', website: 'https://lg.com' },
    { slug: 'xiaomi', name: 'Xiaomi', website: 'https://xiaomi.com' },
    { slug: 'microsoft', name: 'Microsoft', website: 'https://microsoft.com' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
  }
  console.log(`✅ ${brands.length} brands created`);

  // ─── Demo Products ────────────────────────────────────────────────────
  const electronicsCategory = await prisma.category.findUnique({ where: { slug: 'electronics' } });
  const phonesCategory = await prisma.category.findUnique({ where: { slug: 'smartphones' } });
  const appleBrand = await prisma.brand.findUnique({ where: { slug: 'apple' } });
  const samsungBrand = await prisma.brand.findUnique({ where: { slug: 'samsung' } });

  const sampleProducts = [
    {
      slug: 'iphone-15-pro',
      sku: 'IPH-15PRO-256',
      name: { pt: 'iPhone 15 Pro 256GB', en: 'iPhone 15 Pro 256GB' },
      description: {
        pt: 'O iPhone 15 Pro apresenta o chip A17 Pro, câmera de 48 MP e botão de ação personalizável.',
        en: 'iPhone 15 Pro features the A17 Pro chip, 48MP camera and customizable Action button.',
      },
      categoryId: phonesCategory!.id,
      brandId: appleBrand!.id,
      status: 'ACTIVE' as const,
      basePrice: 8999.99,
      comparePrice: 9999.99,
      isFeatured: true,
      tags: ['smartphone', 'apple', 'ios', '5g'],
    },
    {
      slug: 'samsung-galaxy-s24-ultra',
      sku: 'SAM-S24U-256',
      name: { pt: 'Samsung Galaxy S24 Ultra', en: 'Samsung Galaxy S24 Ultra' },
      description: {
        pt: 'Galaxy S24 Ultra com Galaxy AI, câmera de 200 MP e S Pen integrada.',
        en: 'Galaxy S24 Ultra with Galaxy AI, 200MP camera and built-in S Pen.',
      },
      categoryId: phonesCategory!.id,
      brandId: samsungBrand!.id,
      status: 'ACTIVE' as const,
      basePrice: 7999.99,
      comparePrice: 8999.99,
      isFeatured: true,
      tags: ['smartphone', 'samsung', 'android', '5g'],
    },
  ];

  for (const product of sampleProducts) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });

    // Add a default variant
    await prisma.productVariant.upsert({
      where: { sku: `${product.sku}-DEFAULT` },
      update: {},
      create: {
        productId: created.id,
        sku: `${product.sku}-DEFAULT`,
        name: 'Padrão',
        price: product.basePrice,
        stock: 100,
        options: {},
        isActive: true,
      },
    });
  }
  console.log(`✅ ${sampleProducts.length} sample products created`);

  // ─── Sample Coupon ────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% de desconto na primeira compra',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 50,
      maxUses: 1000,
      maxUsesPerUser: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FRETE0' },
    update: {},
    create: {
      code: 'FRETE0',
      description: 'Frete grátis',
      discountType: 'FREE_SHIPPING',
      discountValue: 0,
      minOrderAmount: 200,
      isActive: true,
    },
  });
  console.log('✅ Sample coupons created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Admin login: admin@nexuscommerce.com');
  console.log('🔑 Admin password: Admin@123456');
  console.log('🎟️  Coupon codes: WELCOME10, FRETE0');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
