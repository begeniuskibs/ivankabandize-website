import type { Digest } from './types'
import { C, hund, scat } from './helpers.ts'

export const aiFoundationsWorldBank: Digest = {
  id: 'ai-foundations-world-bank',
  slug: 'ai-foundations-world-bank',
  topic: 'Development',
  color: '#1F5F6B',
  heroArt: 'models',
  title: 'Digital Progress and Trends Report 2025: Strengthening AI Foundations',
  pub: 'The World Bank',
  mins: 6,
  kick: 'Report Digest - 6 minute read, or 2 if you are busy',
  h1: 'AI is spreading. Who <em>benefits</em>?',
  lead:
    'The World Bank checked who builds and uses AI, and what countries need to benefit. Building it sits mostly in high-income countries.',
  about: {
    title: 'Digital Progress and Trends Report 2025: Strengthening AI Foundations',
    publisher: 'The World Bank',
    year: '2025',
    purpose:
      'Shows how unevenly AI is spread across countries and what low- and middle-income countries need in place to use it.',
    likelyHelps:
      'Leaders, funders, educators and policy people who work in or with lower-income countries, and anyone asking whether AI will narrow or widen the gap.',
    whyPicked:
      "A lot of the world's service and business happens where connection, computing power and skills are thin. Seeing the gap clearly helps us plan with facts.",
  },
  facts: [
    [4, 'foundations: the 4Cs'],
    [87, '% of AI models in high-income countries'],
    [27, '% online in low-income countries'],
    [5, 'GB per person in low-income countries'],
  ],
  key: [
    '87% of notable AI models and 91% of AI start-up funding sit in high-income countries',
    'Benefits depend on four foundations: connectivity, compute, context, competency',
    '"Small AI" gives lower-income countries a way in today, though its scale is limited',
  ],
  credit:
    'Digest of <b>Digital Progress and Trends Report 2025: Strengthening AI Foundations</b>. This is an adaptation of an original work by The World Bank. Views and opinions expressed in the adaptation are the sole responsibility of the author or authors of the adaptation and are not endorsed by The World Bank. Original: World Bank. 2025. Digital Progress and Trends Report 2025: Strengthening AI Foundations. Washington, DC: World Bank. doi: 10.1596/978-1-4648-2264-3. License: Creative Commons Attribution CC BY 3.0 IGO (http://creativecommons.org/licenses/by/3.0/igo). Read the original report: https://hdl.handle.net/10986/43822',
  sourceUrl: 'https://hdl.handle.net/10986/43822',
  pdfUrl: null,
  foot:
    'Digital Progress and Trends Report 2025: Strengthening AI Foundations, The World Bank, 2025. All numbers on this page come from that report.',
  pages:
    "Main Messages, plus the report's chapters on connectivity, compute, context and competency.",
  ch: [
    {
      t: 'The 2-minute version',
      l: 'Four numbers, then one sentence.',
      b: [
        {
          k: 'stats',
          items: [
            [
              '<span data-n="87">0</span>%',
              'of notable AI models come from high-income countries. They hold just 17% of the world\'s people.',
            ],
            [
              '<span data-n="27">0</span>%',
              'of people in low-income countries use the internet (2024). In high-income countries it is 93%.',
            ],
            [
              '<span data-n="50">0</span>%',
              "of the world's secure internet servers are in the United States (2024). Another 41% are in other high-income countries.",
            ],
            [
              '<span data-n="4">0</span>%',
              'of people in low-income countries have 5G coverage (2024). In high-income countries it is 84%.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'My one-line summary',
          p: 'The power to build and run AI sits in a few places. Four foundations decide who benefits: connectivity, compute, context and competency. The report warns that early advantages can lock the gap in.',
        },
      ],
    },
    {
      t: 'The gap',
      alt: true,
      l: 'Who builds AI, and who uses it.',
      b: [
        {
          k: 'story',
          n: 100,
          steps: [
            {
              k: 'Start',
              t: 'One hundred AI models',
              p: 'Picture 100 notable AI models. Where do they come from? Hold that thought, and compare it with where the world\'s people live.',
              cap: ['100 AI models', 'No order yet'],
              f: scat(C.gr),
            },
            {
              k: 'Models',
              t: '87 come from high-income countries',
              p: "High-income countries are 17% of the world's people and 64% of its economy. Yet 87 of the 100 models come from them.",
              cap: ['87%', 'of notable AI models'],
              f: hund(87, C.bl, C.gr),
            },
            {
              k: 'Start-ups',
              t: '86 of every 100 AI start-ups',
              p: 'The same group, the same pattern (as of July 2025). They also produce 54% of AI research papers and 32% of generative AI patent applications (2014 to 2023).',
              cap: ['86%', 'of AI start-ups'],
              f: hund(86, C.bl, C.gr),
            },
            {
              k: 'Funding',
              t: '91 of every 100 in venture money',
              p: 'The money follows the same line. Leaving out China and India, low- and middle-income countries are 48% of people but get under 1% of AI start-up funding.',
              cap: ['91%', 'of AI start-up funding'],
              f: hund(91, C.bl, C.gr),
            },
          ],
        },
        {
          k: 'rings',
          a: ['Outer ring: 87% of notable AI models.', 'High-income countries.', 87],
          b: ["Inner ring: 17% of the world's people.", '', 17],
          p: "High-income countries are 17% of the world's people, and they build most of the AI. Leaving out China and India, low- and middle-income countries are 48% of people and 15% of the economy, but hold 4% of AI start-ups.",
        },
        {
          k: 'hbars',
          max: 30,
          dec: 1,
          suf: '%',
          cols: [
            [
              'ChatGPT use among internet users (April 2025)',
              [
                ['High-income countries', 24],
                ['Upper-middle-income', 5.8],
                ['Lower-middle-income', 4.7],
                ['Low-income countries', 0.7],
              ],
              '#EF5B45',
            ],
          ],
          note: "More than 40% of ChatGPT's global traffic came from middle-income countries in mid-2025. The picture changes when you look at the share of internet users: use is far lower there than in high-income countries.",
        },
        {
          k: 'cards',
          items: [
            [
              'Firms are slower',
              'Even in advanced economies only about 8% of firms have deliberately adopted AI. Individual use has jumped, but firms and governments are still early.',
            ],
            [
              'Small AI',
              'Affordable AI on everyday devices gives low- and middle-income countries a way in now, though its scale is limited. Teachers, nurses and farmers use it as a coach or co-worker, not a replacement.',
            ],
          ],
        },
      ],
    },
    {
      t: 'The four foundations (the "4Cs")',
      l: "The report's main idea: AI benefits depend on four things, not one.",
      b: [
        {
          k: 'segs',
          tabs: [
            [
              'Connectivity',
              '<p>Can people get online, at a price and speed that makes AI usable? Getting online is only the first step. How well people are online, in speed, data and 5G coverage, decides how much AI they can actually use. About one third of the world\'s people are still offline.</p>',
            ],
            [
              'Compute',
              '<p>Is there computing power (chips, servers, data centres, cloud) to run AI? Compute is the fuel AI runs on, and the report calls it the new electricity. Governments face a choice: build local data centres, or rent computing power from abroad.</p>',
            ],
            [
              'Context',
              "<p>Is there data, language coverage, and local models and apps that fit people's real situations? AI learns from the data it is given, and most of that data is in English and from the rich world. Local languages, local data and open-source tools help close that gap.</p>",
            ],
            [
              'Competency',
              '<p>Do people have the skills to use, adapt and build with AI, and to stay in their own country to do it? Basic digital skills are the starting point, and advanced skills are rare everywhere. Brain drain pulls skilled people away from the places that need them.</p>',
            ],
          ],
        },
      ],
    },
    {
      t: 'Connectivity: the way in',
      alt: true,
      l: 'The gap in getting online has narrowed. The gap in how well people are online has widened.',
      b: [
        {
          k: 'cmp',
          la: 'Low-income countries',
          lb: 'High-income countries',
          max: 100,
          dec: 0,
          suf: '%',
          sub: [''],
          groups: [
            ['Internet use (2024)', [27], [93], 'NET'],
            ['5G coverage (2024)', [4], [84], '5G'],
          ],
          src: 'Share of people using the internet, and share covered by 5G, in 2024. Drag the handle to compare.',
        },
        {
          k: 'hbars',
          max: 1400,
          dec: 0,
          suf: ' GB',
          cols: [
            [
              'Data used per person (2023)',
              [
                ['High-income countries', 1400],
                ['Upper-middle-income', 400],
                ['Lower-middle-income', 100],
                ['Low-income countries', 5],
              ],
              '#232536',
            ],
          ],
          note: 'About 1,400 GB against 5 GB. This gap is widening.',
        },
        {
          k: 'cards',
          items: [
            [
              'Satellites',
              'Commercial communication satellites in orbit are 14 times more numerous than a decade ago.',
            ],
            [
              'Still offline',
              "About one third of the world's people are not online.",
            ],
          ],
        },
      ],
    },
    {
      t: 'Compute: the "new electricity"',
      l: 'Computing power is the fuel AI runs on, and who has it is very uneven.',
      b: [
        {
          k: 'hbars',
          max: 100,
          dec: 0,
          suf: '%',
          cols: [
            [
              'Secure internet servers (2024)',
              [
                ['United States', 50],
                ['Other high-income', 41],
                ['Everywhere else', 9],
              ],
              '#1F5F6B',
            ],
            [
              'Co-location data-centre capacity (June 2025)',
              [
                ['High-income countries', 77],
                ['Upper-middle-income', 18],
                ['Lower-middle-income', 5],
              ],
              '#EF5B45',
            ],
          ],
          note:
            'Low-income countries hold under 0.1% of data-centre capacity. Per person, the US has about 200 times more servers than a typical middle-income country and 20,000 times more than a low-income one.',
        },
        {
          k: 'stats',
          items: [
            [
              '<span data-n="86">0</span>%',
              'of top 500 supercomputers are in high-income countries (June 2025).',
            ],
            [
              '<span data-n="97">0</span>%',
              'of top supercomputer capacity is in high-income countries.',
            ],
            [
              '<span data-n="87">0</span>%',
              'of global cloud computing exports come from the US (2023).',
            ],
          ],
        },
        {
          k: 'note',
          h: 'The choice for governments',
          p: 'Build local data centres, or rent computing power from abroad? Local centres can bring jobs and digital independence, but need cheap reliable power and enough local demand, and can strain grids and the environment.',
        },
      ],
    },
    {
      t: 'Context: data, language and local fit',
      alt: true,
      l: 'AI is only as good as the data it learns from, and most of that data looks like the rich world.',
      b: [
        {
          k: 'hbars',
          max: 100,
          dec: 0,
          suf: '%',
          cols: [
            [
              'English online',
              [
                ["World's people who speak English", 19],
                ['Web addresses', 45],
                ['Open data sets on a leading AI platform', 56],
                ['Scientific papers (nearly)', 98],
              ],
              '#EF5B45',
            ],
            [
              'Venture money in AI training data (through 2023)',
              [
                ['United States', 56],
                ['China', 17],
                ['European Union', 15],
                ['India', 3],
                ['United Kingdom', 2],
              ],
              '#1F5F6B',
            ],
          ],
        },
        {
          k: 'cards',
          items: [
            [
              'Video and audio are a way in',
              'Only 21% of YouTube videos are in English. Hindi is about 8% and Arabic about 3%.',
            ],
            [
              'Open source helps',
              'The report says most developing countries may not need to build their own foundation models, and can adapt existing open-source platforms instead.',
            ],
          ],
        },
      ],
    },
    {
      t: 'Competency: skills and people',
      l: 'Skills decide who gets the jobs and who can adapt AI.',
      b: [
        {
          k: 'hbars',
          max: 100,
          dec: 0,
          suf: '%',
          cols: [
            [
              'Basic digital skills (2023)',
              [
                ['High-income countries', 66],
                ['Upper-middle-income', 38],
                ['Lower-middle-income', 21],
              ],
              '#232536',
            ],
          ],
          note:
            'Low-income countries: under 5%. Advanced skills are rare everywhere: under 10% in high-income, 3.5% upper-middle, 1.6% lower-middle and under 1% low-income countries.',
        },
        {
          k: 'hbars',
          max: 20,
          dec: 0,
          suf: '%',
          cols: [
            [
              'Growth in AI-skill job postings, 2021 to 2024',
              [
                ['Upper-middle-income', 16],
                ['Lower-middle-income', 11],
                ['High-income countries', 2],
              ],
              '#EF5B45',
            ],
          ],
          note:
            'Excludes generative AI. Postings for generative AI skills grew ninefold worldwide from 2022 to 2024.',
        },
        {
          k: 'cards',
          items: [
            [
              'Brain drain',
              'In Bangladesh, Lebanon, Nigeria and Ukraine, skilled people leave at three to four times the rate they arrive.',
            ],
          ],
        },
      ],
    },
    {
      t: 'What the report asks for',
      alt: true,
      l: 'The message in one frame, with the caution that comes with it.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'Invest by readiness',
              'Invest according to where each country is on the four foundations.',
            ],
            [
              'Localise',
              'Adapt and customise models to local languages, sectors and problems.',
            ],
            [
              'Act now',
              'The report calls this a defining moment: AI is reshaping which countries have a comparative advantage, in jobs and exports.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'A balanced view',
          p: 'AI can lower barriers to information and services. It can also widen inequality between and within countries. The report warns that developing economies that fall behind risk "premature de-professionalization". The long-term outcome is highly uncertain.',
        },
      ],
    },
    {
      t: 'Check yourself',
      l: 'Five quick questions.',
      b: [
        {
          k: 'quiz',
          q: [
            [
              'What share of notable AI models come from high-income countries?',
              ['47%', '67%', '87%'],
              2,
              'Also 86% of AI start-ups and 91% of AI start-up funding (as of July 2025).',
            ],
            [
              'Which of these is NOT one of the four foundations?',
              ['Connectivity', 'Capital', 'Competency'],
              1,
              'The four are connectivity, compute, context and competency.',
            ],
            [
              "Where are about half of the world's secure internet servers?",
              ['China', 'The European Union', 'The United States'],
              2,
              '50% are in the United States, 41% in other high-income countries and 9% everywhere else (2024).',
            ],
            [
              'What share of people in low-income countries had 5G coverage in 2024?',
              ['4%', '24%', '44%'],
              0,
              'Against 84% in high-income countries.',
            ],
            [
              'What does the report say about "small AI"?',
              [
                'It gives low- and middle-income countries a way in now, though its scale is potentially limited',
                'It will replace most call-centre workers',
                'It only works in high-income countries',
              ],
              0,
              'It works as a coach or co-worker, not a replacement.',
            ],
          ],
        },
      ],
    },
    {
      t: 'Jargon cards',
      b: [
        {
          k: 'jargon',
          terms: [
            {
              t: 'LIC, MIC, HIC',
              p: 'Low-, middle- and high-income countries. The World Bank\'s groups by national income. "Upper-middle" and "lower-middle" split the middle group.',
            },
            {
              t: 'Compute',
              p: 'The processing power (chips, servers, data centres) AI needs to be trained and used.',
            },
            {
              t: 'Generative AI',
              p: 'AI that creates new text, images, audio, video or code instead of only analysing data.',
            },
            {
              t: 'Small AI',
              p: 'Affordable AI that runs on everyday devices and fits local needs.',
            },
            {
              t: 'Open-source AI',
              p: 'AI models whose code or weights are shared so others can adapt them.',
            },
            {
              t: 'Co-location data centre',
              p: 'A commercial facility where many customers rent space and power to run their own servers.',
            },
            {
              t: 'Brain drain',
              p: 'Skilled people leaving their country for work elsewhere.',
            },
          ],
        },
      ],
    },
    {
      t: 'My Summarized Take',
      approved: true,
      b: [
        {
          k: 'take',
          approved: true,
          paras: [
            'The numbers are not an argument for despair. They show where help is most useful: connection, power, local data and skills. Each of the four foundations is something a country, a funder or a partner can invest in, one step at a time.',
            'Small AI matters most for people serving in places with thin infrastructure, because it works with what they have today. A teacher, a nurse or a farmer does not need a data centre to get a coach or a co-worker.',
            'Whoever is not at the table when AI tools are built gets tools that do not fit them. Language and context are part of fairness. That is why local data, local languages and local skills matter as much as the cables and the chips.',
          ],
        },
      ],
    },
  ],
}
