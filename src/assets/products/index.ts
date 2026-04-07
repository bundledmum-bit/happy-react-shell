// Static product image imports — used as fallbacks when no Supabase product_images exist
import nappyPack from "@/assets/products/newborn-nappy-pack.jpg";
import babyWipes from "@/assets/products/baby-wipes.jpg";
import skincareSet from "@/assets/products/baby-skincare-set.jpg";
import muslinSwaddle from "@/assets/products/muslin-swaddle.jpg";
import onesieSet from "@/assets/products/newborn-onesie-set.jpg";
import goingHome from "@/assets/products/going-home-outfit.jpg";
import capMittens from "@/assets/products/cap-mittens-booties.jpg";
import thermometer from "@/assets/products/baby-thermometer.jpg";
import nasalAspirator from "@/assets/products/nasal-aspirator.jpg";
import nailKit from "@/assets/products/baby-nail-kit.jpg";
import maternityPads from "@/assets/products/maternity-pads.jpg";
import nursingPads from "@/assets/products/nursing-pads.jpg";
import nippleCream from "@/assets/products/nipple-cream.jpg";
import bellyBand from "@/assets/products/postpartum-belly-band.jpg";
import slippers from "@/assets/products/hospital-slippers.jpg";
import snackPack from "@/assets/products/labour-snack-pack.jpg";
import disposableUnderwear from "@/assets/products/disposable-underwear.jpg";
import nursingNightgown from "@/assets/products/nursing-nightgown.jpg";
import recordsFolder from "@/assets/products/antenatal-records-folder.jpg";

const PRODUCT_IMAGES: Record<string, string> = {
  "newborn-nappy-pack": nappyPack,
  "baby-wipes": babyWipes,
  "baby-skincare-set": skincareSet,
  "muslin-swaddle": muslinSwaddle,
  "newborn-onesie-set": onesieSet,
  "going-home-outfit": goingHome,
  "cap-mittens-booties": capMittens,
  "baby-thermometer": thermometer,
  "nasal-aspirator": nasalAspirator,
  "baby-nail-kit": nailKit,
  "maternity-pads": maternityPads,
  "nursing-pads": nursingPads,
  "nipple-cream": nippleCream,
  "postpartum-belly-band": bellyBand,
  "hospital-slippers": slippers,
  "labour-snack-pack": snackPack,
  "disposable-underwear": disposableUnderwear,
  "nursing-nightgown": nursingNightgown,
  "antenatal-records-folder": recordsFolder,
  // compression-socks image generation failed — will use emoji fallback
};

export function getProductImage(slug: string): string | undefined {
  return PRODUCT_IMAGES[slug];
}
