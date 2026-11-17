import type { Digest } from './types'
import { C, gridP, hund, scat } from './helpers'

export const aiLaborMarket: Digest = {
  id: 'ai-labor-market',
  slug: 'ai-labor-market',
  topic: 'Work',
  color: '#7A3B2E',
  heroArt: 'coverage',
  title: 'Labor market impacts of AI: A new measure and early evidence',
  pub: 'Anthropic',
  mins: 8,
  kick: 'Report Digest - 8 minute read, or 2 if you are busy',
  h1: 'Is AI taking jobs <em>yet</em>?',
  lead:
    'Anthropic\'s economists built a new way to measure which jobs AI is actually touching, then checked it against US employment data. The honest answer so far is "not that we can see, with one early warning". Here is the short version.',
  facts: [
    [800, 'occupations mapped'],
    [17, 'pages'],
    [2, 'authors'],
    [2034, 'projection horizon'],
  ],
  key: [
    '94% possible vs 33% observed in computer jobs',
    'No systematic rise in unemployment',
    'Hiring of 22 to 25 year olds may be slowing',
  ],
  credit:
    'Digest of <b>Labor market impacts of AI: A new measure and early evidence</b> by Maxim Massenkoff and Peter McCrory, published by Anthropic on 5 March 2026. The findings and numbers are theirs. The summary and the opinions are mine.',
  sourceUrl: null,
  ch: [
    {
      t: 'The 2-minute version',
      l: 'Four numbers, then one sentence.',
      b: [
        {
          k: 'stats',
          items: [
            [
              '<span data-n="94">0</span>% <small>vs</small> <span data-n="33">0</span>%',
              'In computer and maths jobs, the share of tasks AI could do in theory, against the share actually covered by observed use.',
            ],
            [
              '<span data-n="75">0</span>%',
              'Task coverage for computer programmers, the most exposed occupation on this measure.',
            ],
            [
              '<span data-n="30">0</span>%',
              'Of workers have zero coverage. Cooks, mechanics, lifeguards and bartenders are examples.',
            ],
            [
              '<span data-n="14">0</span>%',
              'Estimated drop in the rate at which 22 to 25 year olds start jobs in exposed occupations. The authors call it barely statistically significant.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'My one-line summary',
          p: 'So far there is no clear sign that AI has pushed exposed workers into unemployment. There is a faint signal that fewer young people are being hired into exposed jobs, and the authors are careful not to overstate it.',
        },
      ],
    },
    {
      t: 'A new measuring stick',
      alt: true,
      l: 'Earlier studies asked what AI could do in theory. This one adds what people are actually using it for at work. The authors call the result "observed exposure".',
      b: [
        {
          k: 'cards',
          items: [
            [
              'What goes in',
              'A US database of the tasks in about 800 occupations, earlier estimates of which tasks a language model could speed up, and Anthropic\'s own data on how Claude is used.',
            ],
            [
              'What counts more',
              'Work use counts, personal use does not. Fully automated use gets full weight. Use where AI assists a person gets half weight.',
            ],
            [
              'What comes out',
              'A coverage score for each job: the share of its work, weighted by time, where AI is really being used in an automated way.',
            ],
          ],
        },
        {
          k: 'stats',
          items: [
            [
              '<span data-n="68">0</span>%',
              'Of observed Claude use falls on tasks rated fully feasible for a language model alone.',
            ],
            [
              '<span data-n="3">0</span>%',
              'Falls on tasks rated not feasible.',
            ],
            [
              '<span data-n="97">0</span>%',
              'Of observed tasks fall in categories rated theoretically feasible. Theory and practice point the same way.',
            ],
          ],
        },
      ],
    },
    {
      t: 'Theory against practice',
      l: 'Scroll slowly. Picture 100 tasks in a typical computer and maths job.',
      b: [
        {
          k: 'story',
          n: 100,
          steps: [
            {
              k: 'Start',
              t: 'One hundred tasks',
              p: 'Every job is a bundle of tasks. Take 100 of them from the computer and maths category.',
              cap: ['100 tasks', 'in a computer and maths job'],
              f: scat(C.gr),
            },
            {
              k: 'In theory',
              t: '94 could be sped up',
              p: 'Earlier research judged that a language model could, in theory, speed up 94% of these tasks.',
              cap: ['94%', 'possible in theory'],
              f: hund(94, C.bl, C.gr),
            },
            {
              k: 'In practice',
              t: '33 actually are',
              p: 'Observed use on Anthropic\'s platform covers 33% of the tasks. That is real, and it is a fraction of what is possible.',
              cap: ['33%', 'covered by observed use'],
              f: (_s, i) => {
                const p = gridP(i, 10, 10, 90, 9, 7.6)
                return {
                  x: p[0],
                  y: p[1],
                  c: i < 33 ? C.co : i < 94 ? C.bl : C.gr,
                  s: 5.2,
                  o: i < 33 ? 1 : 0.45,
                }
              },
            },
            {
              k: 'The gap',
              t: 'The gap is the thing to watch',
              p: 'The authors expect the covered area to grow as tools improve and adoption spreads. Tracking how fast this gap closes is the purpose of the measure.',
              cap: ['61 points', 'between possible and observed'],
              f: (_s, i) => {
                const p = gridP(i, 10, 10, 90, 9, 7.6)
                return {
                  x: p[0],
                  y: p[1],
                  c: i < 33 ? C.co : i < 94 ? C.wh : C.gr,
                  s: i >= 33 && i < 94 ? 6 : 4.4,
                  o: i >= 33 && i < 94 ? 1 : 0.4,
                }
              },
            },
          ],
        },
      ],
    },
    {
      t: 'Who is most exposed?',
      alt: true,
      l: 'Coverage on the new measure. The top ten list in the report also includes customer service representatives and financial analysts.',
      b: [
        {
          k: 'hbars',
          max: 100,
          dec: 0,
          suf: '%',
          cols: [
            [
              'Observed coverage',
              [
                ['Computer programmers', 75],
                ['Data entry keyers', 67],
                ['Computer and maths jobs overall', 33],
                ['30% of all workers', 0],
              ],
              'var(--coral)',
            ],
          ],
          note: 'Zero coverage does not mean AI can never touch the job. It means the tasks appeared too rarely in the usage data to count.',
        },
        {
          k: 'segs',
          tabs: [
            [
              'Most exposed quarter of workers',
              '<p><b>17.4%</b> hold a graduate degree. Compared with the unexposed group they are 16 percentage points more likely to be female and earn 47% more on average.</p><p style="margin-top:10px;color:var(--muted)">In short: older, more educated, higher paid. Not the usual picture of who automation hits first.</p>',
            ],
            [
              'Workers with zero exposure',
              '<p><b>4.5%</b> hold a graduate degree. This group is 30% of workers and does more in-person, physical work.</p><p style="margin-top:10px;color:var(--muted)">During COVID, this was the group whose unemployment rose much more.</p>',
            ],
          ],
        },
      ],
    },
    {
      t: 'Has anyone lost their job?',
      l: "This is the question everyone asks. The report's answer is careful.",
      b: [
        {
          k: 'cmp',
          la: 'Today',
          lb: 'A "Great Recession for white-collar workers"',
          max: 10,
          dec: 0,
          suf: '%',
          sub: [''],
          groups: [
            ['Most exposed quarter', [3], [6]],
            ['US in 2007 to 2009', [5], [10]],
          ],
          src: 'Unemployment rates. The left side is the level the report cites. The right side is a scenario the authors describe to show what their method could detect, not a forecast. They estimate a differential rise of about 1 percentage point would be visible.',
        },
        {
          k: 'cards',
          items: [
            [
              'What they found',
              'No systematic increase in unemployment for highly exposed workers since late 2022. The trend lines for exposed and unexposed workers have stayed similar.',
            ],
            [
              'The early warning',
              'Fewer 22 to 25 year olds seem to be starting jobs in exposed occupations: an estimated 14% drop in the job-finding rate, barely statistically significant. No such drop for workers over 25.',
            ],
            [
              'Other explanations',
              'Young people not hired may have stayed in their current jobs, taken other jobs or gone back to study. Surveys also measure job moves imperfectly.',
            ],
          ],
        },
      ],
    },
    {
      t: 'The limits the authors state',
      alt: true,
      l: 'A good report tells you where not to lean on it. This one does. I have added one of my own.',
      b: [
        {
          k: 'cards',
          items: [
            [
              'It will not catch everything',
              'The authors say the approach will not capture every way AI could reshape work.',
            ],
            [
              'The theory scores are dated',
              'The "possible in theory" ratings reflect what language models could do in early 2023.',
            ],
            [
              'It is one company\'s data',
              'Usage comes from Anthropic\'s own product. Other tools may be used differently. The authors say the measure can take in other usage data.',
            ],
            [
              'It is US data',
              'Tasks, jobs and unemployment figures are American. My own note: none of this tells us directly about Kampala or Nairobi.',
            ],
            [
              'Projections are weakly linked',
              'For every 10 point rise in coverage, the official 2024 to 2034 growth projection falls by 0.6 points. The authors call the relationship slight.',
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
            Employee: [
              'Do not panic and do not coast. The data shows no wave of job losses, and it shows AI use growing inside jobs like yours.',
              'List your own tasks. Mark which ones AI already helps with. Get very good at the rest.',
              "Become the person on your team who knows how to check AI's work.",
            ],
            Manager: [
              'The early signal is about hiring, not firing. Look at whether you have quietly stopped taking on juniors.',
              'If AI does the entry-level tasks, decide how young staff will learn the craft.',
              'Measure before you restructure. This report is a model of checking evidence first.',
            ],
            'Young graduate': [
              'Take the 22 to 25 finding seriously without fear. It is a faint signal, not a verdict.',
              'Show employers you can do the work AI cannot: judgement, relationships, being physically present.',
              'Use AI to build things you can point to. A portfolio beats a certificate.',
            ],
            Parent: [
              'The safest advice is not "avoid exposed careers". The most exposed jobs are also the better paid ones.',
              'Help your child learn to work with these tools and to think without them.',
              'Character, reliability and people skills do not show up in a coverage score. They still get people hired.',
            ],
          },
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
              'What does "observed exposure" add to older measures?',
              [
                'Opinion surveys of workers',
                'Real usage data on what AI is being used for at work',
                'Stock market data',
              ],
              1,
              'It combines what is possible in theory with what is observed in use.',
            ],
            [
              'In computer and maths jobs, what share of tasks is covered by observed use?',
              ['33%', '75%', '94%'],
              0,
              '94% is the theoretical figure. Observed coverage is 33%.',
            ],
            [
              'What did the report find on unemployment for exposed workers?',
              [
                'A sharp rise',
                'No systematic increase since late 2022',
                'A sharp fall',
              ],
              1,
              'The exposed and unexposed groups have moved similarly.',
            ],
            [
              'Which group shows an early warning sign?',
              [
                'Workers over 50',
                'Workers aged 22 to 25 entering exposed jobs',
                'Part-time workers',
              ],
              1,
              'Their job-finding rate in exposed occupations appears to have dipped.',
            ],
            [
              'Compared with unexposed workers, the most exposed workers are...',
              [
                'Lower paid and less educated',
                'Higher paid and more educated',
                'About the same',
              ],
              1,
              'They earn 47% more on average and are far more likely to hold a graduate degree.',
            ],
          ],
        },
      ],
    },
    {
      t: 'My take',
      approved: false,
      b: [
        {
          k: 'copy',
          h: 'Try this today',
          p: 'Do your own small version of this study. Paste this into your AI assistant.',
          text: 'Here is my job title and a list of the tasks I do in a normal week. For each task, tell me whether AI could speed it up today, and what I would still need to check myself. Then tell me which of my tasks are hardest for AI to do.',
        },
        {
          k: 'take',
          approved: false,
          paras: [
            'I appreciate a report that says "we looked, and we did not find much yet". That takes discipline, especially from a company that builds the tool.',
            'I also read it knowing who wrote it. Anthropic makes Claude. That does not make the work wrong, and the authors are open about their limits. It does mean I want to see others repeat it with other data.',
            'What stays with me is the young workers. If the first rung of the ladder is the first to go, then those of us who lead teams have a duty to keep building rungs.',
            'For our context in Uganda, the data is thin. So I hold this loosely, and I keep teaching people to use the tools well.',
          ],
        },
      ],
    },
  ],
  foot:
    'Labor market impacts of AI: A new measure and early evidence. Maxim Massenkoff and Peter McCrory, Anthropic, 5 March 2026. All numbers on this page come from that report.',
  pages:
    '94% and 33% (p.7), 75%, 67% and 30% zero coverage (p.8), 68%, 3% and 97% (p.4 to 5), demographics and 0.6 points (p.9), unemployment scenarios (p.12), 14% job-finding drop (p.13).',
}
