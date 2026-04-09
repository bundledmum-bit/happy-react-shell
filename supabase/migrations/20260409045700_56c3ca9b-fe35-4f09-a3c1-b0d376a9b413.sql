
-- Assign subcategories to all products based on their type
UPDATE products SET subcategory = 'nappies-wipes' WHERE slug IN ('baby-wipes', 'baby-nappies-size-2', 'baby-nappies-size-3', 'baby-nappies-size-4');
UPDATE products SET subcategory = 'nappies-wipes' WHERE slug LIKE '%nappy%' OR slug LIKE '%nappies%' OR slug LIKE '%wipes%';

UPDATE products SET subcategory = 'skincare-bath' WHERE slug IN ('baby-skincare-set', 'baby-body-lotion', 'baby-oil', 'baby-wash-shampoo', 'baby-bathtub');
UPDATE products SET subcategory = 'skincare-bath' WHERE slug LIKE '%lotion%' OR slug LIKE '%wash%' OR slug LIKE '%oil%' OR slug LIKE '%skincare%' OR slug LIKE '%bath%';

UPDATE products SET subcategory = 'clothing-swaddles' WHERE slug IN ('muslin-swaddle', 'newborn-onesie-set', 'going-home-outfit', 'cap-mittens-booties', 'newborn-onesie-set-3-pack');
UPDATE products SET subcategory = 'clothing-swaddles' WHERE slug LIKE '%swaddle%' OR slug LIKE '%onesie%' OR slug LIKE '%outfit%' OR slug LIKE '%mittens%' OR slug LIKE '%booties%' OR slug LIKE '%cap-%' OR slug LIKE '%socks%' OR slug LIKE '%romper%' OR slug LIKE '%clothing%' OR slug LIKE '%vest%' OR slug LIKE '%bodysuit%';

UPDATE products SET subcategory = 'health-safety' WHERE slug IN ('baby-thermometer', 'baby-nail-kit', 'baby-nail-care-kit', 'nasal-aspirator', 'baby-first-aid-kit', 'baby-safety-set');
UPDATE products SET subcategory = 'health-safety' WHERE slug LIKE '%thermometer%' OR slug LIKE '%nail%' OR slug LIKE '%aspirator%' OR slug LIKE '%first-aid%' OR slug LIKE '%safety%' OR slug LIKE '%monitor%';

UPDATE products SET subcategory = 'feeding' WHERE slug IN ('baby-formula', 'baby-feeding-bottle', 'baby-feeding-bottles-set', 'baby-feeding-set', 'baby-bibs-5-pack', 'baby-teething-toy');
UPDATE products SET subcategory = 'feeding' WHERE slug LIKE '%formula%' OR slug LIKE '%feeding%' OR slug LIKE '%bottle%' OR slug LIKE '%bibs%' OR slug LIKE '%teething%';

UPDATE products SET subcategory = 'maternity-recovery' WHERE slug IN ('maternity-pads', 'postpartum-belly-band', 'disposable-underwear', 'compression-socks', 'perineal-spray', 'postpartum-recovery-kit');
UPDATE products SET subcategory = 'maternity-recovery' WHERE (slug LIKE '%maternity%' OR slug LIKE '%postpartum%' OR slug LIKE '%belly-band%' OR slug LIKE '%disposable-underwear%' OR slug LIKE '%compression%' OR slug LIKE '%perineal%') AND category = 'mum';

UPDATE products SET subcategory = 'nursing' WHERE slug IN ('nursing-pads', 'nipple-cream', 'nursing-nightgown', 'nursing-bra', 'breast-pads');
UPDATE products SET subcategory = 'nursing' WHERE (slug LIKE '%nursing%' OR slug LIKE '%nipple%' OR slug LIKE '%breast%') AND category = 'mum';

UPDATE products SET subcategory = 'hospital-essentials' WHERE slug IN ('hospital-slippers', 'antenatal-records-folder', 'labour-snack-pack');
UPDATE products SET subcategory = 'hospital-essentials' WHERE slug LIKE '%hospital%' OR slug LIKE '%antenatal%' OR slug LIKE '%labour%' OR slug LIKE '%snack-pack%';

-- Catch-all: baby products without subcategory
UPDATE products SET subcategory = 'health-safety' WHERE subcategory IS NULL AND category = 'baby' AND (slug LIKE '%carrier%' OR slug LIKE '%stroller%' OR slug LIKE '%pram%' OR slug LIKE '%car-seat%' OR slug LIKE '%cot%' OR slug LIKE '%walker%');

-- Baby gear/toys
UPDATE products SET subcategory = 'feeding' WHERE subcategory IS NULL AND category = 'baby' AND (slug LIKE '%books%' OR slug LIKE '%flash%' OR slug LIKE '%toy%');

-- Remaining baby products default to health-safety
UPDATE products SET subcategory = 'health-safety' WHERE subcategory IS NULL AND category = 'baby';

-- Remaining mum products default to hospital-essentials
UPDATE products SET subcategory = 'hospital-essentials' WHERE subcategory IS NULL AND category = 'mum';
