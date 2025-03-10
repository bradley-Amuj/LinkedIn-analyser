import { OpenAI } from 'openai';
import csv from 'csv-parse/sync';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const fileContent = await file.text();
    
    // Parse CSV data
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Process the data for visualizations
    const processedData = {
      connectionGrowth: processConnectionGrowth(records),
      countries: processCountries(records),
      roles: processRoles(records),
      industries: processIndustries(records),
    };

    // Get AI insights
    const insights = await generateInsights(records);

    return Response.json({
      ...processedData,
      insights
    });
  } catch (error) {
    console.error('Network analysis error:', error);
    return Response.json({ error: 'Failed to analyze network data' }, { status: 500 });
  }
}

function processConnectionGrowth(records) {
  // Group connections by month and count
  const monthlyConnections = records.reduce((acc, record) => {
    const date = new Date(record.connectedOn);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(monthlyConnections)
    .map(([month, connections]) => ({ month, connections }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function processCountries(records) {
  return aggregateAndSort(records, 'country');
}

function processRoles(records) {
  return aggregateAndSort(records, 'position');
}

function processIndustries(records) {
  return aggregateAndSort(records, 'industry');
}

function aggregateAndSort(records, field) {
  const counts = records.reduce((acc, record) => {
    const value = record[field] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 for each category
}

async function generateInsights(records) {
  const prompt = `Analyze this LinkedIn network data and provide 3-5 key insights about:
  1. Network composition
  2. Growth patterns
  3. Industry distribution
  4. Potential opportunities for networking
  
  Data summary:
  ${JSON.stringify(records.slice(0, 10))}
  ...and ${records.length - 10} more connections`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0].message.content
    .split('\n')
    .filter(line => line.trim().length > 0);
} 