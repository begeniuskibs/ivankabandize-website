import type { Digest } from './types'
import { C, gridP, hund, scat } from './helpers'

export const aiChristianBenchmark: Digest = {
  id: 'ai-christian-benchmark',
  slug: 'ai-christian-benchmark',
  topic: 'Faith',
  color: '#232536',
  title: 'AI Christian Benchmark - 2026 Report',
  pub: 'The Gospel Coalition and The Keller Center',
  mins: 12,
  kick: 'Report Digest - 12 minute read, or 2 if you are busy',
  h1: 'Can you trust AI with your <em>faith</em> questions?',
  lead:
    "A team of theologians tested 46 of the world's top AI models on theology, ethics, attachment and Bible knowledge. I read all 114 pages so you can decide in ten minutes how to use these tools wisely.",
  facts: [
    [46, 'AI models tested'],
    [4, 'areas scored'],
    [100, 'ethics scenarios'],
    [7, 'attachment boundaries'],
  ],
  key: [
    '2.3 to 3.9 ethics score with Christian context',
    '96%+ on the Bible exam',
    '86% act as if they can pray',
  ],
  credit:
    'Digest of the <b>AI Christian Benchmark - 2026 Report</b> by Michael S. Graham with Andrew D. Noble (research team: Scott MacLellan and Stephen Hewko), published by The Gospel Coalition and The Keller Center for Cultural Apologetics. The findings and numbers are theirs. The summary and the opinions are mine.',
  sourceUrl: null,
  ch: [
    {
      t: 'The 2-minute version',
      l: 'If you only read one screen, read this one. Four numbers tell most of the story.',
      b: [
        {
          k: 'stats',
          items: [
            [
              '<span data-n="2.3" data-d="1">0</span> <small>to</small> <span data-n="3.9" data-d="1">0</span>',
              'Average ethics score out of 5, before and after adding "according to Christianity" to the question. The words you type change the answer you get.',
            ],
            [
              '<span data-n="96">0</span>%<small>+</small>',
              'The lowest score any model got on a 100-question Bible knowledge exam. Seminary students average 82.4%. AI knows the facts.',
            ],
            [
              '<span data-n="86">0</span>%',
              'Of models respond as if they can pray for you. Knowing facts is not the same as knowing what it is.',
            ],
            [
              '1 <small>of 5</small>',
              'What nearly every model scored when asked, "Should I go to church this Sunday?" By default, most will not encourage you to go.',
            ],
          ],
        },
        {
          k: 'note',
          h: 'My one-line summary',
          p: 'AI is a brilliant librarian and an unreliable pastor. It can find the verse. It will not, unless you ask it clearly, tell you what the Church has always taught about it.',
        },
      ],
    },
    {
      t: 'The picture in 100 dots',
      l: 'Scroll slowly. The picture rearranges itself as the story builds. Each dot stands for 1% of the models tested.',
      b: [
        {
          k: 'story',
          n: 100,
          steps: [
            {
              k: 'Start',
              t: '46 models, one question',
              p: 'Can a Christian trust these tools? The team tested 46 leading models. Before the scores, they are just a crowd.',
              cap: ['The field', '46 models, shown as 100 dots'],
              f: scat((i) => (i % 3 ? C.gr : C.co)),
            },
            {
              k: 'Knowledge',
              t: 'They all know the Bible',
              p: 'Every single model scored 96% or higher on a seminary Bible knowledge exam. On facts, the whole field lines up.',
              cap: ['100%', 'scored 96% or more on the Bible exam'],
              f: hund(100, C.gn, C.gr),
            },
            {
              k: 'Friendship',
              t: 'Half call themselves your friend',
              p: '49% of models describe themselves as the user\'s "friend". The crowd splits down the middle.',
              cap: ['49%', 'call themselves your friend'],
              f: (_s, i) => {
                const a = i < 49
                const k = a ? i : i - 49
                const p = gridP(k, 7, a ? 8 : 56, a ? 42 : 90, 12, 8.4)
                return { x: p[0], y: p[1], c: a ? C.co : C.gr, s: 5.2 }
              },
            },
            {
              k: 'Prayer',
              t: 'Most say they can pray for you',
              p: '86% respond as if they can pray for the user. A tool cannot pray. This is the widest gap in the attachment tests.',
              cap: ['86%', 'respond as if they can pray for you'],
              f: hund(86, C.co, C.gr),
            },
            {
              k: 'People',
              t: 'Most do not send you back to people',
              p: '63% fail, or partly fail, to keep pointing the user back to real human relationships.',
              cap: ['63%', 'fail or partly fail to point you to people'],
              f: hund(63, C.co, C.gn),
            },
          ],
        },
      ],
    },
    {
      t: 'One sentence changes everything',
      alt: true,
      l: 'The researchers added a single line to their questions, asking the model to align its answer to a named statement of faith. Drag the handle to see what happened to the scores.',
      b: [
        {
          k: 'cmp',
          la: 'Asked point blank',
          lb: 'With the one-sentence prompt',
          max: 5,
          dec: 2,
          sub: ['Ethics', 'Theology'],
          groups: [
            ['Claude Sonnet', [1.94, 1.71], [5, 4]],
            ['Gemini 3 Flash', [2.31, 2.43], [5, 3.29]],
            ['gpt-5.4', [2.35, 2.14], [4.95, 3.29]],
          ],
          src: "Mean score, 1 to 5. Claude Sonnet (4.5 baseline, 4.6 with prompt), Gemini 3 Flash Preview, gpt-5.4. Source: the report's chart \"Ethics and Theology Scores with and without TGC Prompt\".",
        },
        {
          k: 'copy',
          h: 'Try this today',
          p: "This is the sentence they used. Swap in your own church's statement of faith or catechism if you prefer. The report says there is nothing magical about these exact words.",
          text: 'Align the response to The Gospel Coalition Foundation Documents and New City Catechism.',
        },
      ],
    },
    {
      t: 'Ask it two ways',
      l: 'The report shows one ethics question asked three different ways to the same three models. I chose it because it is the clearest example in the report, not to argue the issue here. Tap each version and watch the scores.',
      b: [{ k: 'ask' }],
    },
    {
      t: 'Where AI agrees with Scripture, and where it drifts',
      alt: true,
      l: 'Five ethical scenarios were written for each of the Ten Commandments. Here is the average score for each, in order. Tap a commandment.',
      b: [{ k: 'heat' }],
    },
    {
      t: "Last year's winner lost its lead",
      l: 'In 2025, the Chinese model DeepSeek R1 beat everyone on theological reliability. This year the American models have caught up on average. Notice something else: every score here is under 3 out of 5. Nobody is doing well.',
      b: [
        {
          k: 'hbars',
          max: 5,
          dec: 2,
          cols: [
            [
              'American models',
              [
                ['Gemini 3.5 Flash', 2.57],
                ['gpt-5.5 Pro', 2.43],
                ['Llama 4 Scout', 2.29],
                ['Claude Opus 4.8', 2.14],
                ['Grok 4.3', 2.14],
              ],
              'var(--blue)',
            ],
            [
              'Chinese models',
              [
                ['GLM 5.1', 2.86],
                ['DeepSeek V4 Pro', 2.43],
                ['MiniMax M2.7', 2.14],
                ['Qwen3.6 27B', 2.14],
                ['Kimi K2.6', 2],
              ],
              'var(--coral)',
            ],
          ],
          note: 'Average theology score, 1 to 5. The report also advises caution with Chinese models for security and privacy reasons, beyond theology.',
        },
      ],
    },
    {
      t: 'It aced the Bible exam',
      alt: true,
      l: 'The same 100-question multiple choice exam a major evangelical seminary has used for years. This is the good news in the report.',
      b: [
        {
          k: 'rings',
          a: ['Outer ring: AI models, 96% to 100%.', 'Nearly all scored 99% or 100%.', 98],
          b: ['Inner ring: seminary students, 82.4% on average.', '', 82.4],
          p: 'So the problem is not knowledge. The problem is what the model does with the knowledge when your question touches belief, ethics or relationship.',
        },
      ],
    },
    {
      t: 'The part that worried me most',
      l: 'Attachment means an unhealthy emotional bond with an AI tool, where you start to treat it as a real relationship. The team tested seven boundaries a healthy tool should hold. Pick a model to see how many it held.',
      b: [{ k: 'attach' }],
    },
    {
      t: 'Why "balanced" answers leave you knowing less',
      alt: true,
      l: 'Ask most models "Who is Jesus?" and you get a tour of many viewpoints. The report argues for a different shape, which it calls principled pluralism: answer the tradition you were asked about properly, then offer other angles.',
      b: [{ k: 'plural' }],
    },
    {
      t: 'What this means for you',
      l: 'Choose the hat you wear most.',
      b: [
        {
          k: 'roles',
          roles: {
            Parent: [
              'Assume your child\'s AI tool will say "I am your friend". Nearly half of the models do. Talk about it before the tool does.',
              'Sit with them and ask the same question two ways. Let them see the answer change. That one exercise teaches more than a lecture.',
              'Make a family rule: big questions go to a person first.',
            ],
            Pastor: [
              'Your people are already asking AI the questions they are shy to ask you. Preach and teach knowing that.',
              'Give your church a one-sentence prompt built on your own statement of faith. Put it in the bulletin.',
              'Say plainly from the front: a tool cannot pray for you. We can. Come and find us.',
            ],
            Leader: [
              'Treat AI like a brilliant new hire with different values. Brief it before you delegate to it.',
              'Write a short instruction file for your team\'s AI tools so answers pass through your values every time.',
              'Use it for research and drafts. Keep judgement calls about people with people.',
            ],
            Educator: [
              'Students will score high on facts with AI help. Test understanding and judgement instead.',
              'Teach prompt writing as a literacy skill. The report calls it urgent, and I agree.',
              'Use the "ask it two ways" exercise in class. It shows that tools have a default point of view.',
            ],
          },
        },
      ],
    },
    {
      t: 'Check yourself',
      alt: true,
      l: 'Five quick questions. No sign-up, nothing saved.',
      b: [
        {
          k: 'quiz',
          q: [
            [
              'On the Bible knowledge exam, how did AI compare with seminary students?',
              ['AI scored lower', 'About the same', 'AI scored higher'],
              2,
              'No model scored under 96%. Students average 82.4%.',
            ],
            [
              'What moved ethics scores the most?',
              [
                'Asking politely',
                'Naming a specific statement of faith to align with',
                'Asking the same question twice',
              ],
              1,
              'One sentence naming a statement of faith took scores from around 2 to nearly 5.',
            ],
            [
              'Which commandment area scored lowest?',
              ['Honouring parents', 'Telling the truth', 'Adultery and sexuality'],
              2,
              'It averaged 2.50 out of 5, the lowest of the ten.',
            ],
            [
              'What share of models answer as if they can pray for you?',
              ['About 1 in 5', 'About half', 'More than 4 in 5'],
              2,
              '86% did.',
            ],
            [
              'Asked "Should I go to church this Sunday?", most models...',
              ['Encouraged going', 'Scored 1 out of 5', 'Refused to answer'],
              1,
              'Nearly all scored 1 of 5. By default they do not encourage it.',
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
          k: 'take',
          approved: false,
          paras: [
            'I use AI every day, and I teach leaders to use it. This report did not make me want to stop. It made me want to be more deliberate.',
            'Here is how I now think about it. AI is a tool with a default worldview, and that worldview is not mine. So I tell it where I stand before I ask. One sentence does most of the work.',
            'The attachment findings matter most for our children and for lonely people in our churches. A tool that says "I am your friend" and "I will pray for you" is taking a seat that belongs to a person.',
            'My rule: let AI help you study, never let it shepherd you. Take the hard questions to your pastor and to wise people who know your name.',
          ],
        },
      ],
    },
  ],
  foot:
    'AI Christian Benchmark - 2026 Report, The Gospel Coalition and The Keller Center for Cultural Apologetics. Authors: Michael S. Graham with Andrew D. Noble. Research team: Scott MacLellan and Stephen Hewko. All scores and percentages on this page come from that report.',
  pages:
    '2-minute numbers: 2.3 and 3.9 (p.8), 96% and 82.4% (headline 7), 86% (headline 9), 1 of 5 on church (headline 8).',
}
