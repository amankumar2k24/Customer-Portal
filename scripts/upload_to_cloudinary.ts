import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';


import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IMAGES_DIR = path.join(__dirname, '../productImages');

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`Directory ${IMAGES_DIR} not found. Creating it...`);
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`Please place your local images in 'productImages' (e.g. TCL211.png) and run this script again.`);
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
  if (files.length === 0) {
    console.log(`No images found in ${IMAGES_DIR}. Please place your local images there.`);
    return;
  }
  
  console.log(`Found ${files.length} images to upload.`);

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const sku = path.parse(file).name; 

    console.log(`\nProcessing ${sku} from ${file}...`);
    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: "customerPortal"
      });
      
      console.log(`✓ Uploaded to Cloudinary: ${uploadResult.secure_url}`);

      const { data, error } = await supabase
        .from('products')
        .update({ image_url: uploadResult.secure_url })
        .eq('sku', sku);

      if (error) {
        console.error('✗ Error syncing to Supabase:', error.message);
      } else {
        console.log('✓ Successfully updated product in Supabase!');
      }
    } catch (e) {
      console.error(`✗ Failed processing ${file}:`, e);
    }
  }
  console.log('\nAll done!');
}

main();