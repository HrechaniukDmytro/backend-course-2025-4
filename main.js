const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const { XMLBuilder } = require('fast-xml-parser');

const program = new Command();
program
  .requiredOption('-i, --input <path>', 'input JSON file')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port');

program.parse(process.argv);
const options = program.opts();

async function readJsonFile(path) 
{
  const files = await fs.readdir('.');
  if (!files.includes(path)) 
  {
    console.error('Cannot find input file');
    process.exit(1);
  }

  const data = await fs.readFile(path, 'utf8');
  return JSON.parse(data);
}

const server = http.createServer(async (req, res) => 
{
  const url = new URL(req.url, `http://${options.host}:${options.port}`);
  const params = url.searchParams;

  const data = await readJsonFile(options.input);

  const minPetalLength = parseFloat(params.get('min_petal_length'));
  const includeVariety = params.get('variety') === 'true';

  let filtered = data;
  if (!isNaN(minPetalLength)) 
  {
    filtered = filtered.filter(item => item["petal.length"] > minPetalLength);
  }

  const xmlData = filtered.map(item => 
  {
    const flower = 
    {
      petal_length: item["petal.length"],
      petal_width: item["petal.width"]
    };
    if (includeVariety) flower.variety = item.variety;
    return flower;
  });

  const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
  const xmlContent = builder.build({ irises: { flower: xmlData } });

  res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
  res.end(xmlContent);
});

server.listen(options.port, options.host, () => 
{
  console.log(`Server running at http://${options.host}:${options.port}/`);
});