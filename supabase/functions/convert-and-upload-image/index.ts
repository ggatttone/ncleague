import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// These secrets must be set by the user in the Supabase Dashboard
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

// Helper function to generate SHA-1 hash
async function sha1(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Check for Cloudinary configuration
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary environment variables are not set. Please configure them in Supabase secrets.');
    }

    // 2. Parse the multipart form data to get the file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucketName') as string;

    if (!file) throw new Error('No file provided.');
    if (!bucketName) throw new Error('No bucket name provided.');

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    
    let imageBuffer: ArrayBuffer;
    let contentType = file.type;
    let fileExt = file.name.split('.').pop()?.toLowerCase() || '';

    if (isHeic) {
      // 3. Prepare parameters for Cloudinary upload
      const timestamp = Math.round((new Date()).getTime() / 1000);
      const paramsToSign = {
        format: 'jpg',
        timestamp: timestamp.toString(),
      };

      // 4. Generate the signature required by Cloudinary by sorting parameters
      const signatureString = Object.keys(paramsToSign)
        .sort()
        .map(key => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
        .join('&') + CLOUDINARY_API_SECRET;
      
      const signature = await sha1(signatureString);

      // 5. Create form data for the Cloudinary request
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY!);
      cloudinaryFormData.append('timestamp', paramsToSign.timestamp);
      cloudinaryFormData.append('signature', signature);
      cloudinaryFormData.append('format', paramsToSign.format);

      // 6. Upload the HEIC file to Cloudinary for conversion
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      const cloudinaryResponse = await fetch(cloudinaryUrl, { method: 'POST', body: cloudinaryFormData });

      if (!cloudinaryResponse.ok) {
        const errorText = await cloudinaryResponse.text();
        throw new Error(`Cloudinary upload failed: ${errorText}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const convertedImageUrl = cloudinaryData.secure_url;

      // 7. Download the converted JPEG from Cloudinary
      const imageResponse = await fetch(convertedImageUrl);
      if (!imageResponse.ok) throw new Error('Failed to download converted image from Cloudinary.');
      
      imageBuffer = await imageResponse.arrayBuffer();
      contentType = 'image/jpeg';
      fileExt = 'jpg';

    } else {
      // For non-HEIC files, just get the buffer directly
      imageBuffer = await file.arrayBuffer();
    }

    // 8. Upload the final image buffer to Supabase Storage
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabaseAdminClient.storage
      .from(bucketName)
      .upload(filePath, imageBuffer, { contentType });

    if (uploadError) throw uploadError;

    // 9. Get the public URL from Supabase and return it along with the path
    const { data: { publicUrl } } = supabaseAdminClient.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return new Response(JSON.stringify({ publicUrl, filePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})