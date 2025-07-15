console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { MongoClient } from 'mongodb';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Use Hugging Face Inference API for summarization with JSON check and short summary
async function getSummaryWithHuggingFace(text) {
  const res = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        max_length: 60,
        min_length: 15
      }
    })
  });
  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('Hugging Face API did not return JSON. Response: ' + rawText);
  }
  if (Array.isArray(data) && data[0]?.summary_text) {
    return data[0].summary_text;
  } else if (data.error) {
    throw new Error('Hugging Face API error: ' + data.error);
  } else {
    throw new Error('Unexpected Hugging Face API response: ' + rawText);
  }
}

// Use MyMemory API for Urdu translation with JSON check
async function translateToUrdu(text) {
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ur`);
  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('Translation API did not return JSON. Response: ' + rawText);
  }
  if (!data.responseData || !data.responseData.translatedText) {
    throw new Error('Translation API error: ' + (data.responseDetails || 'Unknown error'));
  }
  return data.responseData.translatedText;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, paragraph } = body;

    if (!url && !paragraph) {
      return NextResponse.json({ error: 'No URL or paragraph provided' }, { status: 400 });
    }

    // If paragraph is provided, summarise and translate directly
    if (paragraph) {
      let summary;
      try {
        summary = await getSummaryWithHuggingFace(paragraph);
      } catch (err) {
        summary = paragraph;
      }
      let textToTranslate = summary.length > 500 ? summary.slice(0, 500) : summary;
      let summaryUrdu;
      try {
        summaryUrdu = await translateToUrdu(textToTranslate);
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      // Save summary in Supabase
      try {
        await supabase.from('summaries').insert([{ url: 'manual-input', summary, summary_urdu: summaryUrdu }]);
      } catch (err) {
        return NextResponse.json({ error: 'Failed to save summary in Supabase' }, { status: 500 });
      }
      // Save full text in MongoDB
      try {
        await mongoClient.connect();
        const db = mongoClient.db('blog_summariser');
        const collection = db.collection('blogs');
        await collection.insertOne({ url: 'manual-input', text: paragraph, created_at: new Date() });
        await mongoClient.close();
      } catch (err) {
        return NextResponse.json({ error: 'Failed to save full text in MongoDB' }, { status: 500 });
      }
      return NextResponse.json({ summary, summaryUrdu });
    }

    // If URL is provided, keep existing logic
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

    // Fetch and scrape blog text with User-Agent header
    let res, html;
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlogSummariser/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch blog URL (status ${res.status})` }, { status: 400 });
      }
      html = await res.text();
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch blog URL. The site may be blocking bots or require login.' }, { status: 400 });
    }

    // Improved scraping logic for Wikipedia and similar sites
    let $ = cheerio.load(html);
    // Get all main paragraphs from Wikipedia articles
    let paragraphs = $('#mw-content-text > .mw-parser-output > p').map((i, el) => $(el).text()).get();
    let text = paragraphs.join(' '); // Join all paragraphs
    if (!text || text.length < 30) text = $('#mw-content-text').text();
    if (!text || text.length < 30) text = $('article').text();
    if (!text || text.length < 30) text = $('[class*=content], [class*=body], [id*=content], [id*=body]').text();
    if (!text || text.length < 30) text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length > 2000) text = text.slice(0, 2000); // Still limit to 2000 chars for performance
    if (!text || text.length < 30) return NextResponse.json({ error: 'Could not extract blog text. The site may be protected or not a blog.' }, { status: 400 });

    let summary;
    try {
      summary = await getSummaryWithHuggingFace(text);
    } catch (err) {
      // If the model fails, just use the original text as the summary
      summary = text;
    }

    // Truncate summary to 500 characters for translation API
    let textToTranslate = summary;
    if (summary.length > 500) {
      textToTranslate = summary.slice(0, 500);
    }
    let summaryUrdu;
    try {
      summaryUrdu = await translateToUrdu(textToTranslate);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Save summary in Supabase
    try {
      await supabase.from('summaries').insert([{ url, summary, summary_urdu: summaryUrdu }]);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to save summary in Supabase' }, { status: 500 });
    }

    // Save full text in MongoDB
    try {
      await mongoClient.connect();
      const db = mongoClient.db('blog_summariser');
      const collection = db.collection('blogs');
      await collection.insertOne({ url, text, created_at: new Date() });
      await mongoClient.close();
    } catch (err) {
      return NextResponse.json({ error: 'Failed to save full text in MongoDB' }, { status: 500 });
    }

    return NextResponse.json({ summary, summaryUrdu });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}