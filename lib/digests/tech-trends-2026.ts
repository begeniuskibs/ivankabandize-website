import type { Digest } from './types'
import { C, rnd } from './helpers'

export const MK = [
  'Agentic software development',
  'Agentic AI',
  'AI for scientific discovery and engineering',
  'AI infrastructure and model architectures',
  'Application-specific semiconductors',
  'Cybersecurity and trustworthy systems',
  'Advanced connectivity',
  'Immersive-reality technologies',
  'Quantum technologies',
  'Future of robotics',
  'Future of mobility',
  'Future of space technologies',
  'Future of life sciences and bioengineering',
  'Future of energy and sustainability technologies',
]

export const MKA = [3, 3, 2, 4, 4, 4, 4, 2, 2, 2, 3, 2, 4, 4]
export const MKX = [12.8, 1.4, 3.2, 5.3, 1.1, 1.6, 1.0, 1.9, 1.2, 2.1, 1.2, 12.1, 1.3, 1.3]
export const fam = (i: number) => (i < 4 ? C.co : i < 9 ? C.bl : C.gn)
export const lab = (i: number) => String(i + 1).padStart(2, '0')

export const techTrends2026: Digest = {
  id: 'tech-trends-2026',
  slug: 'tech-trends-2026',
  topic: 'Technology',
  color: '#1F4E5F',
  heroArt: 'trends',
  title: 'Technology Trends Outlook 2026',
  pub: 'McKinsey & Company',
  mins: 10,
  kick: 'Report Digest - 10 minute read, or 2 if you are busy',
  h1: 'Technology has left the <em>screen</em>.',
  lead:
    "McKinsey's sixth yearly outlook covers 14 technology trends across 143 pages. The big idea this year: the action has moved into chips, power grids, robots and rockets. Here is what a busy leader needs from it.",
  about: {
    title: 'Technology Trends Outlook 2026',
    publisher: 'McKinsey & Company',
    year: '2026',
    purpose: 'Maps the 14 technology trends shaping business and how fast each is being adopted.',
    likelyHelps:
      'People who set direction for organisations, plan budgets and investments, or want to know where technology is heading.',
    whyPicked:
      'I love seeing the whole system at once. When decision makers can tell real momentum from hype, they spend their attention and resources where it counts.',
  },
  facts: [
    [14, 'trends tracked'],
    [4, 'are AI-specific'],
    [5, 'on pace to double investment'],
    [6, 'measures per trend'],
  ],
  key: [
    '14 trends, 4 of them AI',
    '5 trends doubling investment',
    'About $194 billion into energy tech in 2025',
  ],
  credit:
    'Digest of <b>Technology Trends Outlook 2026</b> (sixth edition, September 2026) by Michael Chui, Roger Roberts and Tanguy Catlin, McKinsey & Company. The findings and numbers are theirs. The summary and the opinions are mine.',
  sourceUrl: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-top-trends-in-tech',
  pdfUrl: null,
  ch: [
    {
      t: 'The 2-minute version',
      l: 'Four numbers, then one sentence.',
      b: [
        {
          k: 'stats',
          items: [
            [
              '<span data-n="14">0</span>',
              "Technology trends in this year's outlook. Four are about AI itself, and the report says AI also speeds up the other ten.",
            ],
            [
              '$<span data-n="194">0</span><small>bn</small>',
              'Invested in energy and sustainability technologies in 2025, the highest of any trend that year. AI needs power to grow.',
            ],
            [
              '<span data-n="5">0</span>',
              'Trends on pace to at least double their investment in 2026 compared with 2025.',
            ],
            [
              '<span data-n="75">0</span>%<small>+</small>',
              'More than three-quarters of cybersecurity vulnerabilities are now "zero day": an attack exists by the time the flaw is made public.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'My one-line summary',
          p: 'The question is no longer only "what can the technology do?" It is "who can build the hardware, find the power and train the people to use it?"',
        },
      ],
    },
    {
      t: 'Fourteen trends in one picture',
      l: 'Scroll slowly. The same 14 dots sort themselves three different ways. The numbers match the list underneath.',
      b: [
        {
          k: 'story',
          n: 14,
          legend: MK.map((m, i) => lab(i) + ' ' + m),
          steps: [
            {
              k: 'Start',
              t: 'Fourteen things to keep up with',
              p: 'Robots, quantum, space, energy, agents. Read as a list, it is overwhelming. So let us sort it.',
              cap: ['14 trends', 'No order yet'],
              f: (_s, i) => ({
                x: 12 + rnd(i + 3) * 76,
                y: 12 + rnd(i + 90) * 58,
                c: C.gr,
                s: 9,
                t: lab(i),
              }),
            },
            {
              k: 'Sort 1',
              t: 'Three families',
              p: 'The report groups them: the AI revolution (4 trends, coral), compute and connectivity frontiers (5, blue) and cutting-edge engineering (5, green).',
              cap: ['3 families', 'AI, compute, engineering'],
              f: (_s, i) => {
                const r = i < 4 ? 0 : i < 9 ? 1 : 2
                const k = i < 4 ? i : i < 9 ? i - 4 : i - 9
                const n = r ? 5 : 4
                return {
                  x: 50 + (k - (n - 1) / 2) * 16,
                  y: 18 + r * 24,
                  c: fam(i),
                  s: 10,
                  t: lab(i),
                }
              },
            },
            {
              k: 'Sort 2',
              t: 'How far along is each one?',
              p: 'McKinsey scores adoption from 1 (frontier) to 5 (fully scaled). Five trends are still experiments (2), three are in pilots (3) and six are scaling (4). None scores a 5.',
              cap: ['Adoption', 'Left: experimenting. Middle: piloting. Right: scaling'],
              f: (_s, i) => {
                const a = MKA[i]
                const k = MKA.slice(0, i).filter((x) => x === a).length
                return {
                  x: a === 2 ? 20 : a === 3 ? 50 : 80,
                  y: 12 + k * 11,
                  c: fam(i),
                  s: 9,
                  t: lab(i),
                }
              },
            },
            {
              k: 'Sort 3',
              t: 'Where the money is rushing',
              p: 'Five trends are on pace to at least double their investment this year: agentic software development (12.8 times), space (12.1), AI infrastructure (5.3), AI for science (3.2) and robotics (2.1). One caution from the report: a single $60 billion deal drives most of the first number.',
              cap: ['5 of 14', 'on pace to at least double investment'],
              f: (_s, i) => {
                const big = [0, 11, 3, 2, 9]
                const b = big.indexOf(i)
                const sm = [1, 4, 5, 6, 7, 8, 10, 12, 13].indexOf(i)
                return b >= 0
                  ? {
                      x: 16 + b * 17,
                      y: 32,
                      c: fam(i),
                      s: [19, 18, 14, 12, 10.5][b],
                      t: lab(i),
                    }
                  : {
                      x: 10 + sm * 10,
                      y: 66,
                      c: C.gr,
                      s: 6.5,
                      t: lab(i),
                      o: 0.7,
                    }
              },
            },
          ],
        },
      ],
    },
    {
      t: 'Follow the money',
      alt: true,
      l: "Drag the handle. On the left, each trend's 2025 investment is set to 1. On the right, where 2026 is heading if the first half of the year continues.",
      b: [
        {
          k: 'cmp',
          la: '2025 investment (set to 1)',
          lb: '2026, extrapolated',
          max: 13,
          dec: 1,
          suf: 'x',
          sub: [''],
          groups: [
            ['Agentic software', [1], [12.8], 'AGS'],
            ['Space', [1], [12.1], 'SPC'],
            ['AI infrastructure', [1], [5.3], 'INF'],
            ['AI for science', [1], [3.2], 'SCI'],
            ['Robotics', [1], [2.1], 'ROB'],
          ],
          src: "Multiple of 2025 equity investment, from the report's Exhibit 1. McKinsey extrapolates from deals up to 30 June 2026 and warns these are directional estimates that very large deals can skew.",
        },
        {
          k: 'stats',
          items: [
            [
              '$<span data-n="145">0</span><small>bn</small>',
              'Equity investment in AI infrastructure and model architectures in 2025.',
            ],
            [
              '$<span data-n="384">0</span><small>bn</small>',
              'The same trend by mid-2026, the largest of any trend.',
            ],
          ],
        },
      ],
    },
    {
      t: 'How mature is each trend?',
      l: "Adoption score, from 1 (frontier innovation) to 5 (fully scaled), based on McKinsey's expert interviews.",
      b: [
        {
          k: 'hbars',
          max: 5,
          dec: 0,
          cols: [
            [
              'Scaling (score 4 of 5)',
              [
                ['AI infrastructure', 4],
                ['Custom semiconductors', 4],
                ['Cybersecurity', 4],
                ['Advanced connectivity', 4],
                ['Life sciences & bio', 4],
                ['Energy technologies', 4],
              ],
              'var(--good)',
            ],
            [
              'Piloting or experimenting (scores 2 and 3)',
              [
                ['Agentic software', 3],
                ['Agentic AI', 3],
                ['Future of mobility', 3],
                ['AI for science', 2],
                ['Immersive reality', 2],
                ['Quantum tech', 2],
                ['Robotics', 2],
                ['Space tech', 2],
              ],
              'var(--coral)',
            ],
          ],
          note: 'Notice which side generative AI sits on. The infrastructure scores 4. The applications, like agentic software and robotics, score 2 and 3.',
        },
      ],
    },
    {
      t: 'Five themes that run through all 14',
      alt: true,
      l: 'Rather than trying to master all 14 trends, watch the five themes that connect them.',
      b: [
        {
          k: 'cards',
          items: [
            [
              '1. The physical bottleneck',
              'Energy, chips and data centre land are the limits on AI growth, not algorithm ideas.',
            ],
            [
              '2. Autonomous agents are slow to deploy',
              'Prototypes appear quickly. Testing, review and approval still take human time.',
            ],
            [
              '3. The cyber defence window has shrunk',
              'Defenders used to have days or weeks. AI helps both sides move faster, so that buffer is largely gone.',
            ],
            [
              '4. Chips and software are designed together',
              'The biggest AI companies now co-design custom chips for their own models, to get more output per watt.',
            ],
            [
              '5. AI is hungry and the grid is not ready',
              'Data centres can be built faster than the power lines and transformers needed to feed them.',
            ],
          ],
        },
      ],
    },
    {
      t: 'The power problem',
      l: 'This was the part I did not expect in a technology report. The limit on AI is becoming electricity.',
      b: [
        {
          k: 'stats',
          items: [
            [
              '<span data-n="2500">0</span><small>GW</small>',
              'Of energy projects stalled in grid queues worldwide, waiting for a connection.',
            ],
            [
              '<span data-n="2">0</span><small>+ years</small>',
              'Lead time for transformers in many markets.',
            ],
            [
              '<span data-n="2030">0</span>',
              'The year US data centres running AI are projected to use as much electricity as California does today.',
            ],
          ],
        },
      ],
    },
    {
      t: 'What this means for you',
      l: 'Choose the hat you wear most.',
      b: [
        {
          k: 'roles',
          roles: {
            Founder: [
              'Do not chase all 14. Pick the one or two that touch your customers this year.',
              'Watch adoption scores, not headlines. A score of 4 means you can buy it. A score of 2 means you would be the experiment.',
              'Ask your cloud and software suppliers how they are handling security now that attacks move this fast.',
            ],
            'Church or nonprofit leader': [
              'Most of this report is not your fight. Agents and cybersecurity are. Start there.',
              'Reliable power and connectivity are still the first technology decisions in our context.',
              'Budget for training people, not only for tools. The report keeps returning to the skilled workforce.',
            ],
            'Team leader': [
              'Try one agent on one repeatable task this quarter, with a person reviewing the result.',
              'Expect more output than your team can check. Decide now what must always be reviewed by a human.',
              'Turn on two-step sign-in everywhere. It is the cheapest answer to theme 3.',
            ],
            Student: [
              'The jobs growing fastest in the AI trends are still research-heavy. Depth matters.',
              'Energy, connectivity and life sciences are hiring for operations and sales, not only for scientists.',
              'Learn to work alongside agents now. It will be assumed by the time you graduate.',
            ],
          },
        },
      ],
    },
    {
      t: 'The jargon, in plain words',
      l: 'Tap a card to flip it.',
      b: [
        {
          k: 'jargon',
          terms: [
            {
              t: 'Agentic AI',
              p: 'AI that does not just answer questions but plans steps, uses tools and finishes tasks on its own.',
            },
            {
              t: 'AI infrastructure',
              p: 'The chips, data centres and power supply that AI runs on.',
            },
            {
              t: 'Zero-day',
              p: 'A security flaw that attackers use before, or as, its maker finds out. There are zero days to fix it.',
            },
            {
              t: 'Grid queue',
              p: 'The waiting list of power projects that want to connect to the electricity grid. Over 2,500 GW are stuck in it.',
            },
            {
              t: 'Gigawatt (GW)',
              p: 'A billion watts of power. One large power station is around one gigawatt.',
            },
            {
              t: 'Transformer',
              p: 'Here it means electrical equipment that changes voltage so power can travel on the grid. It is not the AI kind. Waits can top two years.',
            },
            {
              t: 'Investment multiple',
              p: "How many times bigger a trend's investment grows. 2x means doubled. The five fastest trends are on pace for at least that.",
            },
            {
              t: 'AI for science',
              p: 'Using AI to speed up scientific research and discovery.',
            },
          ],
        },
      ],
    },
    {
      t: 'Check yourself',
      alt: true,
      l: 'Five quick questions.',
      b: [
        {
          k: 'quiz',
          q: [
            [
              'How many technology trends does the 2026 outlook cover?',
              ['10', '14', '20'],
              1,
              'Fourteen, grouped into three families.',
            ],
            [
              'Which trend drew the most investment in 2025?',
              ['Quantum technologies', 'Energy and sustainability technologies', 'Immersive reality'],
              1,
              'Over $194 billion, the highest of any trend that year.',
            ],
            [
              'What does "zero day" mean here?',
              [
                'A flaw with an attack ready by the time it is disclosed',
                'A product launched with no bugs',
                'A system with no downtime',
              ],
              0,
              'More than three-quarters of vulnerabilities are now in this group.',
            ],
            [
              'What is holding back AI data centres most, according to the report?',
              ['A shortage of ideas', 'Power and grid connections', 'A lack of investors'],
              1,
              'Data centres can be built faster than the grid that feeds them.',
            ],
            [
              'Which of these has the higher adoption score?',
              ['Quantum technologies', 'Advanced connectivity', 'Future of robotics'],
              1,
              'Connectivity scores 4. Quantum and robotics score 2.',
            ],
          ],
        },
      ],
    },
    {
      t: 'My Summarized Take',
      approved: true,
      b: [
        {
          k: 'copy',
          h: 'Try this today',
          p: 'Paste this into your AI assistant with a short description of your organisation.',
          text: "Here are McKinsey's 14 technology trends for 2026. For an organisation like mine, tell me which 2 matter this year, which 3 to watch, and which to ignore for now. Explain each choice in one plain sentence.",
        },
        {
          k: 'take',
          approved: true,
          paras: [
            'I read reports like this with one question: what should a leader with a small team and a real budget actually do on Monday?',
            'My answer from this one is simple. Do the boring things first. Secure your accounts. Make sure your power and internet hold. Then give one agent one job and watch it closely.',
            'The report is honest that most of these trends are still experiments. That is freeing. You are not behind.',
            'Stewardship applies to attention too. Fourteen trends do not deserve fourteen equal shares of your mind.',
          ],
        },
      ],
    },
  ],
  foot:
    'Technology Trends Outlook 2026, sixth edition, September 2026. Michael Chui, Roger Roberts and Tanguy Catlin, McKinsey & Company. All numbers on this page come from that report.',
  pages:
    "14 trends and 4 AI-specific (report p.2), $194 billion energy (p.132), five trends doubling and multiples (Exhibit 1, p.6), zero-day share, 2,500 GW, transformer lead times and California comparison (p.5), $145 billion and $384 billion (p.41), adoption scores (each trend's scorecard page).",
}
