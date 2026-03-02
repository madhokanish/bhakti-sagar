import http from 'node:http';

const responses = {
  krishna: 'I am an AI guide inspired by Shri Krishna. Act with clarity, duty, and compassion. What challenge are you facing right now?',
  lakshmi: 'I am an AI guide inspired by Lakshmi Ji. Let us balance gratitude, discipline, and abundance. What area of life needs order today?',
  shani: 'I am an AI guide inspired by Shani Dev. Focus on honesty, patience, and consistent effort. Which habit do you want to strengthen?'
};

const safeTail = ' I cannot provide medical or legal advice. For serious concerns, consult a qualified professional.';

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const payload = JSON.parse(body || '{}');
    const guideId = payload.guideId || 'krishna';
    const text = (responses[guideId] || responses.krishna) + safeTail;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const tokens = text.split(' ');
    let index = 0;
    const timer = setInterval(() => {
      if (index >= tokens.length) {
        res.write('data: [DONE]\n\n');
        clearInterval(timer);
        res.end();
        return;
      }
      res.write(`data: ${tokens[index]}${index === tokens.length - 1 ? '' : ' '}\n\n`);
      index += 1;
    }, 45);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(8787, () => {
  console.log('Mock backend listening on http://localhost:8787');
});
