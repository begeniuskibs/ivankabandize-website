import type { Digest } from './types'

export const aiFoundationsWorldBank: Digest = {
  id: 'ai-foundations-world-bank',
  slug: 'ai-foundations-world-bank',
  topic: 'Development',
  color: '#1F5F6B',
  heroArt: 'models',
  title: 'Digital Progress and Trends Report 2025: Strengthening AI Foundations',
  pub: 'The World Bank',
  mins: 9,
  kick: 'Report Digest - 9 minute read, or 2 if you are busy',
  h1: 'AI is spreading fast. Who is actually getting the <em>benefit</em>?',
  lead:
    'The World Bank looked at who builds AI, who uses it, and what a country needs in place before it can benefit. The short answer: building AI and the computing power behind it are heavily concentrated in rich countries, and benefits hinge on four foundations. Here is the short version.',
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
    [4, 'foundations (the "4Cs")'],
    [87, '% of notable AI models come from high-income countries'],
    [27, '% internet use in low-income countries (2024), against 93% in high-income'],
    [5, 'GB of data per person in low-income countries (2023), against 1,400 GB in high-income'],
  ],
  key: [
    'High-income countries hold 87% of notable AI models and 91% of AI start-up funding',
    'Benefits hinge on four foundations: connectivity, compute, context, competency',
    '"Small AI" - affordable AI on everyday devices - gives low- and middle-income countries a way in today, though its scale is limited',
  ],
  credit:
    'Digest of <b>Digital Progress and Trends Report 2025: Strengthening AI Foundations</b>. This is an adaptation of an original work by The World Bank. Views and opinions expressed in the adaptation are the sole responsibility of the author or authors of the adaptation and are not endorsed by The World Bank. Original: World Bank. 2025. Digital Progress and Trends Report 2025: Strengthening AI Foundations. Washington, DC: World Bank. doi: 10.1596/978-1-4648-2264-3. License: Creative Commons Attribution CC BY 3.0 IGO (http://creativecommons.org/licenses/by/3.0/igo). Read the original report: https://hdl.handle.net/10986/43822',
  sourceUrl: 'https://hdl.handle.net/10986/43822',
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
              '<span data-n="87">0</span>%',
              "Share of notable AI models from high-income countries, which hold 17% of the world's people.",
            ],
            [
              '<span data-n="93">0</span>% <small>vs</small> <span data-n="27">0</span>%',
              'Share of people using the internet in high-income countries against low-income countries (2024).',
            ],
            [
              '<span data-n="50">0</span>%',
              "Share of the world's secure internet servers in the United States alone (2024).",
            ],
            [
              '<span data-n="66">0</span>% <small>vs under</small> <span data-n="5">0</span>%',
              'Share of people with basic digital skills in high-income against low-income countries (2023).',
            ],
          ],
        },
        {
          k: 'note',
          h: 'My one-line summary',
          p: 'AI is arriving everywhere, but the ability to build it, run it and use it well is concentrated in a few places. The report says the outcome hinges on four foundations countries can invest in, and it also warns that early scale advantages can lock the gap in.',
        },
      ],
    },
    {
      t: 'The Gap',
      alt: true,
      l: 'Who builds AI, and who uses it.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'Who builds it',
              'High-income countries account for 87% of notable AI models, 86% of AI start-ups and 91% of the venture money that has gone into AI start-ups (as of July 2025). They also produce 54% of AI research papers and 32% of generative AI patent applications (2014 to 2023).',
            ],
            [
              'What that looks like next to population',
              "High-income countries are 17% of the world's people and 64% of its economy. Leaving out China and India, low- and middle-income countries are 48% of people and 15% of the economy, but hold 4% of AI start-ups and under 1% of AI start-up funding.",
            ],
            [
              'Who uses it',
              "More than 40% of ChatGPT's global traffic came from middle-income countries in mid-2025. The picture is different when you look at the share of internet users who used ChatGPT: 24% in high-income countries, 5.8% in upper-middle, 4.7% in lower-middle and 0.7% in low-income countries (April 2025).",
            ],
            [
              'Business and government are slower than individuals',
              'Individual use has jumped, but firms and governments are still early. Even in advanced economies only about 8% of firms have deliberately adopted AI.',
            ],
          ],
        },
        {
          k: 'hbars',
          max: 30,
          dec: 1,
          suf: '%',
          cols: [
            [
              'ChatGPT use among internet users by income group',
              [
                ['High-income countries', 24],
                ['Upper-middle-income', 5.8],
                ['Lower-middle-income', 4.7],
                ['Low-income countries', 0.7],
              ],
              '#1F5F6B',
            ],
          ],
          note: 'Share of internet users who used ChatGPT (April 2025).',
        },
        {
          k: 'note',
          h: 'Small AI',
          p: 'The report points to "small AI": affordable AI designed for everyday devices, as a way for low- and middle-income countries to get a real benefit now. It also says its scale is potentially limited. Teachers using it for lesson planning, nurses for patient tracking, call-centre staff for coaching and farmers for farming advice are examples from countries including Brazil, Egypt, India, Nigeria, the Philippines and Uzbekistan. In these cases AI acts as a coach or co-worker, not a replacement.',
        },
      ],
    },
    {
      t: 'The Four Foundations (The "4Cs")',
      l: "The report's main idea: AI benefits depend on four things, not one.",
      b: [
        {
          k: 'cards',
          items: [
            [
              'Connectivity',
              'Can people get online, at a price and speed that makes AI usable?',
            ],
            [
              'Compute',
              'Is there computing power (chips, servers, data centres, cloud) to run AI?',
            ],
            [
              'Context',
              "Is there data, language coverage, and local models and apps that fit people's real situations?",
            ],
            [
              'Competency',
              'Do people have the skills to use, adapt and build with AI, and to stay in their own country to do it?',
            ],
          ],
        },
      ],
    },
    {
      t: 'Connectivity: The Way In',
      alt: true,
      l: 'The gap in getting online has narrowed. The gap in how well people are online has widened.',
      b: [
        {
          k: 'hbars',
          max: 100,
          dec: 0,
          suf: '%',
          cols: [
            [
              'Internet use (2024)',
              [
                ['High-income countries', 93],
                ['Upper-middle-income', 81],
                ['Lower-middle-income', 54],
                ['Low-income countries', 27],
              ],
              '#1F5F6B',
            ],
            [
              '5G coverage (2024)',
              [
                ['High-income countries', 84],
                ['Upper-middle-income', 65],
                ['Lower-middle-income', 35],
                ['Low-income countries', 4],
              ],
              '#1F5F6B',
            ],
          ],
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
              '#1F5F6B',
            ],
          ],
          note: 'About 1,400 GB in high-income, 400 GB upper-middle, 100 GB lower-middle and 5 GB low-income countries. This gap is widening.',
        },
        {
          k: 'cards',
          items: [
            [
              'Growth (2022 to 2024)',
              'From 2022 to 2024 the low-income group grew 3 points, lower-middle 5, upper-middle 4 and high-income 2.',
            ],
            [
              'Speed (2023 to 2024)',
              'Internet speeds rose about 50% in high-income and upper-middle-income countries. In low- and lower-middle-income countries the median stayed under 25 mbps.',
            ],
            [
              'Satellites',
              'Commercial communication satellites in orbit are 14 times more numerous than a decade ago, opening new options for hard-to-reach places.',
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
      t: 'Compute: The "New Electricity"',
      l: 'Computing power is the fuel AI runs on, and who has it is very uneven.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'Servers (2024)',
              "50% of the world's secure internet servers are in the United States, 41% in other high-income countries and 9% everywhere else. Per person, the US has about 200 times more servers than a typical middle-income country and 20,000 times more than a low-income one.",
            ],
            [
              'Data centres (June 2025)',
              'High-income countries hold 77% of global co-location data-centre capacity, upper-middle 18%, lower-middle 5% and low-income under 0.1%.',
            ],
            [
              'Supercomputers (June 2025)',
              "High-income countries host 86% of the world's top 500 supercomputers and 97% of their capacity.",
            ],
            [
              'Cloud (2023)',
              'The United States supplies about 87% of global cloud computing exports. Roughly 84% of those go to high-income countries and 16% to middle-income countries, with almost none to low-income countries.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'The choice for governments',
          p: 'Build local data centres, or rent computing power from abroad? The report says a good local data centre can bring jobs and digital independence, but it needs cheap reliable power and enough local demand, and it can strain electricity grids and the environment.',
        },
      ],
    },
    {
      t: 'Context: Data, Language and Local Fit',
      alt: true,
      l: 'AI is only as good as the data it learns from, and most of that data looks like the rich world.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'Training-data business (2024)',
              'About 85% of AI training-data start-ups are in high-income countries. Of the venture money that has gone into this industry, 56% went to the US, 17% to China, 15% to the European Union, 3% to India and 2% to the UK (through 2023).',
            ],
            [
              'English dominates',
              "English is spoken by 19% of the world's people but is 45% of web addresses, 56% of the open data sets on a leading AI platform, and nearly 98% of scientific papers.",
            ],
            [
              'Video and audio are a way in',
              'Only 21% of YouTube videos are in English. Hindi is about 8% and Arabic about 3%, so these formats give non-English countries room to take part.',
            ],
            [
              'Open source helps',
              'Open-source AI lets countries adapt global tools to local needs instead of building from scratch. The report says most developing countries may not need to build their own foundation models, and can adapt existing open-source platforms instead.',
            ],
          ],
        },
      ],
    },
    {
      t: 'Competency: Skills and People',
      l: 'Skills decide who gets the jobs and who can adapt AI.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'Basic digital skills (2023)',
              '66% of people in high-income countries, 38% upper-middle, 21% lower-middle and under 5% in low-income countries.',
            ],
            [
              'Advanced skills (2023)',
              'Less than 10% in high-income countries, 3.5% upper-middle, 1.6% lower-middle and under 1% low-income.',
            ],
            [
              'AI job postings are growing faster in middle-income countries',
              'Vacancies asking for AI skills (not counting generative AI) grew 16% in upper-middle-income countries, 11% in lower-middle and 2% in high-income countries from 2021 to 2024. They doubled in Egypt, Pakistan and the Philippines and grew fourfold in Kenya, from a very low base. Jobs asking for generative AI skills grew ninefold worldwide from 2022 to 2024.',
            ],
            [
              'Brain drain',
              'In countries like Bangladesh, Lebanon, Nigeria and Ukraine, skilled people leave at three to four times the rate they arrive.',
            ],
          ],
        },
      ],
    },
    {
      t: 'What the Report Asks for - And What it Warns About',
      alt: true,
      l: 'The message in one frame, with the caution that comes with it.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'Invest by readiness',
              'Each country should invest according to where it is on the four foundations, tailored to its own readiness.',
            ],
            [
              'Localise',
              'Adapt and customise models to local languages, sectors and problems.',
            ],
            [
              'Act now',
              'The report calls this a defining moment, because AI is reshaping which countries have a comparative advantage, in jobs and exports.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'A balanced view',
          p: 'AI can lower barriers to information and services. It can also potentially intensify competition among workers and firms and widen inequality between and within countries. The report warns developing economies that fall behind risk "premature de-professionalization", with less room to create high-skilled, high-income jobs. The long-term outcome is described as highly uncertain.',
        },
      ],
    },
    {
      t: 'Jargon Cards',
      b: [
        {
          k: 'jargon',
          terms: [
            {
              t: 'Low-, middle- and high-income countries (LIC, MIC, HIC)',
              p: 'The World Bank\'s groups by national income. "Upper-middle" and "lower-middle" split the middle group.',
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
            'The numbers are not an argument for despair. They show where help is most useful: connection, power, local data and skills.',
            'Small AI matters most for people serving in places with thin infrastructure, because it works with what they have today.',
            'Whoever is not at the table when AI tools are built gets tools that do not fit them. Language and context are part of fairness.',
          ],
        },
      ],
    },
  ],
  foot:
    'Digital Progress and Trends Report 2025: Strengthening AI Foundations, The World Bank, 2025. All numbers on this page come from that report.',
  pages:
    '87% notable models, 93% vs 27% internet use, 50% secure servers, 66% vs under 5% basic skills, data volume and compute capacity metrics.',
}
