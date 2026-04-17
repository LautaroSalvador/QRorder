import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rpvaylebnkvttfbhxaip.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdmF5bGVibmt2dHRmYmh4YWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3Mzk2OCwiZXhwIjoyMDkxNzQ5OTY4fQ.rZ2RhRoeQtmRG7Yu6OAM4dGRf9OMmXdl6JH8d8WKnF0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: menuItems, error } = await supabase.from('menu_items').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const item of menuItems) {
    let url = null;
    const n = item.name.toLowerCase();
    
    // Asignación manual diversa y de altísima calidad desde respositorio Unsplash.
    if (n.includes('gaseosa')) url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=400&fit=crop';
    else if (n.includes('vermú')) url = 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600&h=400&fit=crop';
    else if (n.includes('gin tonic')) url = 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop';
    else if (n.includes('aperitivo')) url = 'https://images.unsplash.com/photo-1514361892605-0f00bb90c125?w=600&h=400&fit=crop';
    else if (n.includes('cheesecake')) url = 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=400&fit=crop';
    else if (n.includes('brownie')) url = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop';
    else if (n.includes('flan')) url = 'https://images.unsplash.com/photo-1616428781449-361c4bb7c406?w=600&h=400&fit=crop';
    else if (n.includes('rabas')) url = 'https://images.unsplash.com/photo-1599487405445-56041ec1a9ad?w=600&h=400&fit=crop';
    else if (n.includes('provoleta')) url = 'https://images.unsplash.com/photo-1619894982635-430b8dced490?w=600&h=400&fit=crop';
    else if (n.includes('croquetas')) url = 'https://images.unsplash.com/photo-1534422298391-e4f8c97104d0?w=600&h=400&fit=crop';
    else if (n.includes('scottish') || n.includes('roja')) url = 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop';
    else if (n.includes('ipa') || n.includes('pinta')) url = 'https://images.unsplash.com/photo-1625860555365-d053eb813ec7?w=600&h=400&fit=crop';
    else if (n.includes('sorrentinos')) url = 'https://images.unsplash.com/photo-1551183053-ec9cf4315357?w=600&h=400&fit=crop';
    else if (n.includes('bondiola')) url = 'https://images.unsplash.com/photo-1550547660-d33e11f040f6?w=600&h=400&fit=crop';
    else if (n.includes('milanesa')) url = 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop';
    else if (n.includes('pomelada') || n.includes('limonada')) url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=400&fit=crop';
    else if (n.includes('agua')) url = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&h=400&fit=crop';
    else url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop'; // Default Food

    const { error: updateError } = await supabase.from('menu_items').update({ image_url: url }).eq('id', item.id);
    if (updateError) {
       console.error("Error updating", item.name, updateError);
    } else {
       console.log(`Updated ${item.name} with ${url}`);
    }
  }
  console.log("Done!");
}
run();
