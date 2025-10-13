import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get batch size and offset from query params (default: 10 templates at a time)
    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get('batch_size') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch templates with pagination to avoid timeouts
    const { data: templates, error: fetchError } = await supabase
      .schema('app')
      .from('templates')
      .select('id, name, category, active')
      .range(offset, offset + batchSize - 1);

    if (fetchError) throw fetchError;

    console.log(`Processing batch: ${offset}-${offset + batchSize - 1}, found ${templates?.length || 0} templates`);

    const results = [];

    for (const template of templates || []) {
      try {
        console.log(`Generating image for template: ${template.name} (${template.id})`);

        // Generate image prompt based on template name and category
        const prompt = `Create a professional, cinematic movie poster style image for a video template called "${template.name}". 
Category: ${template.category}. 
Style: Netflix-quality, 16:9 aspect ratio, dramatic lighting, high production value, vibrant colors.
The image should represent the theme and feel of ${template.name} in a visually appealing way.
Make it look like a professional movie or video production thumbnail.`;

        // Call Lovable AI Gateway to generate image
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          throw new Error(`AI generation failed: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          throw new Error('No image generated');
        }

        console.log(`Image generated, uploading to storage...`);

        // Convert base64 to blob
        const base64Data = imageUrl.split(',')[1];
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage bucket
        const filePath = `templates/${template.id}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('template-images')
          .upload(filePath, imageBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        console.log(`✓ Successfully generated and uploaded image for ${template.name}`);
        
        results.push({
          template_id: template.id,
          template_name: template.name,
          success: true,
          path: filePath
        });

      } catch (templateError) {
        console.error(`✗ Failed for template ${template.name}:`, templateError);
        results.push({
          template_id: template.id,
          template_name: template.name,
          success: false,
          error: templateError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Check if there might be more templates to process
    const hasMore = templates?.length === batchSize;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${templates?.length || 0} templates: ${successCount} succeeded, ${failCount} failed`,
        batch_info: {
          offset,
          batch_size: batchSize,
          processed: templates?.length || 0,
          has_more: hasMore,
          next_offset: hasMore ? offset + batchSize : null
        },
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
