const PRODUCT_SKU_PREFIX = 'SKU-';
const PRODUCT_SKU_DIGITS = 7;
const PRODUCT_SKU_PATTERN = /^SKU-(\d{7})$/;

type ProductVariantClient = {
  productVariant: {
    findMany(args: {
      where: { sku: { startsWith: string } };
      select: { sku: true };
    }): Promise<Array<{ sku: string }>>;
  };
};

export async function generateProductVariantSku(
  tx: ProductVariantClient,
  reservedSkus = new Set<string>(),
) {
  const existingSkus = await tx.productVariant.findMany({
    where: {
      sku: {
        startsWith: PRODUCT_SKU_PREFIX,
      },
    },
    select: {
      sku: true,
    },
  });

  const highestSequence = existingSkus.reduce((highest, variant) => {
    const match = PRODUCT_SKU_PATTERN.exec(variant.sku);
    const sequence = match ? Number(match[1]) : 0;

    return Math.max(highest, sequence);
  }, 0);

  let nextSequence = highestSequence;
  let sku: string;

  do {
    nextSequence += 1;
    sku = `${PRODUCT_SKU_PREFIX}${String(nextSequence).padStart(
      PRODUCT_SKU_DIGITS,
      '0',
    )}`;
  } while (reservedSkus.has(sku));

  reservedSkus.add(sku);

  return sku;
}

export async function resolveProductVariantSku(
  tx: ProductVariantClient,
  sku?: string,
  reservedSkus = new Set<string>(),
) {
  const trimmedSku = sku?.trim();

  if (trimmedSku) {
    reservedSkus.add(trimmedSku);
    return trimmedSku;
  }

  return generateProductVariantSku(tx, reservedSkus);
}
